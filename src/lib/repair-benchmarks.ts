import type { SafetyPriority } from "./types";

export interface RepairBenchmark {
  id: string;
  name: string;
  keywords: string[];
  bookHoursLow: number;
  bookHoursHigh: number;
  partsLow: number;
  partsHigh: number;
  priority: SafetyPriority;
  isCommonUpsellTrap?: boolean;
  isDiyEasy?: boolean;
  upsellNote?: string;
  recallComponentHints?: string[];
}

export interface RegionalLaborTier {
  label: string;
  independentLow: number;
  independentHigh: number;
  dealerHigh: number;
  multiplier: number;
}

/**
 * Regional US automotive shop labor rates by first digit / 3-digit ZIP prefix.
 * Grounded to 2025-2026 independent vs. franchise dealership hourly rates.
 */
export function getRegionalLaborTier(zipCode?: string): RegionalLaborTier {
  const clean = (zipCode ?? "").replace(/\D/g, "");
  if (clean.length < 3) {
    return {
      label: "US National Average",
      independentLow: 115,
      independentHigh: 150,
      dealerHigh: 195,
      multiplier: 1.0,
    };
  }

  const p3 = Number(clean.slice(0, 3));
  const p1 = clean[0];

  // Major HCOL metros: NYC, SF Bay, LA, Seattle, Boston, DC/NoVA, Hawaii
  const isHighCost =
    (p3 >= 100 && p3 <= 119) || // NYC / Long Island
    (p3 >= 900 && p3 <= 951) || // LA / Bay Area / San Diego
    (p3 >= 980 && p3 <= 984) || // Seattle
    (p3 >= 200 && p3 <= 223) || // DC / NoVA / MD
    (p3 >= 21 && p3 <= 24) || // Boston
    p3 === 967 ||
    p3 === 968; // Hawaii

  if (isHighCost) {
    return {
      label: `High-Cost Metro (ZIP ${clean.slice(0, 5)})`,
      independentLow: 145,
      independentHigh: 185,
      dealerHigh: 240,
      multiplier: 1.24,
    };
  }

  // Mid-high coastal / mountain metros: NJ, CT, CO, FL metros, TX metros, AZ, IL
  if (p1 === "0" || p1 === "1" || p1 === "8" || p1 === "9") {
    return {
      label: `Metro / Coastal Region (ZIP ${clean.slice(0, 5)})`,
      independentLow: 125,
      independentHigh: 160,
      dealerHigh: 205,
      multiplier: 1.08,
    };
  }

  // Midwest & South moderate cost
  return {
    label: `Midwest / South Region (ZIP ${clean.slice(0, 5)})`,
    independentLow: 100,
    independentHigh: 135,
    dealerHigh: 175,
    multiplier: 0.92,
  };
}

export function getMakeMultiplier(make?: string): number {
  const m = (make ?? "").toLowerCase();
  if (/(bmw|mercedes|audi|porsche|lexus|land rover|jaguar|volvo|acura|infiniti|cadillac|tesla)/.test(m)) {
    return 1.38;
  }
  if (/(volkswagen|vw|subaru|mini|audi|alfa)/.test(m)) {
    return 1.15;
  }
  if (/(ford|chevrolet|chevy|gmc|ram|dodge|jeep)/.test(m)) {
    return 1.04;
  }
  return 1.0; // Honda, Toyota, Nissan, Hyundai, Kia, Mazda
}

