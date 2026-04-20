// Thin Claude API client for the in-browser Scout app.
// Keeps the API key local (stored via settings.ts). Uses streaming to feed the
// live-response caret animation described in the design.

const KEY_STORAGE = "scout.claudeApiKey.v1";
const MODEL_STORAGE = "scout.claudeModel.v1";
export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}
export function setApiKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}
export function getModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}
export function setModel(model: string) {
  try {
    localStorage.setItem(MODEL_STORAGE, model || DEFAULT_MODEL);
  } catch {
    /* ignore */
  }
}

export interface StreamOptions {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}

// Streams a completion via the Anthropic Messages API using SSE.
export async function streamMessage({
  apiKey,
  model = DEFAULT_MODEL,
  system,
  user,
  signal,
  onDelta,
}: StreamOptions): Promise<void> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: true,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${errText || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank lines.
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const dataLine = raw
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const data = dataLine.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const event = JSON.parse(data);
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "text_delta" &&
          typeof event.delta.text === "string"
        ) {
          onDelta(event.delta.text);
        }
      } catch {
        /* ignore malformed events */
      }
    }
  }
}
