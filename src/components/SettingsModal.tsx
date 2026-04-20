import { useEffect, useState } from "react";
import { DEFAULT_MODEL } from "../lib/claude";

interface Props {
  open: boolean;
  apiKey: string;
  model: string;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
}

export function SettingsModal({ open, apiKey, model, onClose, onSave }: Props) {
  const [key, setKey] = useState(apiKey);
  const [m, setM] = useState(model || DEFAULT_MODEL);

  useEffect(() => {
    if (open) {
      setKey(apiKey);
      setM(model || DEFAULT_MODEL);
    }
  }, [open, apiKey, model]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Settings</h2>
            <p style={{ marginTop: 6, fontSize: 13, color: "var(--fg-muted)" }}>
              Store your Claude API key locally on this Mac.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 13,
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Close
          </button>
        </div>

        <label style={{ display: "block", marginTop: 20 }}>
          <span
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg)",
            }}
          >
            Claude API Key
          </span>
          <input
            className="input-field"
            value={key}
            type="password"
            placeholder="sk-ant-..."
            onChange={(e) => setKey(e.target.value)}
          />
        </label>

        <label style={{ display: "block", marginTop: 16 }}>
          <span
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg)",
            }}
          >
            Model
          </span>
          <input
            className="input-field"
            value={m}
            placeholder={DEFAULT_MODEL}
            onChange={(e) => setM(e.target.value)}
          />
        </label>

        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
          }}
        >
          Without a key, Scout falls back to a local response generator so you can still demo the
          flow. Keys are stored in this browser only.
        </p>

        <button
          className="btn-accent"
          style={{ marginTop: 20, width: "100%" }}
          onClick={() => onSave(key.trim(), m.trim() || DEFAULT_MODEL)}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
