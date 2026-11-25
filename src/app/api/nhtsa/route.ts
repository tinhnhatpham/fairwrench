import { NextRequest, NextResponse } from "next/server";
import { decodeVinLive, fetchNhtsaReport } from "@/lib/nhtsa";
import type { VehicleProfile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin")?.trim();
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();
  const yearStr = searchParams.get("year")?.trim();

  try {
    let vehicle: VehicleProfile | null = null;

    if (vin) {
      vehicle = await decodeVinLive(vin);
      if (!vehicle) {
        return NextResponse.json(
          { error: "Could not decode that 17-character VIN via NHTSA. Double-check the VIN or enter Year/Make/Model manually." },
          { status: 400 }
        );
      }
    } else if (make && model && yearStr) {
      const year = Number(yearStr);
      if (!Number.isFinite(year) || year < 1981 || year > 2028) {
        return NextResponse.json({ error: "Please provide a valid model year (1981–2028)." }, { status: 400 });
      }
      vehicle = { year, make, model };
    } else {
      return NextResponse.json(
        { error: "Provide either a 17-character vin OR year, make, and model." },
        { status: 400 }
      );
    }

    const report = await fetchNhtsaReport(vehicle);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "NHTSA lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
