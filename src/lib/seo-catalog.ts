import { REPAIR_BENCHMARKS, computeFairRange, getMakeMultiplier, getRegionalLaborTier } from "./repair-benchmarks";

export interface SeoVehicle {
  slug: string;
  make: string;
  model: string;
  popularYears: string;
  sampleYear: number;
  segment: string;
  commonWatchouts: string[];
}

export interface SeoRepair {
  slug: string;
  benchmarkId: string;
  title: string;
  shortTitle: string;
  symptoms: string[];
  dealerTrap: string;
}

export const SEO_VEHICLES: SeoVehicle[] = [
  { slug: "honda-civic", make: "Honda", model: "Civic", popularYears: "2016–2025", sampleYear: 2020, segment: "Compact Sedan", commonWatchouts: ["A/C condenser leaks (often covered by extended warranty)", "Early rear brake pad wear"] },
  { slug: "honda-accord", make: "Honda", model: "Accord", popularYears: "2016–2025", sampleYear: 2020, segment: "Midsize Sedan", commonWatchouts: ["1.5T fuel injector / head gasket reports", "Rear brake pads wearing faster than fronts"] },
  { slug: "honda-cr-v", make: "Honda", model: "CR-V", popularYears: "2017–2025", sampleYear: 2020, segment: "Compact SUV", commonWatchouts: ["1.5T oil dilution in cold climates", "A/C compressor & condenser repairs"] },
  { slug: "toyota-camry", make: "Toyota", model: "Camry", popularYears: "2015–2025", sampleYear: 2020, segment: "Midsize Sedan", commonWatchouts: ["Dealer 30k/60k upsell packages (fuel induction & cabin filters)", "Front strut mount noise"] },
  { slug: "toyota-corolla", make: "Toyota", model: "Corolla", popularYears: "2015–2025", sampleYear: 2020, segment: "Compact Sedan", commonWatchouts: ["CVT fluid service quotes inflated by dealers", "Simple 4-cylinder spark plugs overbilled as complex labor"] },
  { slug: "toyota-rav4", make: "Toyota", model: "RAV4", popularYears: "2016–2025", sampleYear: 2021, segment: "Compact SUV", commonWatchouts: ["Hybrid high-voltage cable corrosion in salt states", "Rear brake rotor rust in northern states"] },
  { slug: "ford-f-150", make: "Ford", model: "F-150", popularYears: "2015–2025", sampleYear: 2020, segment: "Full-Size Pickup", commonWatchouts: ["EcoBoost cam phaser rattle", "10-speed transmission service & heavy truck brake parts markup"] },
  { slug: "chevrolet-silverado-1500", make: "Chevrolet", model: "Silverado 1500", popularYears: "2015–2025", sampleYear: 2020, segment: "Full-Size Pickup", commonWatchouts: ["AFM/DFM lifter issues", "A/C condenser weld cracks & heavy-duty wheel hub wear"] },
  { slug: "nissan-altima", make: "Nissan", model: "Altima", popularYears: "2016–2025", sampleYear: 2020, segment: "Midsize Sedan", commonWatchouts: ["CVT transmission fluid intervals (prefer drain & fill)", "Front lower control arm bushings"] },
  { slug: "nissan-rogue", make: "Nissan", model: "Rogue", popularYears: "2016–2025", sampleYear: 2020, segment: "Compact SUV", commonWatchouts: ["CVT fluid service", "Front strut & wheel bearing wear around 75k+ miles"] },
  { slug: "hyundai-elantra", make: "Hyundai", model: "Elantra", popularYears: "2016–2025", sampleYear: 2020, segment: "Compact Sedan", commonWatchouts: ["Check open recall/extended engine warranty before paying for powertrain repairs", "Ignition coil misfires"] },
  { slug: "hyundai-tucson", make: "Hyundai", model: "Tucson", popularYears: "2016–2025", sampleYear: 2020, segment: "Compact SUV", commonWatchouts: ["Verify Hyundai 10yr/100k powertrain or recall coverage first", "Wheel speed sensor & brake pad wear"] },
  { slug: "subaru-outback", make: "Subaru", model: "Outback", popularYears: "2015–2025", sampleYear: 2020, segment: "AWD Wagon/SUV", commonWatchouts: ["Boxer spark plugs take extra labor (fairly higher than inline-4)", "Rear wheel bearing hum around 60k-90k miles"] },
  { slug: "jeep-grand-cherokee", make: "Jeep", model: "Grand Cherokee", popularYears: "2015–2025", sampleYear: 2020, segment: "Midsize SUV", commonWatchouts: ["3.6L Pentastar oil cooler housing leaks", "Front control arm bushings & suspension labor"] },
  { slug: "mazda-cx-5", make: "Mazda", model: "CX-5", popularYears: "2016–2025", sampleYear: 2021, segment: "Compact SUV", commonWatchouts: ["Dealer 'Skyactiv' fluid flush bundles", "Electronic parking brake service mode during rear brake jobs"] },
  { slug: "volkswagen-jetta", make: "Volkswagen", model: "Jetta", popularYears: "2015–2025", sampleYear: 2020, segment: "Compact Sedan", commonWatchouts: ["European shop labor inflation on basic brakes/filters", "Water pump & thermostat housing leaks"] },
  { slug: "bmw-3-series", make: "BMW", model: "3 Series", popularYears: "2015–2025", sampleYear: 2020, segment: "Luxury Sport Sedan", commonWatchouts: ["Dealerships routinely charge 2x independent Euro specialists for brakes & batteries", "Coolant expansion tank / thermostat leaks"] },
  { slug: "ram-1500", make: "Ram", model: "1500", popularYears: "2015–2025", sampleYear: 2020, segment: "Full-Size Pickup", commonWatchouts: ["5.7L Hemi exhaust manifold bolts (ticking sound)", "16 spark plugs on Hemi V8 increase parts/labor vs standard V6"] },
  { slug: "kia-forte", make: "Kia", model: "Forte", popularYears: "2017–2025", sampleYear: 2021, segment: "Compact Sedan", commonWatchouts: ["Verify factory/recall coverage before paying for engine or ignition work", "Dealer cabin filter & fuel cleaning bundles"] },
  { slug: "gmc-sierra-1500", make: "GMC", model: "Sierra 1500", popularYears: "2015–2025", sampleYear: 2020, segment: "Full-Size Pickup", commonWatchouts: ["Heavy truck brake & hub parts markup", "A/C condenser & transmission cooler lines"] },
];

