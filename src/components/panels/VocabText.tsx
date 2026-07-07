import { createElement, useMemo, useState, type ElementType } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { scanText } from "@/lib/vocab/scan";
import { VOCAB } from "@/data";
import { useUniverse } from "@/lib/store";

/**
 * Render `text` as paragraphs with inline vocab-term buttons.
 * Klik term → popover kecil (definisi + tombol buka kamus).
 */
export function VocabText({
  text,
  style,
  as = "p",
}: {
  text: string;
  style?: React.CSSProperties;
  as?: ElementType;
}) {
  const segments = useMemo(() => scanText(text), [text]);
  const select = useUniverse((s) => s.select);
  const children = segments.map((s, i) => {
    if (!s.vocab) return <span key={i}>{s.text}</span>;
    const v = VOCAB[s.vocab.idx];
    return <TermPopover key={i} label={s.text} def={v?.def || ""} onOpen={() => select(`vocab:${s.vocab!.idx}`)} />;
  });
  return createElement(as, { lang: "id", style }, children);
}

function TermPopover({ label, def, onOpen }: { label: string; def: string; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: "inline",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            color: "inherit",
            font: "inherit",
            cursor: "help",
            textDecoration: "underline",
            textDecorationStyle: "dotted",
            textDecorationColor: "#38bdf8aa",
            textUnderlineOffset: 2,
          }}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={6}
        style={{
          maxWidth: 280,
          padding: "10px 12px",
          background: "rgba(10,14,24,0.98)",
          border: "1px solid #38bdf866",
          color: "#e5e7eb",
          fontFamily: "DM Sans",
          fontSize: 12,
          lineHeight: 1.55,
          borderRadius: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.2em", color: "#38bdf8", marginBottom: 4, textTransform: "uppercase" }}>Kamus</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#9ca3af", marginBottom: 8 }}>{def || "—"}</div>
        <button
          onClick={() => { onOpen(); setOpen(false); }}
          style={{
            width: "100%", padding: "6px 10px",
            background: "#38bdf822", border: "1px solid #38bdf888",
            color: "#38bdf8", fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.15em",
            cursor: "pointer", borderRadius: 4,
          }}
        >BUKA DI KAMUS →</button>
      </PopoverContent>
    </Popover>
  );
}
