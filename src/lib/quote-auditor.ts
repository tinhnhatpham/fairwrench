import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import {
  REPAIR_BENCHMARKS,
  computeFairRange,
  getMakeMultiplier,
  getRegionalLaborTier,
  matchRepairBenchmark,
} from "./repair-benchmarks";
import type {
  AuditedLineItem,
  ItemVerdict,
  NegotiationScript,
  NhtsaReport,
  QuoteAuditResult,
  SafetyPriority,
  VehicleProfile,
} from "./types";

export interface AuditInput {
  vehicle: VehicleProfile;
  shopType: "dealership" | "independent" | "chain" | "unknown";
  quoteText?: string;
  imageBase64?: string;
  imageMimeType?: string;
  nhtsa: NhtsaReport | null;
}

interface ParsedRawItem {
  description: string;
  price: number;
}

function parseQuoteLines(text: string): ParsedRawItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedRawItem[] = [];

  for (const line of lines) {
    // Ignore obvious total/subtotal/tax lines
    if (/^(sub\s*total|total|grand total|sales tax|tax)\b/i.test(line)) continue;

    // Match trailing or embedded price like "$845.00" or "845"
    const match = line.match(/(.*?)(?:[-–—:|]\s*)?\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*$/);
    if (match) {
      const desc = match[1].replace(/[-–—:|•*]+$/g, "").trim();
      const price = Number(match[2].replace(/,/g, ""));
      if (desc.length >= 2 && Number.isFinite(price) && price > 0 && price < 50000) {
        items.push({ description: desc, price: Math.round(price) });
      }
    }
  }
  return items;
}

const RECALL_STOPWORDS = new Set([
  "front",
  "rear",
  "upper",
  "lower",
  "inner",
  "outer",
  "right",
  "driver",
  "passenger",
  "replace",
  "replacement",
  "service",
  "system",
  "fluid",
  "flush",
  "exchange",
  "clean",
  "cleaning",
  "check",
  "inspection",
  "assembly",
  "labor",
  "parts",
  "supplies",
  "environmental",
  "diagnostic",
]);

function findRecallOverlap(
  description: string,
  hints: string[] | undefined,
  nhtsa: NhtsaReport | null
): string | undefined {
  if (!nhtsa || nhtsa.recalls.length === 0) return undefined;
  const lower = description.toLowerCase();

  for (const recall of nhtsa.recalls) {
    const comp = recall.component.toLowerCase();
    if (hints?.some((h) => comp.includes(h.toLowerCase()))) {
      return `Open NHTSA Recall ${recall.campaignNumber} (${recall.component}) — dealers must repair recall defects for $0.`;
    }
    const tokens = lower
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 5 && !RECALL_STOPWORDS.has(t));
    if (tokens.some((tok) => comp.includes(tok))) {
      return `Possible overlap with NHTSA Recall ${recall.campaignNumber} (${recall.component}). Ask the dealer to verify free recall coverage first.`;
    }
  }
  return undefined;
}

