export interface VehicleProfile {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  bodyClass?: string;
  zipCode?: string;
  mileage?: number;
}

export interface NhtsaRecall {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportReceivedDate?: string;
}

export interface ComplaintHotspot {
  component: string;
  count: number;
  crashes: number;
  fires: number;
  sampleSummary: string;
}

export interface NhtsaReport {
  vehicle: VehicleProfile;
  recalls: NhtsaRecall[];
  totalComplaints: number;
  complaintHotspots: ComplaintHotspot[];
  fetchedAt: string;
}

export type ItemVerdict = "fair" | "high" | "overpriced" | "upsell_trap";
export type SafetyPriority = "safety_critical" | "recommended_soon" | "can_wait" | "likely_unnecessary";

export interface AuditedLineItem {
  id: string;
  shopDescription: string;
  matchedRepairName: string;
  quotedPrice: number;
  fairLow: number;
  fairHigh: number;
  estimatedOvercharge: number;
  bookHoursRange: string;
  partsRange: string;
  verdict: ItemVerdict;
  priority: SafetyPriority;
  explanation: string;
  negotiationTip: string;
  isDiyEasy?: boolean;
  recallOverlap?: string;
}

export interface NegotiationScript {
  title: string;
  scenario: string;
  script: string;
  estimatedSavings: string;
}

export interface QuoteAuditResult {
  auditId: string;
  engineMode: "gemini_vision" | "grounded_benchmark";
  vehicle: VehicleProfile;
  regionLabel: string;
  regionalLaborRate: {
    independentLow: number;
    independentHigh: number;
    dealerHigh: number;
  };
  shopType: "dealership" | "independent" | "chain" | "unknown";
  fairnessScore: number; // 0 - 100
  overallVerdict: "FAIR_QUOTE" | "SLIGHTLY_HIGH" | "OVERCHARGED" | "MAJOR_RIPOFF";
  summaryHeadline: string;
  summaryInsight: string;
  totalQuoted: number;
  fairTotalLow: number;
  fairTotalHigh: number;
  estimatedSavingsLow: number;
  estimatedSavingsHigh: number;
  lineItems: AuditedLineItem[];
  nhtsa: NhtsaReport | null;
  negotiationScripts: NegotiationScript[];
  safetyChecklist: {
    mustDoNow: string[];
    canWaitOrDecline: string[];
  };
  createdAt: string;
}
