import type { Property, TemplateId, Toggles } from "../types";

export const SYSTEM_PROMPT = `You are an Australian real estate agent writing a quick, professional response to a property enquiry.

Your tone must be:
- natural
- confident
- concise
- not overly salesy
- not robotic

Do NOT use words like: beautiful, stunning, amazing, perfect.
Do NOT exaggerate.

Write like a real agent replying quickly.

Only use provided data.
Do not guess missing information.`;

const TEMPLATE_INSTRUCTIONS: Record<TemplateId, string> = {
  enquiry:
    "Write a general enquiry response. Open with a short acknowledgement, give the snapshot, and invite an inspection.",
  inspection:
    "Write an inspection-booking response. Open with thanks, confirm the property, and propose a time to book.",
  price:
    "Write a price-guide response. Open with thanks, give the snapshot, and offer a pragmatic price context based only on the data provided.",
};

// Build the USER message from only the enabled sections, per the product spec.
export function buildUserPrompt(
  property: Property,
  toggles: Toggles,
  template: TemplateId,
  distanceKm: number | null
): string {
  const lines: string[] = [];
  lines.push(`Property:\n${property.address}, ${property.suburb}`);
  lines.push("");
  lines.push("Details:");
  lines.push(`- Bedrooms: ${property.bedrooms}`);
  lines.push(`- Bathrooms: ${property.bathrooms}`);
  lines.push(`- Car spaces: ${property.carSpaces}`);
  if (toggles.location && distanceKm != null) {
    lines.push(`- Distance to CBD: ${distanceKm}km`);
  }

  const optional: string[] = [];
  if (property.features?.length) {
    optional.push(`Features: ${property.features.join(", ")}`);
  }
  if (toggles.flood && property.floodRisk) {
    optional.push(`Flood Risk: ${property.floodRisk}`);
  }
  if (toggles.bushfire && property.bushfireRisk) {
    optional.push(`Bushfire Risk: ${property.bushfireRisk}`);
  }
  if (toggles.zoning && property.zoning) {
    optional.push(`Zoning: ${property.zoning}`);
  }
  if (toggles.council && property.councilNotes) {
    optional.push(`Council Notes: ${property.councilNotes}`);
  }

  if (optional.length) {
    lines.push("");
    lines.push("Optional:");
    for (const o of optional) lines.push(o);
  }

  lines.push("");
  lines.push("Instructions:");
  lines.push(TEMPLATE_INSTRUCTIONS[template]);
  lines.push(
    "Generate a response using only the sections provided above. Keep it concise and structured. Do not invent facts."
  );
  if (!toggles.summary) {
    lines.push("Skip the property summary paragraph.");
  }
  if (!toggles.specs) {
    lines.push("Do not enumerate the specs (beds/baths/car) as a separate line.");
  }

  return lines.join("\n");
}

// Local fallback generator — used when no API key is configured, so the app is
// always demonstrable. Mirrors the shape produced by Claude for the same prompt.
export function localGenerate(
  property: Property,
  toggles: Toggles,
  template: TemplateId,
  distanceKm: number | null
): string {
  const specs = `${property.bedrooms}-bedroom, ${property.bathrooms}-bathroom`;
  const car = property.carSpaces
    ? `${property.carSpaces === 1 ? "single" : property.carSpaces} car space${
        property.carSpaces === 1 ? "" : "s"
      }`
    : "";
  const intro =
    template === "inspection"
      ? `Thanks for the enquiry on ${property.address} — happy to book you in for an inspection.`
      : template === "price"
        ? `Thanks for reaching out about ${property.address}. Here's a quick price guide and what's shaping it.`
        : `Hey, I've got your enquiry for ${property.address}.`;

  const parts: (string | null)[] = [intro];

  if (toggles.summary) {
    const locationBit =
      toggles.location && distanceKm != null
        ? ` It sits approximately ${distanceKm}km from ${property.suburb} CBD, which puts it within easy reach of shops and schools.`
        : "";
    parts.push(
      `${property.address} is a ${specs} home${car ? ` with a ${car}` : ""}, located in ${property.suburb}.${locationBit}`
    );
  }

  if (toggles.specs) {
    const land = property.landM2 ? ` · ${property.landM2}m² land` : "";
    parts.push(
      `Key details: ${property.bedrooms} beds · ${property.bathrooms} baths · ${property.carSpaces} car${land}.`
    );
  }

  if (toggles.flood && property.floodRisk)
    parts.push(`Flood risk is noted as ${property.floodRisk}.`);
  if (toggles.bushfire && property.bushfireRisk)
    parts.push(`Bushfire risk is noted as ${property.bushfireRisk}.`);
  if (toggles.zoning && property.zoning)
    parts.push(`The property is zoned ${property.zoning}.`);
  if (toggles.council && property.councilNotes)
    parts.push(`Council notes: ${property.councilNotes}`);

  parts.push(
    template === "inspection"
      ? "Let me know a time that suits — mornings and Saturday afternoon work well this week."
      : template === "price"
        ? "Based on recent comparables in the suburb, the guide sits in line with the mid-to-high end of the street."
        : "Overall, it presents as a straightforward residential option for both owner-occupiers and investors."
  );
  parts.push("Let me know if you'd like to book an inspection or need anything else.");
  parts.push("— Sam");

  return parts.filter(Boolean).join("\n\n");
}
