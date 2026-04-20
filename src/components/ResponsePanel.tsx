import { IconCheck, IconCopy } from "./icons";
import type { TemplateId } from "../types";

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "enquiry", label: "Enquiry" },
  { id: "inspection", label: "Inspection" },
  { id: "price", label: "Price guide" },
];

interface Props {
  text: string;
  isStreaming: boolean;
  template: TemplateId;
  onTemplate: (t: TemplateId) => void;
  onCopy: () => void;
  copied: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}

export function ResponsePanel({
  text,
  isStreaming,
  template,
  onTemplate,
  onCopy,
  copied,
  onGenerate,
  canGenerate,
}: Props) {
  const wc = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div className="seg">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={template === t.id ? "active" : ""}
              onClick={() => onTemplate(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn" onClick={onCopy} disabled={!text}>
            {copied ? (
              <>
                <IconCheck />
                Copied
              </>
            ) : (
              <>
                <IconCopy />
                Copy
              </>
            )}
          </button>
          <button className="btn btn-primary" onClick={onGenerate} disabled={!canGenerate}>
            {isStreaming ? "Generating…" : "Generate"}
            <span className="row" style={{ gap: 2, marginLeft: 2, opacity: 0.6 }}>
              <span className="kbd" style={{ color: "#fff" }}>
                ⌘
              </span>
              <span className="kbd" style={{ color: "#fff" }}>
                ↵
              </span>
            </span>
          </button>
        </div>
      </div>

      <div
        className="scroll"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 0" }}
      >
        <div
          style={{
            maxWidth: 620,
            fontSize: 14.5,
            lineHeight: 1.8,
            color: "var(--fg)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
          {isStreaming && <span className="caret" />}
        </div>
      </div>

      <div
        className="row"
        style={{
          justifyContent: "space-between",
          marginTop: 10,
          fontSize: 11,
          color: "var(--fg-subtle)",
        }}
      >
        <span>{text ? `${wc} words` : "—"}</span>
        <div className="row" style={{ gap: 12 }}>
          <button className="btn" style={{ height: 22, padding: "0 6px", fontSize: 11 }}>
            Save draft
          </button>
          <button className="btn" style={{ height: 22, padding: "0 6px", fontSize: 11 }}>
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
