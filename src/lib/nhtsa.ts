import type { ComplaintHotspot, NhtsaRecall, NhtsaReport, VehicleProfile } from "./types";

const NHTSA_TIMEOUT_MS = 8500;

async function fetchJsonWithTimeout<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NHTSA_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface VpicDecodeResponse {
  Results?: Array<{
    Make?: string;
    Model?: string;
    ModelYear?: string;
    Trim?: string;
    EngineCylinders?: string;
    DisplacementL?: string;
    BodyClass?: string;
    ErrorCode?: string;
  }>;
}

export async function decodeVinLive(vinRaw: string): Promise<VehicleProfile | null> {
  const vin = vinRaw.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  if (vin.length !== 17) return null;

  const data = await fetchJsonWithTimeout<VpicDecodeResponse>(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`
  );
  const row = data?.Results?.[0];
  if (!row || !row.Make || !row.Model || !row.ModelYear) return null;

  const year = Number(row.ModelYear);
  if (!Number.isFinite(year) || year < 1981 || year > 2028) return null;

  const engineParts = [
    row.DisplacementL ? `${Number(row.DisplacementL).toFixed(1)}L` : "",
    row.EngineCylinders ? `${row.EngineCylinders}-Cyl` : "",
  ].filter(Boolean);

  return {
    vin,
    year,
    make: titleCaseMake(row.Make),
    model: row.Model.trim(),
    trim: row.Trim?.trim() || undefined,
    engine: engineParts.length > 0 ? engineParts.join(" ") : undefined,
    bodyClass: row.BodyClass?.trim() || undefined,
  };
}

interface NhtsaRecallApiResponse {
  Count?: number;
  results?: Array<{
    NHTSACampaignNumber?: string;
    Component?: string;
    Summary?: string;
    Consequence?: string;
    Remedy?: string;
    ReportReceivedDate?: string;
  }>;
}

interface NhtsaComplaintApiResponse {
  count?: number;
  results?: Array<{
    components?: string;
    summary?: string;
    crash?: boolean;
    fire?: boolean;
  }>;
}

export async function fetchNhtsaReport(vehicle: VehicleProfile): Promise<NhtsaReport> {
  const makeParam = encodeURIComponent(vehicle.make.trim());
  const modelParam = encodeURIComponent(vehicle.model.trim());
  const yearParam = encodeURIComponent(String(vehicle.year));

  const [recallsData, complaintsData] = await Promise.all([
    fetchJsonWithTimeout<NhtsaRecallApiResponse>(
      `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${makeParam}&model=${modelParam}&modelYear=${yearParam}`
    ),
    fetchJsonWithTimeout<NhtsaComplaintApiResponse>(
      `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${makeParam}&model=${modelParam}&modelYear=${yearParam}`
    ),
  ]);

  const recalls: NhtsaRecall[] = (recallsData?.results ?? []).slice(0, 10).map((r) => ({
    campaignNumber: r.NHTSACampaignNumber ?? "N/A",
    component: r.Component ?? "General Safety Component",
    summary: r.Summary ?? "Safety recall notice filed with NHTSA.",
    consequence: r.Consequence ?? "",
    remedy: r.Remedy ?? "Contact an authorized dealer for a free recall repair.",
    reportReceivedDate: r.ReportReceivedDate,
  }));

  const rawComplaints = complaintsData?.results ?? [];
  const totalComplaints = complaintsData?.count ?? rawComplaints.length;

  const bucket = new Map<
    string,
    { count: number; crashes: number; fires: number; sampleSummary: string }
  >();

  for (const item of rawComplaints) {
    const primaryComp = (item.components ?? "UNKNOWN")
      .split(",")[0]
      .split(":")[0]
      .trim()
      .toUpperCase();
    if (!primaryComp) continue;
    const prev = bucket.get(primaryComp) ?? {
      count: 0,
      crashes: 0,
      fires: 0,
      sampleSummary: item.summary ?? "",
    };
    prev.count += 1;
    if (item.crash) prev.crashes += 1;
    if (item.fire) prev.fires += 1;
    if (!prev.sampleSummary && item.summary) prev.sampleSummary = item.summary;
    bucket.set(primaryComp, prev);
  }

  const complaintHotspots: ComplaintHotspot[] = Array.from(bucket.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([component, stats]) => ({
      component: formatComponentLabel(component),
      count: stats.count,
      crashes: stats.crashes,
      fires: stats.fires,
      sampleSummary:
        stats.sampleSummary.length > 180
          ? `${stats.sampleSummary.slice(0, 177).trim()}...`
          : stats.sampleSummary,
    }));

  return {
    vehicle,
    recalls,
    totalComplaints,
    complaintHotspots,
    fetchedAt: new Date().toISOString(),
  };
}

function titleCaseMake(make: string): string {
  const upper = make.trim().toUpperCase();
  const acronyms = new Set(["BMW", "GMC", "RAM", "VW", "MINI", "KIA"]);
  if (acronyms.has(upper)) return upper === "RAM" ? "Ram" : upper === "KIA" ? "Kia" : upper;
  return upper
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function formatComponentLabel(raw: string): string {
  return raw
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}