export const REPAIR_BENCHMARKS: RepairBenchmark[] = [
  {
    id: "brake-pads-rotors-axle",
    name: "Brake Pads & Rotors Replacement (Per Axle)",
    keywords: ["brake pad", "pads and rotor", "pads & rotor", "front brake", "rear brake", "brake job", "rotors"],
    bookHoursLow: 1.2,
    bookHoursHigh: 2.0,
    partsLow: 140,
    partsHigh: 280,
    priority: "safety_critical",
    upsellNote: "Dealers often charge $650-$950 per axle using high parts markup; quality ceramic pads + rotors at an independent shop typically land $320-$520.",
    recallComponentHints: ["SERVICE BRAKES"],
  },
  {
    id: "brake-pads-only",
    name: "Brake Pads Only (Per Axle)",
    keywords: ["pads only", "replace brake pads", "front pads", "rear pads"],
    bookHoursLow: 0.8,
    bookHoursHigh: 1.4,
    partsLow: 55,
    partsHigh: 120,
    priority: "safety_critical",
    recallComponentHints: ["SERVICE BRAKES"],
  },
  {
    id: "brake-fluid-flush",
    name: "Brake Fluid Exchange / Flush",
    keywords: ["brake fluid", "brake flush", "brake bleed"],
    bookHoursLow: 0.5,
    bookHoursHigh: 0.9,
    partsLow: 15,
    partsHigh: 35,
    priority: "can_wait",
    isCommonUpsellTrap: true,
    upsellNote: "Needed roughly every 2-3 years or 30k-45k miles. Shops frequently bundle it into every brake job for $160-$240 when fair price is $90-$145.",
  },
  {
    id: "cabin-air-filter",
    name: "Cabin Air Filter Replacement",
    keywords: ["cabin air filter", "cabin filter", "pollen filter", "microfilter"],
    bookHoursLow: 0.1,
    bookHoursHigh: 0.25,
    partsLow: 12,
    partsHigh: 25,
    priority: "likely_unnecessary",
    isCommonUpsellTrap: true,
    isDiyEasy: true,
    upsellNote: "Classic #1 dealer upsell. The filter costs $15 online and clips behind your glovebox in 3 minutes with zero tools. Anything over $45 is steep.",
  },
  {
    id: "engine-air-filter",
    name: "Engine Air Filter Replacement",
    keywords: ["engine air filter", "air filter", "intake filter"],
    bookHoursLow: 0.1,
    bookHoursHigh: 0.2,
    partsLow: 14,
    partsHigh: 28,
    priority: "can_wait",
    isCommonUpsellTrap: true,
    isDiyEasy: true,
    upsellNote: "Takes 2 minutes to swap via two clips under the hood. Fair shop price is $30-$50; dealers frequently bill $75-$110.",
  },
  {
    id: "fuel-injection-service",
    name: "Fuel Injection / Induction Cleaning Service",
    keywords: ["fuel injection", "fuel induction", "fuel system clean", "bg service", "efi service", "carbon clean"],
    bookHoursLow: 0.5,
    bookHoursHigh: 1.0,
    partsLow: 20,
    partsHigh: 45,
    priority: "likely_unnecessary",
    isCommonUpsellTrap: true,
    upsellNote: "Rarely required by OEM maintenance schedules if you use Top Tier gasoline. High-margin shop profit center ($180-$350) unless you have active misfire/carbon symptoms.",
  },
  {
    id: "throttle-body-service",
    name: "Throttle Body Cleaning",
    keywords: ["throttle body", "throttle clean"],
    bookHoursLow: 0.4,
    bookHoursHigh: 0.8,
    partsLow: 10,
    partsHigh: 25,
    priority: "likely_unnecessary",
    isCommonUpsellTrap: true,
    upsellNote: "Only needed if experiencing rough idle or throttle codes. Frequently padded onto 30k/60k packages for $150-$260.",
  },
  {
    id: "spark-plugs",
    name: "Spark Plug Replacement (4-Cyl / V6)",
    keywords: ["spark plug", "tune up", "ignition plug"],
    bookHoursLow: 0.8,
    bookHoursHigh: 2.2,
    partsLow: 45,
    partsHigh: 130,
    priority: "recommended_soon",
    upsellNote: "Modern iridium plugs last 60k-100k miles. Watch out for 4-cylinder cars being quoted V6 intake-removal labor ($500+).",
    recallComponentHints: ["ENGINE"],
  },
  {
    id: "ignition-coil",
    name: "Ignition Coil Replacement",
    keywords: ["ignition coil", "coil pack"],
    bookHoursLow: 0.5,
    bookHoursHigh: 1.2,
    partsLow: 55,
    partsHigh: 150,
    priority: "recommended_soon",
  },
  {
    id: "alternator",
    name: "Alternator Replacement",
    keywords: ["alternator", "charging system"],
    bookHoursLow: 1.5,
    bookHoursHigh: 2.8,
    partsLow: 210,
    partsHigh: 420,
    priority: "safety_critical",
    recallComponentHints: ["ELECTRICAL SYSTEM"],
  },
  {
    id: "starter-motor",
    name: "Starter Motor Replacement",
    keywords: ["starter", "starter motor"],
    bookHoursLow: 1.2,
    bookHoursHigh: 2.5,
    partsLow: 160,
    partsHigh: 340,
    priority: "safety_critical",
    recallComponentHints: ["ELECTRICAL SYSTEM"],
  },
  {
    id: "battery-replacement",
    name: "12V Battery Replacement",
    keywords: ["battery", "12v battery", "agm battery"],
    bookHoursLow: 0.25,
    bookHoursHigh: 0.6,
    partsLow: 140,
    partsHigh: 260,
    priority: "recommended_soon",
    isDiyEasy: true,
    upsellNote: "Auto parts stores often install standard batteries for free with purchase. Paying over $350 (except European AGM programming) is usually inflated.",
  },
  {
    id: "wheel-bearing",
    name: "Wheel Bearing / Hub Assembly Replacement",
    keywords: ["wheel bearing", "hub assembly", "front hub", "rear hub"],
    bookHoursLow: 1.4,
    bookHoursHigh: 2.6,
    partsLow: 95,
    partsHigh: 220,
    priority: "safety_critical",
    recallComponentHints: ["SUSPENSION", "WHEELS"],
  },
  {
    id: "control-arm",
    name: "Lower Control Arm & Ball Joint Replacement",
    keywords: ["control arm", "ball joint", "bushing"],
    bookHoursLow: 1.5,
    bookHoursHigh: 2.8,
    partsLow: 110,
    partsHigh: 260,
    priority: "safety_critical",
    recallComponentHints: ["SUSPENSION"],
  },
  {
    id: "struts-shocks",
    name: "Front Struts / Shocks Replacement (Pair)",
    keywords: ["strut", "shock", "quick strut", "suspension strut"],
    bookHoursLow: 2.0,
    bookHoursHigh: 3.5,
    partsLow: 260,
    partsHigh: 520,
    priority: "recommended_soon",
    upsellNote: "Ask if struts are actively leaking fluid or just 'recommended by mileage.' Minor weeping is normal; don't pay $1,400+ without proof of leak/bounce.",
    recallComponentHints: ["SUSPENSION"],
  },
  {
    id: "cv-axle",
    name: "CV Axle / Half-Shaft Replacement",
    keywords: ["cv axle", "axle shaft", "half shaft", "cv joint", "cv boot"],
    bookHoursLow: 1.4,
    bookHoursHigh: 2.5,
    partsLow: 100,
    partsHigh: 240,
    priority: "safety_critical",
    recallComponentHints: ["POWER TRAIN"],
  },
  {
    id: "wheel-alignment",
    name: "4-Wheel Alignment",
    keywords: ["alignment", "4-wheel alignment", "wheel alignment"],
    bookHoursLow: 0.8,
    bookHoursHigh: 1.2,
    partsLow: 0,
    partsHigh: 15,
    priority: "recommended_soon",
    upsellNote: "Standard market rate is $99-$159. Paying $220+ unless ADAS camera calibration is explicitly needed is high.",
  },
  {
    id: "ac-compressor",
    name: "A/C Compressor Replacement & Recharge",
    keywords: ["ac compressor", "a/c compressor", "air conditioning compressor", "a/c condenser", "ac condenser"],
    bookHoursLow: 2.5,
    bookHoursHigh: 4.5,
    partsLow: 320,
    partsHigh: 650,
    priority: "can_wait",
    upsellNote: "Check if your model has an extended manufacturer warranty or TSB on A/C condensers (common on 2016-2021 Hondas).",
  },
  {
    id: "ac-recharge",
    name: "A/C Evacuate & Recharge",
    keywords: ["ac recharge", "a/c recharge", "refrigerant", "freon", "r134a", "r1234yf"],
    bookHoursLow: 0.8,
    bookHoursHigh: 1.3,
    partsLow: 45,
    partsHigh: 140,
    priority: "can_wait",
  },
  {
    id: "timing-belt-water-pump",
    name: "Timing Belt & Water Pump Service",
    keywords: ["timing belt", "water pump", "timing kit"],
    bookHoursLow: 3.5,
    bookHoursHigh: 6.0,
    partsLow: 220,
    partsHigh: 450,
    priority: "safety_critical",
    recallComponentHints: ["ENGINE"],
  },
  {
    id: "serpentine-belt",
    name: "Serpentine / Drive Belt Replacement",
    keywords: ["serpentine", "drive belt", "accessory belt"],
    bookHoursLow: 0.5,
    bookHoursHigh: 1.1,
    partsLow: 28,
    partsHigh: 65,
    priority: "recommended_soon",
  },
  {
    id: "catalytic-converter",
    name: "Catalytic Converter Replacement",
    keywords: ["catalytic converter", "cat converter", "exhaust catalyst"],
    bookHoursLow: 1.5,
    bookHoursHigh: 3.2,
    partsLow: 450,
    partsHigh: 1350,
    priority: "recommended_soon",
    upsellNote: "Federal Emissions Warranty covers catalytic converters for 8 years / 80,000 miles! Always verify warranty eligibility before paying out of pocket.",
  },
  {
    id: "oxygen-sensor",
    name: "Oxygen (O2) Sensor Replacement",
    keywords: ["o2 sensor", "oxygen sensor", "air fuel sensor"],
    bookHoursLow: 0.6,
    bookHoursHigh: 1.2,
    partsLow: 65,
    partsHigh: 180,
    priority: "recommended_soon",
  },
  {
    id: "coolant-flush",
    name: "Coolant Flush / Drain & Fill",
    keywords: ["coolant flush", "antifreeze", "radiator flush", "cooling system flush"],
    bookHoursLow: 0.6,
    bookHoursHigh: 1.0,
    partsLow: 30,
    partsHigh: 60,
    priority: "can_wait",
    isCommonUpsellTrap: true,
    upsellNote: "Modern long-life coolants typically last 5 years / 100k miles on the first fill. Fair price is $110-$175.",
  },
  {
    id: "transmission-fluid",
    name: "Transmission Fluid Drain & Fill",
    keywords: ["transmission fluid", "transmission flush", "cvt fluid", "atf service"],
    bookHoursLow: 0.7,
    bookHoursHigh: 1.3,
    partsLow: 65,
    partsHigh: 145,
    priority: "recommended_soon",
    upsellNote: "Prefer a simple drain-and-fill over a high-pressure flush on high-mileage vehicles.",
    recallComponentHints: ["POWER TRAIN"],
  },
  {
    id: "oil-change",
    name: "Full Synthetic Oil & Filter Change",
    keywords: ["oil change", "synthetic oil", "lube oil filter", "lof"],
    bookHoursLow: 0.3,
    bookHoursHigh: 0.5,
    partsLow: 35,
    partsHigh: 65,
    priority: "recommended_soon",
  },
  {
    id: "diagnostic-fee",
    name: "Diagnostic / Inspection Fee",
    keywords: ["diagnostic", "diag fee", "check engine scan", "troubleshoot", "inspection fee"],
    bookHoursLow: 0.5,
    bookHoursHigh: 1.0,
    partsLow: 0,
    partsHigh: 0,
    priority: "recommended_soon",
    upsellNote: "Most reputable independent shops waive or credit the diagnostic fee toward the approved repair. Ask for it to be credited.",
  },
  {
    id: "shop-supplies",
    name: "Shop Supplies / Environmental Fees",
    keywords: ["shop supplies", "misc supplies", "environmental fee", "hazmat", "shop fee"],
    bookHoursLow: 0,
    bookHoursHigh: 0,
    partsLow: 15,
    partsHigh: 45,
    priority: "likely_unnecessary",
    isCommonUpsellTrap: true,
    upsellNote: "Shop supply fees should be capped around 5%-8% (typically $15-$45 max). Fees over $65 are pure profit padding and easily negotiated down.",
  },
  {
    id: "wiper-blades",
    name: "Wiper Blade Replacement",
    keywords: ["wiper blade", "windshield wiper", "wipers"],
    bookHoursLow: 0.1,
    bookHoursHigh: 0.15,
    partsLow: 20,
    partsHigh: 40,
    priority: "can_wait",
    isCommonUpsellTrap: true,
    isDiyEasy: true,
    upsellNote: "Clips on in 60 seconds. Never pay $75-$110 at a dealership for wipers.",
  },
  {
    id: "valve-cover-gasket",
    name: "Valve Cover Gasket Replacement",
    keywords: ["valve cover", "gasket leak"],
    bookHoursLow: 1.5,
    bookHoursHigh: 3.2,
    partsLow: 40,
    partsHigh: 110,
    priority: "recommended_soon",
  },
  {
    id: "radiator-replacement",
    name: "Radiator Replacement",
    keywords: ["radiator", "radiator assembly"],
    bookHoursLow: 2.0,
    bookHoursHigh: 3.6,
    partsLow: 180,
    partsHigh: 420,
    priority: "safety_critical",
  },
  {
    id: "thermostat-replacement",
    name: "Thermostat & Housing Replacement",
    keywords: ["thermostat"],
    bookHoursLow: 1.0,
    bookHoursHigh: 2.2,
    partsLow: 45,
    partsHigh: 140,
    priority: "safety_critical",
  },
  {
    id: "tie-rod",
    name: "Tie Rod End Replacement",
    keywords: ["tie rod", "outer tie rod", "inner tie rod"],
    bookHoursLow: 0.9,
    bookHoursHigh: 1.6,
    partsLow: 45,
    partsHigh: 115,
    priority: "safety_critical",
    recallComponentHints: ["STEERING"],
  },
  {
    id: "sway-bar-link",
    name: "Sway Bar Link Replacement",
    keywords: ["sway bar", "stabilizer link", "end link"],
    bookHoursLow: 0.6,
    bookHoursHigh: 1.2,
    partsLow: 35,
    partsHigh: 85,
    priority: "can_wait",
  },
  {
    id: "brake-caliper",
    name: "Brake Caliper Replacement",
    keywords: ["caliper", "brake caliper"],
    bookHoursLow: 1.0,
    bookHoursHigh: 1.8,
    partsLow: 95,
    partsHigh: 240,
    priority: "safety_critical",
    recallComponentHints: ["SERVICE BRAKES"],
  },
];

