import { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGraph } from "@/lib/graph/build";
import { useUniverse } from "@/lib/store";

const RANK = (k: string) =>
  k === "root" ? 0 : k === "cluster" ? 1 : k === "subhub" ? 2 :
  k === "domain" || k === "letter" ? 3 :
  k === "bab" || k === "school" || k === "bracket" ? 4 :
  k === "subbab" || k === "team" ? 5 : 6;

/**
 * Kontrol navigasi melayang: UNDO (riwayat mundur), NEXT (node berikutnya
 * secara berurutan: saudara → anak pertama), REDO, dan PUSAT.
 */
export function NavControls() {
  const selectedId = useUniverse((s) => s.selectedId);
  const history = useUniverse((s) => s.history);
  const histIndex = useUniverse((s) => s.histIndex);
  const goBack = useUniverse((s) => s.goBack);
  const goForward = useUniverse((s) => s.goForward);
  const jumpTo = useUniverse((s) => s.jumpTo);
  const select = useUniverse((s) => s.select);
  const graph = useMemo(() => buildGraph(), []);

  const node = selectedId ? graph.byId.get(selectedId) : null;

  // Node berikutnya: saudara sesudahnya, kalau habis → anak pertama.
  const nextId = useMemo(() => {
    if (!node) return graph.nodes.find((n) => n.kind === "cluster")?.id ?? null;
    const ns = graph.neighbors.get(node.id);
    if (!ns) return null;
    let parent: string | null = null;
    const children: string[] = [];
    for (const id of ns) {
      const other = graph.byId.get(id);
      if (!other) continue;
      if (RANK(other.kind) < RANK(node.kind)) { if (!parent) parent = id; }
      else if (RANK(other.kind) > RANK(node.kind)) children.push(id);
    }
    if (parent) {
      const siblings: string[] = [];
      const pn = graph.neighbors.get(parent);
      if (pn) for (const id of pn) {
        const c = graph.byId.get(id);
        if (c && RANK(c.kind) > RANK(graph.byId.get(parent)!.kind)) siblings.push(id);
      }
      const i = siblings.indexOf(node.id);
      if (i >= 0 && i + 1 < siblings.length) return siblings[i + 1];
    }
    if (children.length) return children[0];
    return parent;
  }, [node, graph]);

  const canBack = histIndex >= 0;
  const canFwd = histIndex >= 0 && histIndex < history.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goForward(); }
      if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key === "n" && nextId) { e.preventDefault(); jumpTo(nextId); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goForward, jumpTo, nextId]);

  const accent = node?.color ?? "#7dd3fc";

  const btn = (label: string, glyph: string, on: boolean, onClick: () => void, key: string) => (
    <button
      key={key}
      onClick={onClick}
      disabled={!on}
      title={label}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${on ? accent + "55" : "rgba(148,163,184,0.14)"}`,
        background: on
          ? `linear-gradient(180deg, ${accent}1f, rgba(3,6,14,0.85))`
          : "rgba(3,6,14,0.6)",
        color: on ? "#e8f4ff" : "rgba(148,163,184,0.4)",
        fontFamily: "var(--font-mono, 'Space Mono', monospace)",
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: on ? "pointer" : "not-allowed",
        boxShadow: on ? `0 0 22px -8px ${accent}` : "none",
        transition: "transform 160ms, box-shadow 200ms, border-color 200ms",
      }}
      onMouseEnter={(e) => { if (on) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{glyph}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 26,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 7,
        borderRadius: 999,
        background: "linear-gradient(180deg, rgba(9,14,26,0.82), rgba(2,4,10,0.9))",
        border: "1px solid rgba(148,163,184,0.16)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 60px -24px rgba(0,0,0,0.9)",
      }}
    >
      {btn("Undo", "↩", canBack, goBack, "b")}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={node?.id ?? "none"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            minWidth: 150, maxWidth: 260, textAlign: "center",
            padding: "6px 14px",
            fontFamily: "var(--font-mono, 'Space Mono', monospace)",
            fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
            color: node ? accent : "rgba(148,163,184,0.5)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            textShadow: node ? `0 0 18px ${accent}66` : "none",
          }}
        >
          {node ? node.label : "— tidak ada node —"}
        </motion.div>
      </AnimatePresence>
      {btn("Next", "↪", !!nextId, () => nextId && jumpTo(nextId), "n")}
      {btn("Redo", "⟳", canFwd, goForward, "f")}
      {btn("Pusat", "⌂", !!selectedId, () => select(null), "h")}
    </div>
  );
}
