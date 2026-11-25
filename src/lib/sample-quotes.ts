export interface SampleQuotePreset {
  id: string;
  label: string;
  badge: string;
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    zipCode: string;
    mileage: number;
  };
  shopType: "dealership" | "independent" | "chain";
  quoteText: string;
}

export const SAMPLE_QUOTES: SampleQuotePreset[] = [
  {
    id: "honda-dealer-padding",
    label: "2020 Honda Accord — Dealership $1,845 Quote",
    badge: "Classic Upsell Trap",
    vehicle: {
      vin: "1HGCV1F30LA000001",
      year: 2020,
      make: "Honda",
      model: "Accord",
      zipCode: "94107",
      mileage: 64200,
    },
    shopType: "dealership",
    quoteText: `Front Brake Pads and Rotors Replacement - $845
Brake Fluid Exchange / Flush - $219
Cabin Air Filter Replacement - $98
Engine Air Filter Replacement - $85
Fuel Injection / Induction Cleaning Service - $289
Throttle Body Cleaning - $195
Shop Supplies & Environmental Fee - $114`,
  },
  {
    id: "ford-f150-suspension",
    label: "2020 Ford F-150 — Chain Shop $2,460 Quote",
    badge: "Inflated Labor",
    vehicle: {
      vin: "",
      year: 2020,
      make: "Ford",
      model: "F-150",
      zipCode: "75201",
      mileage: 82500,
    },
    shopType: "chain",
    quoteText: `Front Struts / Shocks Replacement (Pair) - $1,390
Lower Control Arm & Ball Joint Replacement - $695
4-Wheel Alignment - $215
Diagnostic / Inspection Fee - $160`,
  },
  {
    id: "toyota-camry-fair",
    label: "2020 Toyota Camry — Independent $540 Quote",
    badge: "Mostly Fair",
    vehicle: {
      vin: "",
      year: 2020,
      make: "Toyota",
      model: "Camry",
      zipCode: "43215",
      mileage: 74000,
    },
    shopType: "independent",
    quoteText: `Front Brake Pads and Rotors Replacement - $425
Full Synthetic Oil & Filter Change - $85
Shop Supplies - $30`,
  },
];
