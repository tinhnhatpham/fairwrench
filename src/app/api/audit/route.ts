import { NextRequest, NextResponse } from "next/server";
import { decodeVinLive, fetchNhtsaReport } from "@/lib/nhtsa";
import { runQuoteAudit } from "@/lib/quote-auditor";
import type { VehicleProfile } from "@/lib/types";

interface AuditRequestBody {
  vin?: string;
  year?: number | string;
  make?: string;
  model?: string;
  zipCode?: string;
  mileage?: number | string;
  shopType?: "dealership" | "independent" | "chain" | "unknown";
  quoteText?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRequestBody;

    let vehicle: VehicleProfile | null = null;
    if (body.vin && body.vin.trim().length === 17) {
      vehicle = await decodeVinLive(body.vin.trim());
    }

    if (!vehicle) {
      const year = Number(body.year) || 2020;
      const make = body.make?.trim() || "Honda";
      const model = body.model?.trim() || "Accord";
      vehicle = { year, make, model };
    }

    vehicle.zipCode = body.zipCode?.trim() || undefined;
    vehicle.mileage = body.mileage ? Number(body.mileage) : undefined;

    if (!body.quoteText?.trim() && !body.imageBase64) {
      return NextResponse.json(
        { error: "Please upload a photo of your mechanic quote or paste the line items." },
        { status: 400 }
      );
    }

    // Fetch live free NHTSA recalls & complaint hotspots in parallel/before audit
    const nhtsa = await fetchNhtsaReport(vehicle);

    const audit = await runQuoteAudit({
      vehicle,
      shopType: body.shopType ?? "unknown",
      quoteText: body.quoteText,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
      nhtsa,
    });

    return NextResponse.json(audit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to audit repair quote.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
