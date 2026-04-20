export type RiskLevel = "Low" | "Medium" | "High" | null;

export interface Property {
  address: string;
  suburb: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landM2?: number;
  yearBuilt?: number;
  features?: string[];
  floodRisk?: RiskLevel;
  bushfireRisk?: RiskLevel;
  zoning?: string;
  councilNotes?: string;
  source?: "cache" | "dataset" | "document";
}

export type ToggleKey =
  | "summary"
  | "specs"
  | "location"
  | "flood"
  | "bushfire"
  | "zoning"
  | "council";

export type Toggles = Record<ToggleKey, boolean>;

export type TemplateId = "enquiry" | "inspection" | "price";

export interface ExtractedDelta {
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  landM2?: number;
  features?: string[];
  headline?: string;
}

export interface HistoryItem {
  id: string;
  time: string;
  address: string;
  suburb: string;
}
