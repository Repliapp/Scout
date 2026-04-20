import type { ExtractedDelta, Property } from "../types";

interface Props {
  property: Property | null;
  distanceKm: number | null;
  extracted: ExtractedDelta | null;
  onApply: () => void;
  onDismiss: () => void;
}

function Diff({ label, from, to }: { label: string; from: string | number; to: string | number }) {
  if (String(from) === String(to)) return null;
  return (
    <span>
      {label} <span className="diffd">{from}</span> <span className="diffa">{to}</span>
    </span>
  );
}

export function SnapshotPanel({
  property,
  distanceKm,
  extracted,
  onApply,
  onDismiss,
}: Props) {
  if (!property) {
    return (
      <section>
        <span className="eyebrow">Snapshot</span>
        <div style={{ marginTop: 10, padding: "20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>No property selected</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 4 }}>
            Press <span className="kbd">⌘</span>
            <span className="kbd">K</span> to search
          </div>
        </div>
      </section>
    );
  }

  const facts: { k: string; v: string | number }[] = [
    { k: "Beds", v: property.bedrooms },
    { k: "Baths", v: property.bathrooms },
    { k: "Car", v: property.carSpaces },
    { k: "Land", v: property.landM2 ? `${property.landM2}m²` : "—" },
    { k: "Built", v: property.yearBuilt ?? "—" },
    { k: "To CBD", v: distanceKm != null ? `${distanceKm}km` : "—" },
    { k: "Flood", v: property.floodRisk ?? "—" },
    { k: "Bushfire", v: property.bushfireRisk ?? "—" },
    { k: "Zoning", v: property.zoning ?? "—" },
  ];

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="eyebrow">Snapshot</span>
        {property.source && (
          <span style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>
            {property.source === "cache"
              ? "Loaded from cache"
              : property.source === "document"
                ? "From document"
                : "Auto"}
          </span>
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--fg)",
          lineHeight: 1.35,
        }}
      >
        {property.address}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 2 }}>
        {property.suburb}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
        {facts.map((f, i) => (
          <div
            key={f.k}
            className="row"
            style={{
              justifyContent: "space-between",
              padding: "7px 0",
              borderTop: i === 0 ? "1px solid var(--border)" : "none",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{f.k}</span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg)" }}>{f.v}</span>
          </div>
        ))}
      </div>

      {extracted && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", fontWeight: 500 }}>
            Document suggests updates
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--fg-muted)",
              display: "flex",
              flexWrap: "wrap",
              columnGap: 16,
              rowGap: 2,
            }}
          >
            {extracted.bedrooms != null && (
              <Diff label="Beds" from={property.bedrooms} to={extracted.bedrooms} />
            )}
            {extracted.bathrooms != null && (
              <Diff label="Baths" from={property.bathrooms} to={extracted.bathrooms} />
            )}
            {extracted.landM2 != null && (
              <Diff
                label="Land"
                from={property.landM2 ? `${property.landM2}m²` : "—"}
                to={`${extracted.landM2}m²`}
              />
            )}
            {extracted.features?.length ? (
              <span>
                Features <span className="diffa">{extracted.features.join(", ")}</span>
              </span>
            ) : null}
          </div>
          <div className="row" style={{ gap: 4, marginTop: 10 }}>
            <button className="btn" onClick={onApply} style={{ color: "var(--fg)" }}>
              Apply
            </button>
            <button className="btn" onClick={onDismiss}>
              Ignore
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
