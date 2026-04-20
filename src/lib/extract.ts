import type { ExtractedDelta, Property } from "../types";

// Demo document extraction. In production this would call Claude Vision on the
// uploaded PDF/PNG/JPG. Here we produce a plausible diff against the current
// property so the confirmation modal + inline diff UI are exercisable.
export function mockExtractFrom(property: Property): ExtractedDelta {
  return {
    bedrooms: property.bedrooms + 1,
    bathrooms: Math.max(2, property.bathrooms + 1),
    carSpaces: property.carSpaces,
    landM2: property.landM2 ? property.landM2 + 36 : 648,
    features: ["pool", "renovated kitchen"],
    headline: "Family home close to town",
  };
}

export function applyDelta(
  property: Property,
  delta: ExtractedDelta,
  accepted: Partial<Record<keyof ExtractedDelta, boolean>>
): Property {
  const next: Property = { ...property, source: "document" };
  if (accepted.bedrooms && delta.bedrooms != null) next.bedrooms = delta.bedrooms;
  if (accepted.bathrooms && delta.bathrooms != null) next.bathrooms = delta.bathrooms;
  if (accepted.carSpaces && delta.carSpaces != null) next.carSpaces = delta.carSpaces;
  if (accepted.landM2 && delta.landM2 != null) next.landM2 = delta.landM2;
  if (accepted.features && delta.features) next.features = delta.features;
  return next;
}
