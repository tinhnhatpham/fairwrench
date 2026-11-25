"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Flame,
  Loader2,
  Lock,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import { SAMPLE_QUOTES } from "@/lib/sample-quotes";
import type { AuditedLineItem, NhtsaReport, QuoteAuditResult } from "@/lib/types";
import { ViralVerdictCard } from "./ViralVerdictCard";

const STORAGE_KEY = "fairwrench_latest_audit_v1";

function verdictBadge(verdict: AuditedLineItem["verdict"]) {
  switch (verdict) {
    case "upsell_trap":
      return {
        label: "Upsell Trap",
        cls: "bg-red-100 text-red-800 border-red-200",
      };
    case "overpriced":
      return {
        label: "Overpriced",
        cls: "bg-red-100 text-red-800 border-red-200",
      };
    case "high":
      return {
        label: "Above Fair",
        cls: "bg-amber-100 text-amber-800 border-amber-200",
      };
    default:
      return {
        label: "Fair Price",
        cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
  }
}

function priorityBadge(priority: AuditedLineItem["priority"]) {
  switch (priority) {
    case "safety_critical":
      return { label: "Safety Critical", cls: "bg-slate-900 text-white" };
    case "recommended_soon":
      return { label: "Recommended", cls: "bg-blue-50 text-blue-700 border border-blue-200" };
    case "can_wait":
      return { label: "Can Wait", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
    default:
      return { label: "Likely Unnecessary", cls: "bg-red-50 text-red-700 border border-red-200" };
  }
}

export function QuoteAuditorApp() {
  const searchParams = useSearchParams();

  const [vin, setVin] = useState("");
  const [year, setYear] = useState("2020");
  const [make, setMake] = useState("Honda");
  const [model, setModel] = useState("Accord");
  const [zipCode, setZipCode] = useState("94107");
  const [mileage, setMileage] = useState("64000");
  const [shopType, setShopType] = useState<"dealership" | "independent" | "chain">("dealership");
  const [quoteText, setQuoteText] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinMessage, setVinMessage] = useState<string | null>(null);

  const [auditing, setAuditing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [audit, setAudit] = useState<QuoteAuditResult | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockBanner, setUnlockBanner] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"single" | "pro" | null>(null);
  const [copiedScriptIdx, setCopiedScriptIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle prefill query params from SEO cost pages and checkout return unlocks
  useEffect(() => {
    const qMake = searchParams.get("make");
    const qModel = searchParams.get("model");
    const qYear = searchParams.get("year");
    const qRepair = searchParams.get("repair");
    const qPrice = searchParams.get("quoted");
    const isUnlockedReturn = searchParams.get("unlocked") === "1";

    if (qMake) setMake(qMake);
    if (qModel) setModel(qModel);
    if (qYear) setYear(qYear);
    if (qRepair) {
      setQuoteText(`${qRepair} - $${qPrice || "850"}\nShop Supplies & Misc Fee - $75`);
    }

    if (isUnlockedReturn) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setAudit(JSON.parse(saved) as QuoteAuditResult);
          setUnlocked(true);
          setUnlockBanner("Payment verified — your full line-by-line audit and negotiation scripts are unlocked!");
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [searchParams]);

  const loadPreset = (presetId: string) => {
    const preset = SAMPLE_QUOTES.find((p) => p.id === presetId);
    if (!preset) return;
    setVin(preset.vehicle.vin);
    setYear(String(preset.vehicle.year));
    setMake(preset.vehicle.make);
    setModel(preset.vehicle.model);
    setZipCode(preset.vehicle.zipCode);
    setMileage(String(preset.vehicle.mileage));
    setShopType(preset.shopType);
    setQuoteText(preset.quoteText);
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setError(null);
    setVinMessage(null);
  };

  const handleDecodeVin = async () => {
    const clean = vin.trim().toUpperCase();
    if (clean.length !== 17) {
      setVinMessage("Enter a full 17-character VIN (found on driver dashboard or doorjamb sticker).");
      return;
    }
    setVinDecoding(true);
    setVinMessage(null);
    try {
      const res = await fetch(`/api/nhtsa?vin=${encodeURIComponent(clean)}`);
      const data = (await res.json()) as NhtsaReport & { error?: string };
      if (!res.ok) throw new Error(data.error || "VIN lookup failed");

      setYear(String(data.vehicle.year));
      setMake(data.vehicle.make);
      setModel(data.vehicle.model);
      setVinMessage(
        `Decoded: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}${data.vehicle.trim ? ` ${data.vehicle.trim}` : ""} • ${data.recalls.length} NHTSA recall(s) & ${data.totalComplaints.toLocaleString()} owner complaints found.`
      );
    } catch (err) {
      setVinMessage(err instanceof Error ? err.message : "Could not decode VIN.");
    } finally {
      setVinDecoding(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Please upload an image under 8MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const commaIdx = dataUrl.indexOf(",");
      if (commaIdx !== -1) {
        setImageBase64(dataUrl.slice(commaIdx + 1));
        setImageMimeType(file.type || "image/jpeg");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim() && !imageBase64) {
      setError("Upload a quote photo or paste at least one line item with a price (or click a sample quote above).");
      return;
    }

    setAuditing(true);
    setError(null);
    setUnlockBanner(null);
    setUnlocked(false);
    setProgressStep(1);

    const t1 = setTimeout(() => setProgressStep(2), 650);
    const t2 = setTimeout(() => setProgressStep(3), 1300);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.trim() || undefined,
          year: Number(year),
          make,
          model,
          zipCode,
          mileage: mileage ? Number(mileage) : undefined,
          shopType,
          quoteText,
          imageBase64: imageBase64 ?? undefined,
          imageMimeType: imageMimeType ?? undefined,
        }),
      });

      const data = (await res.json()) as QuoteAuditResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not audit quote.");
      }

      setAudit(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore storage quota
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setAuditing(false);
      setProgressStep(0);
    }
  };

  const handleUnlockCheckout = async (plan: "single" | "pro") => {
    if (!audit) return;
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, auditId: audit.auditId }),
      });
      const data = (await res.json()) as {
        mode?: "live_checkout" | "demo_unlock";
        checkoutUrl?: string;
        message?: string;
      };
      if (data.mode === "live_checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setUnlocked(true);
      setUnlockBanner(
        data.message || "Preview Mode unlocked — connect Polar.sh or Stripe in .env.local to collect live payments."
      );
    } catch {
      setUnlocked(true);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const copyScript = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScriptIdx(idx);
      setTimeout(() => setCopiedScriptIdx(null), 2000);
    } catch {
      // ignore
    }
  };

  const progressLabels = [
    "",
    "Decoding vehicle & regional labor rates...",
    "Querying live NHTSA recalls & owner complaints...",
    "Auditing line items against book hours & upsell traps...",
  ];

  return (
    <div id="auditor" className="space-y-8">
      {/* Input Card */}
      <form
        onSubmit={handleRunAudit}
        className="no-print overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
      >
        {/* Quick Sample Bar */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Try a Real Sample Quote (1 Click):
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUOTES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-12">
          {/* Left Column: Vehicle + VIN */}
          <div className="space-y-4 lg:col-span-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Vehicle Details (or 17-Digit VIN)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Optional 17-char VIN (e.g. 1HGCV1F30LA000001)"
                  maxLength={17}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs uppercase text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleDecodeVin}
                  disabled={vinDecoding}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {vinDecoding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  Decode
                </button>
              </div>
              {vinMessage && (
                <p className="mt-1.5 text-xs font-medium text-emerald-700">{vinMessage}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={1985}
                  max={2027}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Make</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  placeholder="Honda"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  placeholder="Accord"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">
                  ZIP Code (Local Labor Rate)
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="94107"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">
                  Mileage (Optional)
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="64000"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500">
                Who Gave You This Quote?
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "dealership", label: "Dealership" },
                    { id: "chain", label: "Chain Shop" },
                    { id: "independent", label: "Independent" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShopType(opt.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      shopType === opt.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Quote Photo or Text */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Snap Quote Photo OR Paste Line Items
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
                >
                  <Camera className="h-3.5 w-3.5 text-amber-600" />
                  Upload / Snap Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-2">
                  <img
                    src={imagePreview}
                    alt="Uploaded mechanic estimate"
                    className="max-h-44 w-full rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                      setImageMimeType(null);
                    }}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-900"
                    aria-label="Remove uploaded image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="mt-1.5 text-center text-[11px] font-semibold text-slate-600">
                    Quote photo attached — Gemini Vision OCR will extract every line item.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-amber-500 hover:bg-amber-50/40"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                  Tap to snap or upload a paper estimate / dealership inspection photo (JPG/PNG)
                </button>
              )}

              <textarea
                rows={6}
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder={`Paste or type your quote items (one per line), e.g.:\nFront Brake Pads & Rotors - $845\nBrake Fluid Flush - $219\nCabin Air Filter - $98\nFuel Injection Service - $289`}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={auditing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 text-base font-extrabold text-slate-950 shadow-md shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-70"
            >
              {auditing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {progressLabels[progressStep] || "Auditing Quote..."}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
                  Audit My Quote Free (15 Seconds)
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Audit Results Section */}
      {audit && (
        <div ref={resultsRef} className="space-y-6">
          {unlockBanner && (
            <div className="no-print flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
              <span className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-emerald-600" />
                {unlockBanner}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
            </div>
          )}

          {/* Hero Verdict Banner */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-mono font-semibold text-amber-400">
                {audit.vehicle.year} {audit.vehicle.make} {audit.vehicle.model}
                {audit.vehicle.vin ? ` • VIN ${audit.vehicle.vin}` : ""}
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-slate-300 ring-1 ring-slate-800">
                {audit.engineMode === "gemini_vision"
                  ? "Gemini 4 Vision + Grounded Benchmarks"
                  : "Grounded Local Benchmark + Live NHTSA Engine"}
              </span>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                    audit.overallVerdict === "FAIR_QUOTE"
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                      : audit.overallVerdict === "SLIGHTLY_HIGH"
                        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                        : "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                  }`}
                >
                  {audit.overallVerdict === "FAIR_QUOTE" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {audit.overallVerdict.replace("_", " ")}
                </span>
                <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {audit.summaryHeadline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {audit.summaryInsight}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:col-span-5">
                <div className="rounded-xl bg-slate-900 p-3.5 text-center ring-1 ring-slate-800">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Score</p>
                  <p
                    className={`mt-1 font-mono text-3xl font-extrabold ${
                      audit.fairnessScore >= 80
                        ? "text-emerald-400"
                        : audit.fairnessScore >= 55
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {audit.fairnessScore}
                  </p>
                  <p className="text-[10px] text-slate-500">out of 100</p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3.5 text-center ring-1 ring-slate-800">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Quoted</p>
                  <p className="mt-1 font-mono text-xl font-extrabold text-white sm:text-2xl">
                    ${audit.totalQuoted.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Fair ${audit.fairTotalLow.toLocaleString()}–${audit.fairTotalHigh.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-red-950/60 p-3.5 text-center ring-1 ring-red-500/40">
                  <p className="text-[11px] font-semibold uppercase text-red-200">Save Up To</p>
                  <p className="mt-1 font-mono text-xl font-extrabold text-red-400 sm:text-2xl">
                    ${audit.estimatedSavingsHigh.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-red-200/70">est. overcharge</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live NHTSA Public Safety & Recall Shield (Always Free Value!) */}
          {audit.nhtsa && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Live NHTSA Safety & Recall Shield ({audit.vehicle.year} {audit.vehicle.make}{" "}
                    {audit.vehicle.model})
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {audit.nhtsa.recalls.length} Recalls •{" "}
                  {audit.nhtsa.totalComplaints.toLocaleString()} Owner Complaints
                </span>
              </div>

              {audit.nhtsa.recalls.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {audit.nhtsa.recalls.slice(0, 4).map((recall) => (
                    <div
                      key={recall.campaignNumber}
                      className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-amber-900">
                          Recall {recall.campaignNumber}
                        </span>
                        <span className="rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          $0 Dealer Fix
                        </span>
                      </div>
                      <p className="mt-1 font-bold text-slate-900">{recall.component}</p>
                      <p className="mt-1 line-clamp-3 text-slate-700">{recall.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  No open NHTSA model-year recalls returned right now. Always confirm your exact VIN with the service advisor.
                </p>
              )}

              {audit.nhtsa.complaintHotspots.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-700">
                    Top NHTSA Owner Complaint Hotspots (Known Factory Weak Points):
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {audit.nhtsa.complaintHotspots.map((spot) => (
                      <span
                        key={spot.component}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800"
                      >
                        <strong>{spot.component}</strong>
                        <span className="font-mono text-slate-500">({spot.count})</span>
                        {spot.fires > 0 && (
                          <Flame className="h-3 w-3 text-red-500" aria-label="Fire reports" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Itemized Line-by-Line Audit (Item #1 Free, Rest Behind Value-Before-Paywall) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Line-by-Line Quote Audit ({audit.lineItems.length} Items)
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Local rate: ${audit.regionalLaborRate.independentLow}–$
                {audit.regionalLaborRate.independentHigh}/hr (Independent)
              </span>
            </div>

            {/* First item always unlocked free to prove accuracy */}
            {audit.lineItems.slice(0, 1).map((item) => {
              const vb = verdictBadge(item.verdict);
              const pb = priorityBadge(item.priority);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          Free Preview Item
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${vb.cls}`}
                        >
                          {vb.label}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${pb.cls}`}>
                          {pb.label}
                        </span>
                      </div>
                      <h4 className="mt-2 text-base font-bold text-slate-900">
                        {item.shopDescription}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Book Time: {item.bookHoursRange} • Parts Benchmark: {item.partsRange}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-extrabold text-slate-900">
                        ${item.quotedPrice.toLocaleString()}
                      </p>
                      <p className="font-mono text-xs font-semibold text-emerald-700">
                        Fair: ${item.fairLow.toLocaleString()}–${item.fairHigh.toLocaleString()}
                      </p>
                      {item.estimatedOvercharge > 0 && (
                        <p className="font-mono text-xs font-bold text-red-600">
                          +${item.estimatedOvercharge.toLocaleString()} flagged
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{item.explanation}</p>
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-800">
                    <strong>Action Tip:</strong> {item.negotiationTip}
                  </div>
                  {item.recallOverlap && (
                    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">
                      ⚠️ {item.recallOverlap}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Remaining items + Negotiation Scripts: Blurred Paywall OR Unlocked */}
            {!unlocked ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-xl">
                {/* Blurred teaser background */}
                <div className="pointer-events-none select-none space-y-3 p-5 opacity-45 blur-[5px]">
                  {audit.lineItems.slice(1, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.shopDescription}</p>
                        <p className="text-xs text-slate-600">{item.explanation}</p>
                      </div>
                      <p className="font-mono text-lg font-extrabold text-red-600">
                        ${item.quotedPrice}
                      </p>
                    </div>
                  ))}
                </div>

                {/* High-Converting Paywall Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[2px]">
                  <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 p-6 text-white shadow-2xl">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Lock className="h-5 w-5" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Unlock Full Audit & Negotiation Scripts
                      </span>
                    </div>
                    <h4 className="mt-2 text-xl font-extrabold sm:text-2xl">
                      {audit.lineItems.length - 1} More Item(s) Flagged — Save Up to $
                      {audit.estimatedSavingsHigh.toLocaleString()} Today
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      Unlock every line-by-line fair range, our Safety vs. Can-Wait triage list, 3 word-for-word scripts to read at the counter, printable PDF report, and shareable audit card.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={checkoutLoading !== null}
                        onClick={() => handleUnlockCheckout("single")}
                        className="flex flex-col items-start rounded-xl bg-amber-400 p-4 text-left text-slate-950 transition hover:bg-amber-300 disabled:opacity-70"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">
                          Best for Today&apos;s Visit
                        </span>
                        <span className="mt-1 font-mono text-2xl font-extrabold">$4.99</span>
                        <span className="mt-0.5 text-xs font-semibold">
                          {checkoutLoading === "single"
                            ? "Opening checkout..."
                            : "One-Time Full Audit Unlock →"}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={checkoutLoading !== null}
                        onClick={() => handleUnlockCheckout("pro")}
                        className="flex flex-col items-start rounded-xl border border-slate-700 bg-slate-900 p-4 text-left text-white transition hover:border-amber-400 disabled:opacity-70"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                          Unlimited Quotes + Used Cars
                        </span>
                        <span className="mt-1 font-mono text-2xl font-extrabold">
                          $9.99<span className="text-xs font-normal text-slate-400">/mo</span>
                        </span>
                        <span className="mt-0.5 text-xs font-medium text-slate-300">
                          {checkoutLoading === "pro"
                            ? "Opening checkout..."
                            : "Cancel anytime • Unlimited audits →"}
                        </span>
                      </button>
                    </div>

                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      Costs less than 4 minutes of dealership labor • Instant unlock
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Remaining Unlocked Line Items */}
                <div className="space-y-3">
                  {audit.lineItems.slice(1).map((item) => {
                    const vb = verdictBadge(item.verdict);
                    const pb = priorityBadge(item.priority);
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${vb.cls}`}
                              >
                                {vb.label}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${pb.cls}`}
                              >
                                {pb.label}
                              </span>
                              {item.isDiyEasy && (
                                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                                  5-Min DIY Save
                                </span>
                              )}
                            </div>
                            <h4 className="mt-2 text-base font-bold text-slate-900">
                              {item.shopDescription}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Book Time: {item.bookHoursRange} • Parts Benchmark: {item.partsRange}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-2xl font-extrabold text-slate-900">
                              ${item.quotedPrice.toLocaleString()}
                            </p>
                            <p className="font-mono text-xs font-semibold text-emerald-700">
                              Fair: ${item.fairLow.toLocaleString()}–$
                              {item.fairHigh.toLocaleString()}
                            </p>
                            {item.estimatedOvercharge > 0 && (
                              <p className="font-mono text-xs font-bold text-red-600">
                                +${item.estimatedOvercharge.toLocaleString()} flagged
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">{item.explanation}</p>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-800">
                          <strong>Action Tip:</strong> {item.negotiationTip}
                        </div>
                        {item.recallOverlap && (
                          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">
                            ⚠️ {item.recallOverlap}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Safety vs Can-Wait Triage */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Approve Today (Safety Critical)
                    </h4>
                    {audit.safetyChecklist.mustDoNow.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {audit.safetyChecklist.mustDoNow.map((line, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No immediate safety-critical emergencies detected on this estimate.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Safe to Decline or Delay Today
                    </h4>
                    {audit.safetyChecklist.canWaitOrDecline.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {audit.safetyChecklist.canWaitOrDecline.map((line, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No obvious padded upsells detected on this estimate.
                      </p>
                    )}
                  </div>
                </div>

                {/* Word-for-Word Service Advisor Negotiation Scripts */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Word-for-Word Negotiation Scripts (Read at the Counter)
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Calm, specific phrasing that signals you know book hours and factory schedules.
                  </p>
                  <div className="mt-4 space-y-3">
                    {audit.negotiationScripts.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{s.title}</p>
                            <p className="text-xs text-slate-500">{s.scenario}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                              {s.estimatedSavings}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyScript(s.script, idx)}
                              className="no-print inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-900"
                            >
                              {copiedScriptIdx === idx ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              {copiedScriptIdx === idx ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2.5 rounded-lg bg-white p-3 text-sm italic leading-relaxed text-slate-800 ring-1 ring-slate-200">
                          {s.script}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shareable Viral Verdict Card */}
                <ViralVerdictCard audit={audit} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