export function matchRepairBenchmark(description: string): RepairBenchmark | null {
  const lower = description.toLowerCase();
  let best: RepairBenchmark | null = null;
  let bestLen = 0;

  for (const b of REPAIR_BENCHMARKS) {
    for (const kw of b.keywords) {
      if (lower.includes(kw) && kw.length > bestLen) {
        best = b;
        bestLen = kw.length;
      }
    }
  }
  return best;
}

export function computeFairRange(
  benchmark: RepairBenchmark,
  laborTier: RegionalLaborTier,
  makeMultiplier: number
): { fairLow: number; fairHigh: number; partsLow: number; partsHigh: number } {
  const partsLow = Math.round(benchmark.partsLow * makeMultiplier);
  const partsHigh = Math.round(benchmark.partsHigh * makeMultiplier * 1.15);
  const laborLow = benchmark.bookHoursLow * laborTier.independentLow;
  const laborHigh = benchmark.bookHoursHigh * laborTier.independentHigh * (makeMultiplier > 1.2 ? 1.15 : 1.0);

  return {
    fairLow: Math.max(20, Math.round((partsLow + laborLow) / 5) * 5),
    fairHigh: Math.max(35, Math.round((partsHigh + laborHigh) / 5) * 5),
    partsLow,
    partsHigh,
  };
}
