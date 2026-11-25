import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Wrench } from "lucide-react";
import { NhtsaLiveWidget } from "@/components/NhtsaLiveWidget";
import { SEO_REPAIRS, SEO_VEHICLES, getSeoCostSummary } from "@/lib/seo-catalog";

interface PageProps {
  params: Promise<{ vehicle: string; repair: string }>;
}

export function generateStaticParams() {
  const paths: Array<{ vehicle: string; repair: string }> = [];
  for (const v of SEO_VEHICLES) {
    for (const r of SEO_REPAIRS) {
      paths.push({ vehicle: v.slug, repair: r.slug });
    }
  }
  return paths;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vehicle, repair } = await params;
  const data = getSeoCostSummary(vehicle, repair);
  if (!data) return { title: "Repair Cost Guide Not Found" };

  const title = `${data.vehicle.make} ${data.vehicle.model} ${data.repair.title} Cost ($${data.fairLow}–$${data.fairHigh} Fair Range)`;
  const description = `How much should ${data.repair.title.toLowerCase()} cost on a ${data.vehicle.make} ${data.vehicle.model}? Fair independent shop range is $${data.fairLow}–$${data.fairHigh} vs. $${data.dealerLow}–$${data.dealerHigh} at dealerships. Check book hours, upsell traps & free NHTSA recalls.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function VehicleRepairCostPage({ params }: PageProps) {
  const { vehicle: vSlug, repair: rSlug } = await params;
  const data = getSeoCostSummary(vSlug, rSlug);
  if (!data) notFound();

  const { vehicle, repair, benchmark, fairLow, fairHigh, partsLow, partsHigh, dealerLow, dealerHigh } =
    data;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is a fair price for ${repair.title} on a ${vehicle.make} ${vehicle.model}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `At a reputable independent mechanic, ${repair.title.toLowerCase()} on a ${vehicle.make} ${vehicle.model} typically costs $${fairLow} to $${fairHigh} total, including $${partsLow}–$${partsHigh} in parts and ${benchmark.bookHoursLow}–${benchmark.bookHoursHigh} book labor hours. Dealerships frequently quote $${dealerLow} to $${dealerHigh}.`,
        },
      },
      {
        "@type": "Question",
        name: `How many labor hours does ${vehicle.make} ${vehicle.model} ${repair.shortTitle} take?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Standard flat-rate book time is ${benchmark.bookHoursLow} to ${benchmark.bookHoursHigh} hours depending on trim, rust/corrosion, and engine layout.`,
        },
      },
      {
        "@type": "Question",
        name: `What upsells should I watch out for during ${repair.shortTitle} service?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: repair.dealerTrap,
        },
      },
    ],
  };

  const prefillHref = `/?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.sampleYear}&repair=${encodeURIComponent(repair.title)}&quoted=${dealerHigh}#auditor`;

  const otherRepairs = SEO_REPAIRS.filter((r) => r.slug !== repair.slug).slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Link
        href="/costs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All 200 Vehicle Repair Cost Guides
      </Link>

      {/* Hero Summary Card */}
      <div className="mt-4 rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
          <Wrench className="h-3.5 w-3.5" />
          {vehicle.make} {vehicle.model} ({vehicle.popularYears}) • Fair Price Benchmark
        </span>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
          {vehicle.make} {vehicle.model} {repair.title} Cost
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Don&apos;t blindly sign a shop estimate. Compare standard book hours, independent vs. dealership pricing, and check live NHTSA recalls before approving work.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-950/60 p-4 ring-1 ring-emerald-500/40">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Fair Independent Range
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">
              ${fairLow.toLocaleString()}–${fairHigh.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-emerald-200/70">Parts + local labor included</p>
          </div>

          <div className="rounded-xl bg-red-950/50 p-4 ring-1 ring-red-500/40">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-300">
              Typical Dealership Quote
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-red-400">
              ${dealerLow.toLocaleString()}–${dealerHigh.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-red-200/70">Often includes high parts markup</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Book Hours &amp; Parts
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-white">
              {benchmark.bookHoursLow}–{benchmark.bookHoursHigh} hrs
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Parts benchmark: ${partsLow}–${partsHigh}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={prefillHref}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
          >
            <ShieldCheck className="h-4 w-4" />
            Audit My Exact {vehicle.model} Quote Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-xs text-slate-400">
            Adjusts for your exact ZIP code labor rate &amp; flags extra line-item upsells
          </span>
        </div>
      </div>

      {/* Dealer Upsell Warning + Symptoms */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-amber-950">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            #1 Shop / Dealership Trap to Watch Out For
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{repair.dealerTrap}</p>
          <div className="mt-4 border-t border-amber-200/80 pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {vehicle.make} {vehicle.model} Specific Watchouts
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-amber-950">
              {vehicle.commonWatchouts.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-extrabold text-slate-900">
            Signs You Actually Need {repair.shortTitle} Service
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
            {repair.symptoms.map((sym, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{sym}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <strong>Pro Tip:</strong> Ask your advisor to show you the worn part or photo before authorizing work, and ask for old replaced parts back in a box.
          </p>
        </div>
      </div>

      {/* Live NHTSA Recall Checker Widget */}
      <div className="mt-6">
        <NhtsaLiveWidget
          make={vehicle.make}
          model={vehicle.model}
          defaultYear={vehicle.sampleYear}
        />
      </div>

      {/* Related Repairs for Same Vehicle */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-extrabold text-slate-900">
          More {vehicle.make} {vehicle.model} Fair Repair Cost Guides
        </h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {otherRepairs.map((r) => (
            <Link
              key={r.slug}
              href={`/costs/${vehicle.slug}/${r.slug}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
            >
              {vehicle.make} {vehicle.model} {r.shortTitle} Cost →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