export const SEO_REPAIRS: SeoRepair[] = [
  {
    slug: "brake-pad-and-rotor-replacement",
    benchmarkId: "brake-pads-rotors-axle",
    title: "Brake Pad & Rotor Replacement",
    shortTitle: "Brakes & Rotors",
    symptoms: ["High-pitched squealing or grinding when stopping", "Steering wheel vibration under braking", "Pads measured under 3mm"],
    dealerTrap: "Dealers routinely quote $700-$950 per axle and tack on a $190 brake fluid flush automatically.",
  },
  {
    slug: "alternator-replacement",
    benchmarkId: "alternator",
    title: "Alternator Replacement",
    shortTitle: "Alternator",
    symptoms: ["Red battery warning light while driving", "Dimming headlights or flickering dashboard", "Repeated dead battery shortly after jump-starting"],
    dealerTrap: "Shops sometimes sell both a new battery and alternator without load-testing the battery first—ask for the printed load-test slip.",
  },
  {
    slug: "spark-plug-replacement",
    benchmarkId: "spark-plugs",
    title: "Spark Plug Replacement",
    shortTitle: "Spark Plugs",
    symptoms: ["Rough idle or engine misfire code (P0300–P0306)", "Sluggish acceleration and drop in MPG", "Hard cold starts past 80k–100k miles"],
    dealerTrap: "On easy 4-cylinder engines, spark plugs take under an hour. Paying $500+ for plugs plus a 'fuel induction service' is classic padding.",
  },
  {
    slug: "wheel-bearing-replacement",
    benchmarkId: "wheel-bearing",
    title: "Wheel Bearing Replacement",
    shortTitle: "Wheel Bearing",
    symptoms: ["Loud humming or growling that gets louder above 40 mph", "Noise changes pitch when steering gently left or right", "Play/looseness when wheel is lifted"],
    dealerTrap: "Shops often quote pressing labor even on bolt-on hub assemblies, inflating labor by 1.5+ hours.",
  },
  {
    slug: "ac-compressor-replacement",
    benchmarkId: "ac-compressor",
    title: "A/C Compressor Replacement",
    shortTitle: "A/C Compressor",
    symptoms: ["Warm air blowing with A/C maxed", "Loud rattling/clunking when A/C clutch engages", "Refrigerant leak visible at compressor seal"],
    dealerTrap: "Always confirm the compressor actually failed—many $1,400 compressor quotes turn out to be a $40 relay or condenser covered by a TSB.",
  },
  {
    slug: "starter-motor-replacement",
    benchmarkId: "starter-motor",
    title: "Starter Motor Replacement",
    shortTitle: "Starter Motor",
    symptoms: ["Single loud click when turning key/pushing start", "Intermittent no-crank while dashboard lights stay bright", "Grinding noise on ignition"],
    dealerTrap: "Make sure battery voltage and starter relay were tested first; dealers mark up OEM remanufactured starters 80%+.",
  },
  {
    slug: "control-arm-replacement",
    benchmarkId: "control-arm",
    title: "Control Arm Replacement",
    shortTitle: "Control Arm",
    symptoms: ["Clunking noise over bumps or driveways", "Wandering steering or uneven inner tire wear", "Torn rubber control arm bushings on inspection"],
    dealerTrap: "Surface hairline cracks in rubber bushings are normal with age—ask for a photo showing actual tearing or separation before paying $900+.",
  },
  {
    slug: "catalytic-converter-replacement",
    benchmarkId: "catalytic-converter",
    title: "Catalytic Converter Replacement",
    shortTitle: "Catalytic Converter",
    symptoms: ["Check Engine code P0420 or P0430", "Rattling from under the car or sulfur smell", "Failed emissions inspection"],
    dealerTrap: "Federal law mandates an 8-year / 80,000-mile emissions warranty on catalytic converters. Also verify an O2 sensor or exhaust leak isn't causing P0420.",
  },
  {
    slug: "strut-and-shock-replacement",
    benchmarkId: "struts-shocks",
    title: "Strut & Shock Replacement",
    shortTitle: "Struts & Shocks",
    symptoms: ["Bouncy ride or nose-diving during hard stops", "Cupped/scalloped tire tread wear", "Active oil dripping down the strut body"],
    dealerTrap: "Many shops recommend struts purely by mileage (50k–60k). Minor misting is normal; only replace if actively leaking or failing a bounce test.",
  },
  {
    slug: "timing-belt-and-water-pump-replacement",
    benchmarkId: "timing-belt-water-pump",
    title: "Timing Belt & Water Pump Replacement",
    shortTitle: "Timing Belt & Water Pump",
    symptoms: ["Vehicle approaching 90k–105k miles (preventative)", "Coolant seepage from water pump weep hole", "Chirping or squealing near front timing cover"],
    dealerTrap: "First verify your engine uses a timing belt—many modern Hondas, Toyotas, and Chevys use a lifetime timing chain and don't need belt replacement at all!",
  },
];

export function getSeoCostSummary(vehicleSlug: string, repairSlug: string) {
  const vehicle = SEO_VEHICLES.find((v) => v.slug === vehicleSlug);
  const repair = SEO_REPAIRS.find((r) => r.slug === repairSlug);
  if (!vehicle || !repair) return null;

  const benchmark = REPAIR_BENCHMARKS.find((b) => b.id === repair.benchmarkId);
  if (!benchmark) return null;

  const nationalTier = getRegionalLaborTier();
  const makeMult = getMakeMultiplier(vehicle.make);
  const fair = computeFairRange(benchmark, nationalTier, makeMult);
  const dealerLow = Math.round((fair.fairLow * 1.25) / 10) * 10;
  const dealerHigh = Math.round((fair.fairHigh * 1.48) / 10) * 10;

  return {
    vehicle,
    repair,
    benchmark,
    fairLow: fair.fairLow,
    fairHigh: fair.fairHigh,
    partsLow: fair.partsLow,
    partsHigh: fair.partsHigh,
    dealerLow,
    dealerHigh,
  };
}
