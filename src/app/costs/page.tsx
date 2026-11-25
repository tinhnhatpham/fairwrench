import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { SEO_REPAIRS, SEO_VEHICLES } from "@/lib/seo-catalog";

export const metadata: Metadata = {
  title: "200+ Car Repair Fair Cost Guides by Vehicle & Job",
  description:
    "Compare fair independent shop vs. dealership repair costs, standard book labor hours, upsell traps, and live NHTSA recalls across 20 popular vehicles and 10 major repairs.",
};

export default function CostsDirectoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-slate-950 p-7 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
          <Wrench className="h-3.5 w-3.5" />
          200 Grounded Fair-Price Guides
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Fair Car Repair Cost Guides by Vehicle
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Pick your vehicle and repair to check independent vs. dealership pricing, book labor hours, common upsell traps, and live NHTSA safety recalls.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {SEO_VEHICLES.map((vehicle) => (
          <section
            key={vehicle.slug}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-xs text-slate-500">
                  {vehicle.segment} • Popular Model Years {vehicle.popularYears}
                </p>
              </div>
              <Link
                href={`/?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.sampleYear}#auditor`}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Audit {vehicle.model} Quote <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {SEO_REPAIRS.map((repair) => (
                <Link
                  key={`${vehicle.slug}-${repair.slug}`}
                  href={`/costs/${vehicle.slug}/${repair.slug}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50 hover:text-slate-950"
                >
                  {repair.shortTitle}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
