import { IconPlus } from "./icons";
import type { HistoryItem } from "../types";

interface Props {
  items: HistoryItem[];
  activeId: string | null;
  onSelect: (item: HistoryItem) => void;
  onNew: () => void;
}

export function Sidebar({ items, activeId, onSelect, onNew }: Props) {
  return (
    <aside
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#fff",
      }}
    >
      <div className="row" style={{ padding: "14px 16px 10px", gap: 8 }}>
        <div style={{ width: 16, height: 16, borderRadius: 3, background: "var(--fg)" }} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-.01em" }}>Scout</div>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)", marginLeft: "auto" }}>
          by Repli
        </span>
      </div>

      <button
        onClick={onNew}
        className="btn"
        style={{
          margin: "0 10px 10px",
          height: 28,
          width: "calc(100% - 20px)",
          justifyContent: "flex-start",
        }}
      >
        <IconPlus />
        <span>New response</span>
        <span className="row" style={{ marginLeft: "auto", gap: 2 }}>
          <span className="kbd">⌘</span>
          <span className="kbd">N</span>
        </span>
      </button>

      <div style={{ padding: "8px 16px 4px" }}>
        <span className="eyebrow">History</span>
      </div>
      <div
        className="scroll"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 8px 8px" }}
      >
        {items.map((h) => (
          <button
            key={h.id}
            className={`hist ${h.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(h)}
          >
            <div className="row" style={{ gap: 6, justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {h.address}
              </span>
              <span style={{ fontSize: 10.5, color: "var(--fg-subtle)", flex: "none" }}>
                {h.time}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{h.suburb}</span>
          </button>
        ))}
      </div>

      <div
        className="row"
        style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", gap: 8 }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#E8EAEE",
            color: "var(--fg-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9.5,
            fontWeight: 600,
          }}
        >
          SR
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>Sam Ruiz</div>
      </div>
    </aside>
  );
}
