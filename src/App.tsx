import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { CommandBar } from "./components/CommandBar";
import { SnapshotPanel } from "./components/SnapshotPanel";
import { TogglesRow } from "./components/TogglesRow";
import { ResponsePanel } from "./components/ResponsePanel";
import { SettingsModal } from "./components/SettingsModal";
import { IconPlus } from "./components/icons";
import { GRAFTON_CBD, HISTORY, PROPERTIES } from "./lib/mockData";
import { haversineKm } from "./lib/distance";
import { getCached, putCached } from "./lib/cache";
import { buildUserPrompt, SYSTEM_PROMPT, localGenerate } from "./lib/prompt";
import {
  DEFAULT_MODEL,
  getApiKey,
  getModel,
  setApiKey,
  setModel,
  streamMessage,
} from "./lib/claude";
import { applyDelta, mockExtractFrom } from "./lib/extract";
import type {
  ExtractedDelta,
  HistoryItem,
  Property,
  TemplateId,
  ToggleKey,
  Toggles,
} from "./types";

const DEFAULT_TOGGLES: Toggles = {
  summary: true,
  specs: true,
  location: true,
  flood: false,
  bushfire: false,
  zoning: false,
  council: false,
};

function resolveProperty(address: string): Property | null {
  const cached = getCached(address);
  if (cached) return cached;
  const hit = PROPERTIES.find((p) => p.address.startsWith(address));
  if (!hit) return null;
  putCached(hit);
  return { ...hit, source: "cache" };
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Property[]>([]);

  const [property, setProperty] = useState<Property | null>(null);
  const [extracted, setExtracted] = useState<ExtractedDelta | null>(null);

  const [toggles, setToggles] = useState<Toggles>(DEFAULT_TOGGLES);
  const [template, setTemplate] = useState<TemplateId>("enquiry");

  const [text, setText] = useState<string>("Search for a property, then generate a response.");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Ready");

  const [activeId, setActiveId] = useState<string | null>(HISTORY[0]?.id ?? null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKeyState] = useState("");
  const [model, setModelState] = useState(DEFAULT_MODEL);

  const abortRef = useRef<AbortController | null>(null);
  const streamIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setApiKeyState(getApiKey());
    setModelState(getModel());
  }, []);

  // Debounced local search.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      setResults(
        PROPERTIES.filter(
          (p) =>
            p.address.toLowerCase().includes(q) || p.suburb.toLowerCase().includes(q)
        ).slice(0, 5)
      );
    }, 120);
    return () => window.clearTimeout(t);
  }, [query]);

  // Preload the active history item so the app opens with a working surface.
  useEffect(() => {
    const first = HISTORY[0];
    if (!first) return;
    const t = window.setTimeout(() => {
      const p = resolveProperty(first.address) ?? PROPERTIES[0];
      setProperty(p);
      setStatus(p.source === "cache" ? "Loaded from cache" : "Auto-filled");
    }, 200);
    return () => window.clearTimeout(t);
  }, []);

  const distanceKm = useMemo(() => {
    if (!property) return null;
    return haversineKm(property.lat, property.lng, GRAFTON_CBD.lat, GRAFTON_CBD.lng);
  }, [property]);

  function pick(p: Property) {
    const resolved = resolveProperty(p.address) ?? p;
    setProperty(resolved);
    setResults([]);
    setQuery("");
    setExtracted(null);
    setStatus(resolved.source === "cache" ? "Loaded from cache" : "Auto-filled");
    setText("Property ready. Generate a response when ready.");
    setCopied(false);
  }

  function handleHistory(h: HistoryItem) {
    setActiveId(h.id);
    const match = PROPERTIES.find((p) => p.address.startsWith(h.address)) ?? PROPERTIES[0];
    pick(match);
  }

  function handleNew() {
    setProperty(null);
    setExtracted(null);
    setText("Search for a property, then generate a response.");
    setStatus("Ready");
    setActiveId(null);
  }

  function toggle(key: ToggleKey) {
    setToggles((t) => ({ ...t, [key]: !t[key] }));
    setCopied(false);
  }

  function stopStream() {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamIntervalRef.current != null) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  }

  function streamLocal(full: string) {
    setText("");
    setIsStreaming(true);
    setStatus("Generating response");
    let i = 0;
    streamIntervalRef.current = window.setInterval(() => {
      i += 3 + Math.floor(Math.random() * 4);
      if (i >= full.length) {
        setText(full);
        setIsStreaming(false);
        setStatus("Response ready");
        if (streamIntervalRef.current != null) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      } else {
        setText(full.slice(0, i));
      }
    }, 22) as unknown as number;
  }

  async function generate() {
    if (!property || isStreaming) return;
    stopStream();

    const user = buildUserPrompt(property, toggles, template, distanceKm);
    const key = getApiKey();

    if (!key) {
      streamLocal(localGenerate(property, toggles, template, distanceKm));
      return;
    }

    setText("");
    setIsStreaming(true);
    setStatus("Generating response");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamMessage({
        apiKey: key,
        model: getModel(),
        system: SYSTEM_PROMPT,
        user,
        signal: controller.signal,
        onDelta: (chunk) => setText((prev) => prev + chunk),
      });
      setIsStreaming(false);
      setStatus("Response ready");
    } catch (err) {
      setIsStreaming(false);
      if ((err as Error).name === "AbortError") {
        setStatus("Ready");
        return;
      }
      setStatus("Unable to reach Claude — using local fallback");
      streamLocal(localGenerate(property, toggles, template, distanceKm));
    } finally {
      abortRef.current = null;
    }
  }

  // Keyboard shortcuts: ⌘↵ generate, ⌘N new.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNew();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function handleUpload() {
    if (!property) return;
    // In production: send file to Claude Vision. Here: synthesise a plausible delta.
    setStatus("Extracting from document");
    window.setTimeout(() => {
      setExtracted(mockExtractFrom(property));
      setStatus("Review extracted details");
    }, 600);
  }

  function applyExtracted() {
    if (!property || !extracted) return;
    const next = applyDelta(property, extracted, {
      bedrooms: true,
      bathrooms: true,
      carSpaces: true,
      landM2: true,
      features: true,
    });
    putCached(next);
    setProperty(next);
    setExtracted(null);
    setStatus("Applied document updates");
  }

  const toggleCount = Object.values(toggles).filter(Boolean).length;

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "var(--shell)",
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="app-shell"
        style={{
          width: "min(1160px, 100%)",
          height: "min(720px, 100%)",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "var(--shadow-card)",
          display: "flex",
          minHeight: 0,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Sidebar
          items={HISTORY}
          activeId={activeId}
          onSelect={handleHistory}
          onNew={handleNew}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: "#fff",
          }}
        >
          <CommandBar
            query={query}
            onQuery={setQuery}
            results={results}
            onPick={pick}
            status={status}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: "300px 1fr",
            }}
          >
            <div
              className="scroll"
              style={{
                borderRight: "1px solid var(--border)",
                padding: "18px 20px 20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <SnapshotPanel
                property={property}
                distanceKm={distanceKm}
                extracted={extracted}
                onApply={applyExtracted}
                onDismiss={() => setExtracted(null)}
              />

              <div>
                <div
                  className="row"
                  style={{ justifyContent: "space-between", marginBottom: 8 }}
                >
                  <span className="eyebrow">Include</span>
                  <span style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>
                    {toggleCount} of 7
                  </span>
                </div>
                <TogglesRow toggles={toggles} onToggle={toggle} />
              </div>

              <div>
                <span className="eyebrow">Attachments</span>
                <label
                  className="row"
                  style={{
                    marginTop: 8,
                    gap: 6,
                    padding: "7px 0",
                    fontSize: 12,
                    color: "var(--fg-subtle)",
                    cursor: property ? "pointer" : "not-allowed",
                  }}
                >
                  <IconPlus /> Add document
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    style={{ display: "none" }}
                    disabled={!property}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleUpload();
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <p
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: "var(--fg-subtle)",
                    lineHeight: 1.5,
                  }}
                >
                  PDF, PNG, or JPG. Details are confirmed before applying.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "18px 28px 20px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <ResponsePanel
                text={text}
                isStreaming={isStreaming}
                template={template}
                onTemplate={(t) => {
                  setTemplate(t);
                  setCopied(false);
                }}
                onCopy={copy}
                copied={copied}
                onGenerate={generate}
                canGenerate={!!property && !isStreaming}
              />
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        apiKey={apiKey}
        model={model}
        onClose={() => setSettingsOpen(false)}
        onSave={(key, m) => {
          setApiKey(key);
          setModel(m);
          setApiKeyState(key);
          setModelState(m);
          setSettingsOpen(false);
          setStatus(key ? "Claude API key saved" : "Using local fallback");
        }}
      />
    </main>
  );
}
