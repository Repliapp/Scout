import { useState } from "react";
import { IconSearch, IconCorner } from "./icons";
import type { Property } from "../types";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  results: Property[];
  onPick: (p: Property) => void;
  status: string;
  onOpenSettings: () => void;
}

export function CommandBar({
  query,
  onQuery,
  results,
  onPick,
  status,
  onOpenSettings,
}: Props) {
  const [focused, setFocused] = useState(false);
  const show = focused && results.length > 0;

  return (
    <div
      className="row"
      style={{
        height: 44,
        borderBottom: "1px solid var(--border)",
        padding: "0 14px",
        gap: 12,
        flex: "none",
        position: "relative",
      }}
    >
      <div className="row" style={{ gap: 6, fontSize: 12, color: "var(--fg-subtle)" }}>
        <span style={{ color: "var(--fg-muted)" }}>Response</span>
        <span>/</span>
        <span>Untitled</span>
      </div>

      <div style={{ flex: 1, position: "relative", maxWidth: 480, margin: "0 auto" }}>
        <div
          className="row"
          style={{
            position: "relative",
            gap: 8,
            padding: "0 8px",
            height: 28,
            borderRadius: 6,
            background: focused ? "var(--hover)" : "transparent",
          }}
        >
          <span style={{ color: "var(--fg-subtle)" }}>
            <IconSearch />
          </span>
          <input
            value={query}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search address…"
            style={{ flex: 1, height: 28, fontSize: 12.5, color: "var(--fg)" }}
          />
          <span className="row" style={{ gap: 3 }}>
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </div>

        {show && (
          <div
            style={{
              position: "absolute",
              top: 34,
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "var(--shadow-dropdown)",
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            {results.map((r, i) => (
              <button
                key={r.address}
                onMouseDown={() => onPick(r)}
                className="row"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  gap: 10,
                  cursor: "pointer",
                  borderBottom:
                    i < results.length - 1 ? "1px solid var(--border)" : "none",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--hover)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.address}</div>
                  <div style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>
                    {r.suburb} · {r.bedrooms}/{r.bathrooms}/{r.carSpaces}
                  </div>
                </div>
                <span className="kbd">
                  <IconCorner />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 8, fontSize: 11.5, color: "var(--fg-subtle)" }}>
        <span>{status}</span>
        <span className="divv" style={{ height: 14 }} />
        <button className="btn" style={{ height: 26, padding: "0 8px" }} onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </div>
  );
}
