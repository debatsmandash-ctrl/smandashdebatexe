import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { buildGraph } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS } from "@/data";
import { useUniverse, useSettings } from "@/lib/store";
import logo from "@/assets/smandash-logo.png";

/**
 * Corporate Lobby — modern minimal dark theme.
 * Restrained monochrome + electric-blue accent, generous spacing, no HUD noise.
 */
export function MissionControl({ onInitiate }: { onInitiate: () => void }) {
  const graph = useMemo(() => buildGraph(), []);
  const setSettingsOpen = useUniverse((s) => s.setSettingsOpen);
  const update = useSettings((s) => s.update);
  const [mounted, setMounted] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 30);
    return () => window.clearTimeout(id);
  }, []);

  const stats = useMemo(() => ({
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    domains: Object.keys(MATTER).length,
    motions: MOTIONS.length,
    vocab: VOCAB.length,
    events: EVENTS.length,
    schools: COMPETITORS.length + ACTIVE_MEMBERS.length,
  }), [graph]);

  const enter = () => {
    setDismissing(true);
    window.setTimeout(() => {
      update({ lobbySeen: true });
      onInitiate();
    }, 420);
  };

  const ACCENT = "#3B82F6";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, overflow: "auto",
        background: "linear-gradient(180deg, #0A0E1A 0%, #0D1220 100%)",
        color: "#E5E7EB",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: dismissing ? 0 : mounted ? 1 : 0,
        transform: dismissing ? "scale(0.98)" : "scale(1)",
        transition: "opacity 420ms ease-out, transform 420ms ease-out",
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      {/* subtle grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
      }} />
      {/* soft accent glow */}
      <div aria-hidden style={{
        position: "absolute", top: "-15%", right: "-10%", width: 600, height: 600,
        background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 65%)`,
        pointerEvents: "none", filter: "blur(20px)",
      }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "clamp(24px, 4vw, 56px) clamp(20px, 4vw, 40px)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top nav */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Debate Coach Toolkit</div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link to="/information" style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 13 }}>Information</Link>
            <button
              onClick={() => setSettingsOpen(true)}
              style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            >Settings</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 999,
              background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`,
              fontSize: 11, fontWeight: 500, color: ACCENT, marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
              v1.1 · System nominal
            </div>
            <h1 style={{
              margin: 0, fontSize: "clamp(36px, 5.5vw, 68px)", lineHeight: 1.05, letterSpacing: "-0.03em",
              fontWeight: 700, color: "#F9FAFB",
            }}>
              A knowledge<br/>graph for<br/>
              <span style={{ color: ACCENT }}>every debate</span>.
            </h1>
            <p style={{
              marginTop: 24, maxWidth: 520, fontSize: 16, lineHeight: 1.65, color: "#9CA3AF",
            }}>
              Explore {stats.motions.toLocaleString()}+ motions, {stats.vocab.toLocaleString()} terms,
              and {stats.domains} matter domains in a single interactive 3D universe.
              Built for SMANDASH Debate Club × Rojaaks.
            </p>
            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={enter}
                style={{
                  padding: "14px 28px", background: ACCENT, color: "#fff",
                  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  boxShadow: `0 8px 24px ${ACCENT}40`, fontFamily: "inherit",
                  transition: "transform 160ms, box-shadow 160ms",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${ACCENT}55`; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 24px ${ACCENT}40`; }}
              >
                Enter Universe →
              </button>
              <Link
                to="/information"
                style={{
                  padding: "14px 28px", background: "transparent",
                  color: "#E5E7EB", border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 10, fontSize: 15, fontWeight: 500,
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                }}
              >View Information</Link>
            </div>
          </div>

          {/* KPI card cluster */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Kpi label="Nodes" value={stats.nodes} />
            <Kpi label="Edges" value={stats.edges} />
            <Kpi label="Motions" value={stats.motions} accent={ACCENT} />
            <Kpi label="Vocabulary" value={stats.vocab} />
            <Kpi label="Domains" value={stats.domains} />
            <Kpi label="Events" value={stats.events} />
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#6B7280" }}>© 2026 SMANDASH Debate Club × Rojaaks</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Press <kbd style={{ padding: "2px 6px", background: "rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 11 }}>Enter</kbd> to launch</div>
        </footer>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 12,
      background: accent ? `linear-gradient(135deg, ${accent}22, ${accent}08)` : "rgba(255,255,255,0.03)",
      border: `1px solid ${accent ? accent + "40" : "rgba(255,255,255,0.06)"}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: accent || "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: "#F9FAFB" }}>{value.toLocaleString()}</div>
    </div>
  );
}
