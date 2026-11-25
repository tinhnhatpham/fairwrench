import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fairwrench.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FairWrench — AI Mechanic Quote Auditor & Free NHTSA Recall Check",
    template: "%s | FairWrench",
  },
  description:
    "Standing in a repair shop? Upload or paste your mechanic estimate to catch overpriced labor, dealer upsell traps, and free open NHTSA recalls in 15 seconds.",
  keywords: [
    "mechanic quote checker",
    "car repair estimate auditor",
    "is my mechanic ripping me off",
    "fair auto repair cost",
    "NHTSA recall lookup",
    "dealership upsell checker",
  ],
  openGraph: {
    type: "website",
    siteName: "FairWrench",
    title: "FairWrench — Catch Overpriced Mechanic Quotes in 15 Seconds",
    description:
      "Instant line-by-line mechanic quote audit grounded in local labor rates, book hours, and live NHTSA safety recall data.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-amber-300 selection:text-slate-950">
        <header className="no-print sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 text-white backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-slate-950 shadow-sm">
                <Wrench className="h-5 w-5 stroke-[2.4]" />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Fair<span className="text-amber-400">Wrench</span>
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  Mechanic Quote Auditor
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
              <Link
                href="/#auditor"
                className="text-slate-200 transition hover:text-amber-400"
              >
                Audit a Quote
              </Link>
              <Link
                href="/costs"
                className="text-slate-200 transition hover:text-amber-400"
              >
                200+ Cost Guides
              </Link>
              <Link
                href="/#auditor"
                className="hidden items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 sm:inline-flex"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Free Preview Scan
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="no-print mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-bold text-slate-900">FairWrench</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Consumer repair-pricing benchmarks & live NHTSA public recall lookups. Estimates are for consumer negotiation guidance and do not replace an in-person certified safety inspection.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-600">
              <Link href="/#auditor" className="hover:text-slate-950">
                Quote Auditor
              </Link>
              <Link href="/costs" className="hover:text-slate-950">
                All 200 Vehicle Cost Guides
              </Link>
              <Link
                href="/costs/honda-accord/brake-pad-and-rotor-replacement"
                className="hover:text-slate-950"
              >
                Honda Accord Brakes
              </Link>
              <Link
                href="/costs/toyota-camry/alternator-replacement"
                className="hover:text-slate-950"
              >
                Toyota Camry Alternator
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
