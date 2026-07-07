/**
 * Scan text for vocab terms and return segments with match refs.
 * Longest-match-first to avoid nested overlaps.
 */
import { VOCAB } from "@/data";

export interface VocabIndexEntry {
  term: string;      // display term
  idx: number;       // index into VOCAB
  keys: string[];    // lowercased match keys (term + en)
}

let INDEX: VocabIndexEntry[] | null = null;
let KEY_MAP: Map<string, VocabIndexEntry> | null = null;

function buildIndex() {
  if (INDEX) return;
  const list: VocabIndexEntry[] = [];
  VOCAB.forEach((v, idx) => {
    const keys = [v.term, (v as any).en].filter(Boolean).map((s: string) => s.toLowerCase().trim()).filter((s) => s.length >= 3);
    if (!keys.length) return;
    list.push({ term: v.term, idx, keys });
  });
  // longest keys first
  list.sort((a, b) => Math.max(...b.keys.map((k) => k.length)) - Math.max(...a.keys.map((k) => k.length)));
  INDEX = list;
  KEY_MAP = new Map();
  for (const e of list) for (const k of e.keys) if (!KEY_MAP.has(k)) KEY_MAP.set(k, e);
}

export type Segment = { text: string; vocab?: VocabIndexEntry };

/** Return segments (text + optional vocab match). Skip trivial words. */
export function scanText(input: string, maxMatches = 8): Segment[] {
  if (!input) return [{ text: "" }];
  buildIndex();
  if (!KEY_MAP) return [{ text: input }];

  // Build a regex from all keys with word boundaries. Escape.
  const keys = Array.from(KEY_MAP.keys())
    .sort((a, b) => b.length - a.length)
    .slice(0, 600); // limit
  if (!keys.length) return [{ text: input }];
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const rx = new RegExp(`\\b(${escaped})\\b`, "gi");

  const segs: Segment[] = [];
  let last = 0;
  let count = 0;
  let m: RegExpExecArray | null;
  const seen = new Set<number>();
  while ((m = rx.exec(input)) && count < maxMatches) {
    const key = m[1].toLowerCase();
    const entry = KEY_MAP.get(key);
    if (!entry || seen.has(entry.idx)) continue;
    seen.add(entry.idx);
    if (m.index > last) segs.push({ text: input.slice(last, m.index) });
    segs.push({ text: input.slice(m.index, m.index + m[1].length), vocab: entry });
    last = m.index + m[1].length;
    count++;
  }
  if (last < input.length) segs.push({ text: input.slice(last) });
  return segs.length ? segs : [{ text: input }];
}
