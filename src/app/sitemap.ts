import type { MetadataRoute } from "next";
import { SEO_REPAIRS, SEO_VEHICLES } from "@/lib/seo-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fairwrench.vercel.app";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/costs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const v of SEO_VEHICLES) {
    for (const r of SEO_REPAIRS) {
      entries.push({
        url: `${baseUrl}/costs/${v.slug}/${r.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
