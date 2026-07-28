const KEY = "qrcode-tools.history";
const MAX = 50;

export type HistoryKind = "gen" | "dec";

export interface HistoryItem {
  id: string;
  kind: HistoryKind;
  text: string;
  /** ISO timestamp string (stored, not generated at load). */
  ts: string;
}

interface StoredShape {
  items: HistoryItem[];
}

function read(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredShape;
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items } satisfies StoredShape));
  } catch {
    /* ignore quota errors */
  }
}

/** Prepend a new item, cap at MAX, dedupe by (kind+text) keeping newest. */
export function addHistory(kind: HistoryKind, text: string): HistoryItem[] {
  const trimmed = text.trim();
  if (!trimmed) return read();
  const item: HistoryItem = {
    id: `${kind}-${Date.now()}-${trimmed.length}`,
    kind,
    text: trimmed,
    ts: new Date().toISOString(),
  };
  const filtered = read().filter(
    (it) => !(it.kind === kind && it.text === trimmed),
  );
  const next = [item, ...filtered].slice(0, MAX);
  write(next);
  return next;
}

export function loadHistory(): HistoryItem[] {
  return read();
}

export function clearHistory(): void {
  write([]);
}

/** Export items to a CSV string (escaped). */
export function historyToCsv(items: HistoryItem[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = "kind,text,timestamp";
  const rows = items.map((it) =>
    [it.kind, esc(it.text), it.ts].join(","),
  );
  return [header, ...rows].join("\r\n");
}

/** Export items to a JSON string. */
export function historyToJson(items: HistoryItem[]): string {
  return JSON.stringify(items, null, 2);
}