function buildNegotiationScripts(
  items: AuditedLineItem[],
  vehicle: VehicleProfile,
  nhtsa: NhtsaReport | null
): NegotiationScript[] {
  const upsells = items.filter((i) => i.verdict === "upsell_trap" || i.priority === "likely_unnecessary");
  const overpriced = items.filter((i) => i.verdict === "overpriced" || i.verdict === "high");
  const scripts: NegotiationScript[] = [];

  if (upsells.length > 0) {
    const names = upsells.map((u) => u.matchedRepairName).join(", ");
    const sum = upsells.reduce((acc, u) => acc + u.quotedPrice, 0);
    scripts.push({
      title: "Decline Padded Upsells Politely",
      scenario: "When the advisor hands you a long 'recommended services' sheet",
      estimatedSavings: `Save up to $${sum.toLocaleString()}`,
      script: `"Thanks for the inspection. For today, please only authorize the safety-critical repair. I'm going to hold off on ${names}—I follow the factory ${vehicle.year} ${vehicle.make} ${vehicle.model} maintenance schedule and take care of basic filters separately."`,
    });
  }

  if (overpriced.length > 0) {
    const top = [...overpriced].sort((a, b) => b.estimatedOvercharge - a.estimatedOvercharge)[0];
    scripts.push({
      title: "Challenge Book Labor & Parts Markup",
      scenario: `Pushing back on ${top.shopDescription} ($${top.quotedPrice.toLocaleString()})`,
      estimatedSavings: `Target $${Math.max(40, top.estimatedOvercharge).toLocaleString()} off`,
      script: `"Could you share the exact book labor hours and parts breakdown for the ${top.shopDescription}? Local independent shops in my area typically complete this job in ${top.bookHoursRange} around $${top.fairLow.toLocaleString()}–$${top.fairHigh.toLocaleString()}. If you can get closer to $${top.fairHigh.toLocaleString()} or waive the diagnostic fee toward the job, I can approve it right now."`,
    });
  }

  if (nhtsa && nhtsa.recalls.length > 0) {
    const firstRecall = nhtsa.recalls[0];
    scripts.push({
      title: "Check Free Recall & TSB Coverage First",
      scenario: `${nhtsa.recalls.length} NHTSA recall(s) found for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      estimatedSavings: "Potentially $0 out-of-pocket",
      script: `"Before I authorize paid repairs, can you run my VIN for open safety recalls—specifically NHTSA Campaign ${firstRecall.campaignNumber} (${firstRecall.component})—and check if there are any Technical Service Bulletins or extended factory warranties covering this issue?"`,
    });
  }

  if (scripts.length < 3) {
    scripts.push({
      title: "Separate Must-Fix Safety from Can-Wait",
      scenario: "Before signing any work order",
      estimatedSavings: "Prevents unnecessary work",
      script: `"Please split this estimate into two columns: what is strictly unsafe to drive home today, and what can safely wait 60 days. Also, please keep the old replaced parts in a box in my trunk when the job is done."`,
    });
  }

  return scripts.slice(0, 3);
}

function runGroundedDeterministicAudit(input: AuditInput): QuoteAuditResult {
  const laborTier = getRegionalLaborTier(input.vehicle.zipCode);
  const makeMult = getMakeMultiplier(input.vehicle.make);
  const rawItems = parseQuoteLines(input.quoteText ?? "");

  if (rawItems.length === 0) {
    throw new Error(
      "Could not detect line items with prices. Paste lines like 'Front Brake Pads & Rotors - $845' or upload a quote photo with GEMINI_API_KEY configured."
    );
  }

  const lineItems: AuditedLineItem[] = rawItems.map((raw, idx) => {
    const benchmark = matchRepairBenchmark(raw.description);

    if (benchmark) {
      const fair = computeFairRange(benchmark, laborTier, makeMult);
      const isTrap = Boolean(
        benchmark.isCommonUpsellTrap &&
          (benchmark.priority === "likely_unnecessary" || raw.price > fair.fairHigh * 1.05)
      );
      let verdict: ItemVerdict = "fair";

      if (isTrap) {
        verdict = "upsell_trap";
      } else if (raw.price > fair.fairHigh * 1.25) {
        verdict = "overpriced";
      } else if (raw.price > fair.fairHigh * 1.05) {
        verdict = "high";
      }

      const estimatedOvercharge =
        verdict === "fair"
          ? 0
          : benchmark.priority === "likely_unnecessary"
            ? raw.price
            : Math.max(0, raw.price - fair.fairHigh);

      const recallOverlap = findRecallOverlap(raw.description, benchmark.recallComponentHints, input.nhtsa);

      let explanation = benchmark.upsellNote ?? "";
      if (!explanation) {
        if (verdict === "fair") {
          explanation = `Quoted price ($${raw.price}) sits within the normal local range ($${fair.fairLow}–$${fair.fairHigh}) for ${laborTier.label}.`;
        } else {
          explanation = `Quoted $${raw.price} exceeds typical local independent pricing ($${fair.fairLow}–$${fair.fairHigh}) based on ${benchmark.bookHoursLow}–${benchmark.bookHoursHigh} book hours and $${fair.partsLow}–$${fair.partsHigh} in parts.`;
        }
      }

      const negotiationTip = benchmark.isDiyEasy
        ? `Decline at the shop—this part is ~$${fair.partsLow}–$${fair.partsHigh} online and takes under 5 minutes DIY.`
        : verdict === "upsell_trap"
          ? `Ask to remove this add-on unless the shop proves it is explicitly required by the OEM maintenance schedule.`
          : verdict === "fair"
            ? `Pricing looks reasonable. Just confirm parts warranty (12–24 months) before approving.`
            : `Ask for itemized book labor hours and parts markup; aim to negotiate down toward $${fair.fairHigh}.`;

      return {
        id: `item-${idx + 1}`,
        shopDescription: raw.description,
        matchedRepairName: benchmark.name,
        quotedPrice: raw.price,
        fairLow: fair.fairLow,
        fairHigh: fair.fairHigh,
        estimatedOvercharge,
        bookHoursRange: `${benchmark.bookHoursLow}–${benchmark.bookHoursHigh} hrs`,
        partsRange: `$${fair.partsLow}–$${fair.partsHigh}`,
        verdict,
        priority: benchmark.priority,
        explanation,
        negotiationTip,
        isDiyEasy: benchmark.isDiyEasy,
        recallOverlap,
      };
    }

    // Unknown custom repair line item: apply conservative regional benchmark band
    const fairLow = Math.max(25, Math.round((raw.price * 0.72) / 5) * 5);
    const fairHigh = Math.max(40, Math.round((raw.price * 0.94) / 5) * 5);
    const dealerPenalty = input.shopType === "dealership" ? 0.14 : 0.05;
    const verdict: ItemVerdict =
      input.shopType === "dealership" && raw.price >= 200 ? "high" : "fair";
    const estimatedOvercharge =
      verdict === "high" ? Math.round(raw.price * dealerPenalty) : 0;

    return {
      id: `item-${idx + 1}`,
      shopDescription: raw.description,
      matchedRepairName: raw.description,
      quotedPrice: raw.price,
      fairLow,
      fairHigh,
      estimatedOvercharge,
      bookHoursRange: "Verify book hrs",
      partsRange: "Ask for part #",
      verdict,
      priority: "recommended_soon",
      explanation:
        "Custom repair line item. Ask the advisor for the exact OEM/aftermarket part numbers and flat-rate labor hours to compare apples-to-apples.",
      negotiationTip: "Request an itemized parts vs. labor breakdown before approving.",
      recallOverlap: findRecallOverlap(raw.description, undefined, input.nhtsa),
    };
  });

  return finalizeAuditResult("grounded_benchmark", input, laborTier, lineItems);
}

function finalizeAuditResult(
  engineMode: "gemini_vision" | "grounded_benchmark",
  input: AuditInput,
  laborTier: ReturnType<typeof getRegionalLaborTier>,
  lineItems: AuditedLineItem[],
  aiHeadline?: string,
  aiInsight?: string
): QuoteAuditResult {
  const totalQuoted = lineItems.reduce((sum, i) => sum + i.quotedPrice, 0);
  const fairTotalLow = lineItems
    .filter((i) => i.priority !== "likely_unnecessary")
    .reduce((sum, i) => sum + i.fairLow, 0);
  const fairTotalHigh = lineItems
    .filter((i) => i.priority !== "likely_unnecessary")
    .reduce((sum, i) => sum + i.fairHigh, 0);

  const rawOvercharge = lineItems.reduce((sum, i) => sum + i.estimatedOvercharge, 0);
  const estimatedSavingsLow = Math.max(0, Math.round(rawOvercharge * 0.65));
  const estimatedSavingsHigh = Math.max(estimatedSavingsLow, Math.round(rawOvercharge));

  const overchargeRatio = totalQuoted > 0 ? rawOvercharge / totalQuoted : 0;
  const upsellCount = lineItems.filter((i) => i.verdict === "upsell_trap").length;

  let fairnessScore = Math.round(100 - overchargeRatio * 125 - upsellCount * 6);
  fairnessScore = Math.max(12, Math.min(98, fairnessScore));

  let overallVerdict: QuoteAuditResult["overallVerdict"] = "FAIR_QUOTE";
  if (fairnessScore < 45 || overchargeRatio >= 0.35) overallVerdict = "MAJOR_RIPOFF";
  else if (fairnessScore < 68 || overchargeRatio >= 0.18) overallVerdict = "OVERCHARGED";
  else if (fairnessScore < 84 || overchargeRatio >= 0.08) overallVerdict = "SLIGHTLY_HIGH";

  const defaultHeadlines: Record<QuoteAuditResult["overallVerdict"], string> = {
    FAIR_QUOTE: "Solid Quote — Pricing Looks Reasonable",
    SLIGHTLY_HIGH: `Slightly Above Market — Room to Trim ~$${estimatedSavingsHigh}`,
    OVERCHARGED: `Overpriced Quote — ~$${estimatedSavingsLow}–$${estimatedSavingsHigh} in Potential Savings`,
    MAJOR_RIPOFF: `Major Red Flags — Up to $${estimatedSavingsHigh} in Overcharges & Upsells`,
  };

  const defaultInsight =
    overallVerdict === "FAIR_QUOTE"
      ? `Your $${totalQuoted.toLocaleString()} quote aligns well with independent labor rates ($${laborTier.independentLow}–$${laborTier.independentHigh}/hr) for ${laborTier.label}.`
      : `We flagged ${lineItems.filter((i) => i.verdict !== "fair").length} of ${lineItems.length} line items above fair local benchmarks for ${laborTier.label} ($${laborTier.independentLow}–$${laborTier.independentHigh}/hr), including ${upsellCount} common upsell trap(s).`;

  const mustDoNow = lineItems
    .filter((i) => i.priority === "safety_critical")
    .map((i) => `${i.shopDescription} (Target fair price: $${i.fairLow}–$${i.fairHigh})`);

  const canWaitOrDecline = lineItems
    .filter((i) => i.priority === "likely_unnecessary" || i.priority === "can_wait")
    .map((i) => `${i.shopDescription} — save $${i.quotedPrice}`);

  return {
    auditId: crypto.randomBytes(6).toString("hex"),
    engineMode,
    vehicle: input.vehicle,
    regionLabel: laborTier.label,
    regionalLaborRate: {
      independentLow: laborTier.independentLow,
      independentHigh: laborTier.independentHigh,
      dealerHigh: laborTier.dealerHigh,
    },
    shopType: input.shopType,
    fairnessScore,
    overallVerdict,
    summaryHeadline: aiHeadline || defaultHeadlines[overallVerdict],
    summaryInsight: aiInsight || defaultInsight,
    totalQuoted,
    fairTotalLow,
    fairTotalHigh,
    estimatedSavingsLow,
    estimatedSavingsHigh,
    lineItems,
    nhtsa: input.nhtsa,
    negotiationScripts: buildNegotiationScripts(lineItems, input.vehicle, input.nhtsa),
    safetyChecklist: {
      mustDoNow,
      canWaitOrDecline,
    },
    createdAt: new Date().toISOString(),
  };
}

export async function runQuoteAudit(input: AuditInput): Promise<QuoteAuditResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const laborTier = getRegionalLaborTier(input.vehicle.zipCode);
  const makeMult = getMakeMultiplier(input.vehicle.make);

  // If image is uploaded without GEMINI_API_KEY and no quoteText, return clear guidance
  if (!apiKey) {
    if (!input.quoteText?.trim() && input.imageBase64) {
      throw new Error(
        "Photo OCR requires a free GEMINI_API_KEY in .env.local. You can paste your quote line items below right now to test the instant benchmark engine without an API key!"
      );
    }
    return runGroundedDeterministicAudit(input);
  }

  // Ground Gemini with our exact labor tier, repair benchmarks, and NHTSA recalls so it NEVER hallucinates wild prices
  const benchmarkContext = REPAIR_BENCHMARKS.map((b) => {
    const r = computeFairRange(b, laborTier, makeMult);
    return `- ${b.name}: fair $${r.fairLow}-$${r.fairHigh} (${b.bookHoursLow}-${b.bookHoursHigh} hrs, parts $${r.partsLow}-$${r.partsHigh}, priority=${b.priority}${b.isCommonUpsellTrap ? ", COMMON_UPSELL_TRAP" : ""}${b.isDiyEasy ? ", DIY_EASY" : ""})`;
  }).join("\n");

  const recallContext = input.nhtsa?.recalls.length
    ? input.nhtsa.recalls
        .slice(0, 5)
        .map((r) => `- Campaign ${r.campaignNumber}: ${r.component} — ${r.summary.slice(0, 140)}`)
        .join("\n")
    : "No open NHTSA recalls returned for this model year.";

  const systemInstruction = `You are FairWrench, an ASE-master-technician consumer advocate who audits automotive repair estimates.
Your job is to extract every repair line item and price from the user's quote (photo or text) and audit it strictly against the grounded local benchmarks provided.
NEVER invent unrealistically cheap prices. Anchor estimates strictly to the local labor rate and benchmark table below.

VEHICLE: ${input.vehicle.year} ${input.vehicle.make} ${input.vehicle.model} ${input.vehicle.trim ?? ""} (${input.vehicle.mileage ? `${input.vehicle.mileage} miles` : "mileage unknown"})
SHOP TYPE: ${input.shopType}
LOCAL LABOR RATES (${laborTier.label}): Independent $${laborTier.independentLow}-$${laborTier.independentHigh}/hr | Dealership up to $${laborTier.dealerHigh}/hr

GROUNDED BENCHMARKS FOR THIS VEHICLE & REGION:
${benchmarkContext}

LIVE NHTSA RECALLS FOR THIS VEHICLE:
${recallContext}

Rules:
- Exclude tax/subtotal/grand total rows from lineItems.
- Classify verdict as: "fair", "high", "overpriced", or "upsell_trap".
- Classify priority as: "safety_critical", "recommended_soon", "can_wait", or "likely_unnecessary".
- Keep explanations crisp, factual, and specific to parts + labor hours.`;

  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mime_type: string }
  > = [
    {
      type: "text",
      text: input.quoteText?.trim()
        ? `Audit this mechanic repair estimate:\n\n${input.quoteText.trim()}`
        : "Extract every line item and dollar amount from this mechanic estimate image and audit each item against the grounded regional benchmarks.",
    },
  ];

  if (input.imageBase64 && input.imageMimeType) {
    contentParts.push({
      type: "image",
      data: input.imageBase64,
      mime_type: input.imageMimeType,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: "gemini-4-hydrogen",
      system_instruction: systemInstruction,
      input: contentParts,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          required: ["summaryHeadline", "summaryInsight", "lineItems"],
          properties: {
            summaryHeadline: { type: "string" },
            summaryInsight: { type: "string" },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "shopDescription",
                  "matchedRepairName",
                  "quotedPrice",
                  "fairLow",
                  "fairHigh",
                  "bookHoursRange",
                  "partsRange",
                  "verdict",
                  "priority",
                  "explanation",
                  "negotiationTip",
                ],
                properties: {
                  shopDescription: { type: "string" },
                  matchedRepairName: { type: "string" },
                  quotedPrice: { type: "number" },
                  fairLow: { type: "number" },
                  fairHigh: { type: "number" },
                  bookHoursRange: { type: "string" },
                  partsRange: { type: "string" },
                  verdict: {
                    type: "string",
                    enum: ["fair", "high", "overpriced", "upsell_trap"],
                  },
                  priority: {
                    type: "string",
                    enum: ["safety_critical", "recommended_soon", "can_wait", "likely_unnecessary"],
                  },
                  explanation: { type: "string" },
                  negotiationTip: { type: "string" },
                  isDiyEasy: { type: "boolean" },
                  recallOverlap: { type: "string" },
                },
              },
            },
          },
        },
      },
    });

    const rawText = interaction.output_text;
    if (!rawText) {
      throw new Error("Empty Gemini output");
    }

    const parsed = JSON.parse(rawText) as {
      summaryHeadline?: string;
      summaryInsight?: string;
      lineItems?: Array<Omit<AuditedLineItem, "id" | "estimatedOvercharge">>;
    };

    if (!parsed.lineItems || parsed.lineItems.length === 0) {
      throw new Error("No line items extracted from quote");
    }

    const sanitizedItems: AuditedLineItem[] = parsed.lineItems.map((item, idx) => {
      const quoted = Math.max(1, Math.round(Number(item.quotedPrice) || 0));
      const fairLow = Math.max(10, Math.round(Number(item.fairLow) || quoted * 0.75));
      const fairHigh = Math.max(fairLow + 10, Math.round(Number(item.fairHigh) || quoted));
      const overcharge =
        item.verdict === "fair"
          ? 0
          : item.priority === "likely_unnecessary"
            ? quoted
            : Math.max(0, quoted - fairHigh);

      return {
        id: `ai-${idx + 1}`,
        shopDescription: item.shopDescription,
        matchedRepairName: item.matchedRepairName || item.shopDescription,
        quotedPrice: quoted,
        fairLow,
        fairHigh,
        estimatedOvercharge: overcharge,
        bookHoursRange: item.bookHoursRange || "1.0–2.0 hrs",
        partsRange: item.partsRange || "Market OEM/Aftermarket",
        verdict: item.verdict,
        priority: item.priority,
        explanation: item.explanation,
        negotiationTip: item.negotiationTip,
        isDiyEasy: Boolean(item.isDiyEasy),
        recallOverlap:
          item.recallOverlap ||
          findRecallOverlap(item.shopDescription, undefined, input.nhtsa),
      };
    });

    return finalizeAuditResult(
      "gemini_vision",
      input,
      laborTier,
      sanitizedItems,
      parsed.summaryHeadline,
      parsed.summaryInsight
    );
  } catch (err) {
    // Graceful fallback to deterministic benchmark engine if text exists
    if (input.quoteText?.trim()) {
      return runGroundedDeterministicAudit(input);
    }
    throw err;
  }
}
