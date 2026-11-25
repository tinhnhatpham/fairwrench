"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import type { NhtsaReport } from "@/lib/types";

interface NhtsaLiveWidgetProps {
  make: string;
  model: string;
  defaultYear: number;
}

export function NhtsaLiveWidget({ make, model, defaultYear }: NhtsaLiveWidgetProps) {
  const [year, setYear] = useState(String(defaultYear));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NhtsaReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/nhtsa?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setReport(data as NhtsaReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach NHTSA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Free Live Government Data
          </p>
          <h3 className="text-lg font-bold text-slate-900">
            Check Open NHTSA Safety Recalls for {make} {model}
          </h3>
          <p className="text-xs text-slate-500">
            Before paying a shop, verify whether a factory recall fixes your issue for $0 at the dealer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Model Year"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
          >
            {Array.from({ length: 13 }, (_, idx) => 2026 - idx).map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={runCheck}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Check Live Recalls
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {report && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                report.recalls.length > 0
                  ? "bg-red-100 text-red-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {report.recalls.length > 0 ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {report.recalls.length} Safety Recalls Found
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {report.totalComplaints.toLocaleString()} Owner Complaints on File
            </span>
          </div>

          {report.recalls.length > 0 && (
            <div className="space-y-2">
              {report.recalls.slice(0, 3).map((rec) => (
                <div
                  key={rec.campaignNumber}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs"
                >
                  <p className="font-bold text-slate-900">
                    Campaign {rec.campaignNumber} — {rec.component}
                  </p>
                  <p className="mt-1 text-slate-700">{rec.summary}</p>
                  <p className="mt-1 font-semibold text-emerald-800">
                    Free Remedy: {rec.remedy}
                  </p>
                </div>
              ))}
            </div>
          )}

          {report.complaintHotspots.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Top Owner Complaint Hotspots ({year} {make} {model})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {report.complaintHotspots.map((spot) => (
                  <span
                    key={spot.component}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {spot.component}: <strong>{spot.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
