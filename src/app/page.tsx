import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, DollarSign, ShieldCheck, Wrench } from "lucide-react";
import { QuoteAuditorApp } from "@/components/QuoteAuditorApp";
import { SEO_REPAIRS, SEO_VEHICLES } from "@/lib/seo-catalog";

export default function HomePage() {
  const featuredLinks = [
    { v: SEO_VEHICLES[0], r: SEO_REPAIRS[0] }, // Honda Civic Brakes
    { v: SEO_VEHICLES[1], r: SEO_REPAIRS[0] }, // Honda Accord Brakes
    { v: SEO_VEHICLES[3], r: SEO_REPAIRS[1] }, // Toyota Camry Alternator
    { v: SEO_VEHICLES[6], r: SEO_REPAIRS[8] }, // Ford F-150 Struts
    { v: SEO_VEHICLES[2], r: SEO_REPAIRS[4] }, // Honda CR-V AC Compressor
    { v: SEO_VEHICLES[16], r: SEO_REPAIRS[0] }, // BMW 3 Series Brakes
  ];

  return (
    <div className="pb-16">
      {/* Compact High-Trust Hero */}
      <section className="no-print border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Grounded in Local Labor Rates + Live NHTSA Government Recall Data
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Is Your Mechanic Ripping You Off?{" "}
              <span className="text-amber-400">Find Out in 15 Seconds.</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-300 sm:text-lg">
              Upload a photo of your repair estimate or paste the line items below. FairWrench flags padded book labor, dealer upsell traps, and free factory recalls—then writes your exact negotiation script.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Live NHTSA Recalls &amp; Complaint Spikes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ZIP-Adjusted Regional Labor Benchmarks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Zero Hardware Dongle Required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Quote Auditor */}
      <section className="mx-auto -mt-5 max-w-6xl px-4 sm:px-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading FairWrench Quote Auditor...
            </div>
          }
        >
          <QuoteAuditorApp />
        </Suspense>
      </section>

      {/* Top 3 Real-World Upsell Traps */}
      <section className="no-print mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Why Drivers Overpay
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              3 Shop Markups FairWrench Catches Instantly
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              The $98 Cabin Filter &amp; $289 Fuel Flush
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Dealers routinely bundle $400–$600 of non-OEM flushes and 3-minute glovebox filters onto routine brake or oil visits. We separate true safety fixes from pure margin add-ons.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Inflated Book Hours &amp; Parts Markup
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Quotes feel like a black box. We benchmark every line item against standard flat-rate book hours and your ZIP code&apos;s real independent labor rate ($100–$185/hr).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Paying for Defects Covered by NHTSA Recalls
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Every audit pulls live federal NHTSA safety recalls and owner complaint hotspots for your exact year, make, and model—so you never pay out-of-pocket for a $0 factory fix.
            </p>
          </div>
        </div>
      </section>

      {/* Programmatic SEO Internal Linking Hub */}
      <section className="no-print mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Free Repair Price Directory
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              Popular Fair Repair Cost Guides (200+ Vehicles &amp; Jobs)
            </h2>
          </div>
          <Link
            href="/costs"
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-amber-600"
          >
            Browse All 200 Guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLinks.map(({ v, r }) => (
            <Link
              key={`${v.slug}-${r.slug}`}
              href={`/costs/${v.slug}/${r.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-md"
            >
              <p className="text-xs font-semibold text-slate-500">
                {v.make} {v.model} ({v.popularYears})
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 group-hover:text-amber-700">
                {r.title} Fair Cost Guide →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
