"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Share2, ShieldAlert, Wrench } from "lucide-react";
import type { QuoteAuditResult } from "@/lib/types";

interface ViralVerdictCardProps {
  audit: QuoteAuditResult;
}

export function ViralVerdictCard({ audit }: ViralVerdictCardProps) {
  const [copied, setCopied] = useState(false);

  const redItems = audit.lineItems.filter(
    (i) => i.verdict === "upsell_trap" || i.verdict === "overpriced"
  );

  const shareSummary = `Just audited a $${audit.totalQuoted.toLocaleString()} mechanic quote for a ${audit.vehicle.year} ${audit.vehicle.make} ${audit.vehicle.model} on FairWrench:
• Fairness Score: ${audit.fairnessScore}/100
• Fair Local Range: $${audit.fairTotalLow.toLocaleString()}–$${audit.fairTotalHigh.toLocaleString()}
• Flagged Savings: Up to $${audit.estimatedSavingsHigh.toLocaleString()}
${redItems
  .slice(0, 3)
  .map((i) => `• ${i.shopDescription}: quoted $${i.quotedPrice} (fair $${i.fairLow}–$${i.fairHigh})`)
  .join("\n")}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-400 text-slate-950">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              FairWrench Audit Card
            </p>
            <p className="text-[11px] text-slate-400">
              Screenshot for TikTok / Reels / r/MechanicAdvice
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied Post" : "Copy Caption"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-900/90 p-3.5 ring-1 ring-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Shop Quoted
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">
            ${audit.totalQuoted.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {audit.vehicle.year} {audit.vehicle.make} {audit.vehicle.model}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/90 p-3.5 ring-1 ring-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Fair Local Range
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">
            ${audit.fairTotalLow.toLocaleString()}–${audit.fairTotalHigh.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{audit.regionLabel}</p>
        </div>

        <div className="rounded-xl bg-red-950/50 p-3.5 ring-1 ring-red-500/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300">
            Potential Overcharge
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-red-400">
            Up to ${audit.estimatedSavingsHigh.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-red-200/80">
            Fairness Score: {audit.fairnessScore}/100
          </p>
        </div>
      </div>

      {redItems.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            Biggest Red Flags Caught
          </p>
          {redItems.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-xs ring-1 ring-slate-800"
            >
              <span className="flex items-center gap-2 font-medium text-slate-100">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                {item.shopDescription}
              </span>
              <span className="shrink-0 font-mono font-bold text-red-400">
                ${item.quotedPrice} <span className="text-slate-500">vs</span>{" "}
                <span className="text-emerald-400">${item.fairLow}–${item.fairHigh}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Share2 className="h-3 w-3 text-amber-400" />
          Verified against book hours + live NHTSA recall DB
        </span>
        <span className="font-mono font-semibold text-amber-300">fairwrench.vercel.app</span>
      </div>
    </div>
  );
}
