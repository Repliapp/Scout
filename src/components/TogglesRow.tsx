import { IconCheck } from "./icons";
import type { ToggleKey, Toggles } from "../types";

const TOGGLE_LABELS: [ToggleKey, string][] = [
  ["summary", "Summary"],
  ["specs", "Specs"],
  ["location", "Location"],
  ["flood", "Flood"],
  ["bushfire", "Bushfire"],
  ["zoning", "Zoning"],
  ["council", "Council"],
];

interface Props {
  toggles: Toggles;
  onToggle: (key: ToggleKey) => void;
}

export function TogglesRow({ toggles, onToggle }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {TOGGLE_LABELS.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onToggle(k)}
          className="row"
          style={{
            height: 24,
            padding: "0 10px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 500,
            gap: 5,
            color: toggles[k] ? "var(--fg)" : "var(--fg-subtle)",
            background: toggles[k] ? "var(--hover)" : "transparent",
          }}
        >
          {toggles[k] && <IconCheck />}
          {label}
        </button>
      ))}
    </div>
  );
}
