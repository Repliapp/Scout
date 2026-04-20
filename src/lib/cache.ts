import type { Property } from "../types";

const KEY = "scout.propertyCache.v1";

type CacheEntry = { property: Property; lastUpdated: number };
type CacheMap = Record<string, CacheEntry>;

function read(): CacheMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CacheMap) : {};
  } catch {
    return {};
  }
}

function write(map: CacheMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage full or disabled — ignore */
  }
}

function keyFor(address: string) {
  return address.trim().toLowerCase();
}

export function getCached(address: string): Property | null {
  const entry = read()[keyFor(address)];
  return entry ? entry.property : null;
}

export function putCached(property: Property) {
  const map = read();
  map[keyFor(property.address)] = {
    property: { ...property, source: "cache" },
    lastUpdated: Date.now(),
  };
  write(map);
}
