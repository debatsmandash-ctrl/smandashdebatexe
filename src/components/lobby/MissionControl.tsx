import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraph, CLUSTER_META } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS } from "@/data";
import { useUniverse, useSettings } from "@/lib/store";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import logo from "@/assets/smandash-logo.png";

/**
 * NASA Mission Control Lobby.
 * Full-screen dark tech dashboard. User klik INITIATE → dismiss ke Universe.
 * Muncul di boot pertama (settings.lobbySeen=false). Bisa direset via Settings.
 */
export function MissionControl({ onInitiate }: { onInitiate: () => void }) {
  const graph = useMemo(() => buildGraph(), []);
  const focusCluster = useUniverse((s) => s.focusCluster);
  const select = useUniverse((s) => s.select);
  const setSettingsOpen = useUniverse((s) => s.setSettingsOpen);
  const update = useSettings((s) => s.update);

  const [clock, setClock] = useState(() => new Date());
  const [t0] = useState(() => Date.now());
  const [uptime, setUptime] = useState("00:00");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const t0Ref = useRef(t0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date();
      setClock(now);
      const s = Math.floor((Date.now() - t0Ref.current) / 1000);
      const m = Math.floor(s / 60), r = s % 60;
      setUptime(`${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // ─── Stats ───
  const stats = useMemo(() => {
    const nodes = graph.nodes.length;
    const edges = graph.edges.length;
    const domains = Object.keys(MATTER).length;
    const motions = MOTIONS.length;
    const vocab = VOCAB.length;
    const events = EVENTS.length;
    const schools = COMPETITORS.length + ACTIVE_MEMBERS.length;
    return { nodes, edges, domains, motions, vocab, events, schools };
  }, [graph]);

  // ─── Chart data: distribution per cluster ───
  const clusterData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    for (const c of CLUSTER_META) map[c.key] = { name: c.label, value: 0, color: c.color };
    for (const n of graph.nodes) {
      const k = n.cluster as string;
      if (map[k]) map[k].value++;
    }
    return Object.values(map).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [graph]);

  // Motions per category
  const motionCatData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of MOTIONS) map[m.cat] = (map[m.cat] || 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, []);

  const bootPct = Math.min(100, Math.round((Date.now() - t0Ref.current) / 20));

  const handleInitiate = () => {
    if (countdown !== null) return;
    // 3-2-1 countdown ignition
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n--;
      if (n <= 0) {
        window.clearInterval(id);
        setDismissing(true);
        window.setTimeout(() => {
          update({ lobbySeen: true });
          onInitiate();
        }, 750);
        return;
      }
      setCountdown(n);
    }, 800);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, overflow: "auto",
        background: `
          radial-gradient(ellipse at 20% 15%, rgba(0,255,200,0.06), transparent 55%),
          radial-gradient(ellipse at 80% 85%, rgba(168,85,247,0.08), transparent 55%),
          radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.03), transparent 70%),
          linear-gradient(180deg, #02050c 0%, #05080f 50%, #02040a 100%)
        `,
        color: "#e8f4ff",
        fontFamily: "Space Mono, monospace",
        opacity: dismissing ? 0 : 1,
        transition: "opacity 750ms ease-out",
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      {/* grid overlay */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
      }} />
      {/* scanlines */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,200,0.03) 0 1px, transparent 1px 3px)",
        opacity: 0.4, mixBlendMode: "screen",
      }} />

      <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "clamp(16px, 3vw, 32px)" }}>
        {/* HEADER */}
        <header style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center", gap: 16,
          padding: "16px 20px",
          border: "1px solid rgba(0,255,200,0.28)",
          background: "linear-gradient(90deg, rgba(0,255,200,0.06), rgba(56,189,248,0.02))",
          boxShadow: "inset 0 0 30px rgba(0,255,200,0.06)",
          borderRadius: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <img src={logo} alt="" style={{ width: 44, height: 44, borderRadius: 999, filter: "drop-shadow(0 0 8px #ff5cf0) drop-shadow(0 0 14px #a855f7)" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: "0.28em", color: "#e8f4ff", lineHeight: 1 }}>MISSION CONTROL</div>
              <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "#00ffc8", marginTop: 4 }}>DEBATE COACH TOOLKIT · v1.0 · SMANDASH × ROJAAKS</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(0,255,200,0.08)", border: "1px solid rgba(0,255,200,0.4)", borderRadius: 999 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#00ffc8", boxShadow: "0 0 8px #00ffc8", animation: "neon-pulse 1.6s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "#00ffc8" }}>STATUS · NOMINAL</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: "0.2em", color: "#e8f4ff" }}>{clock.toISOString().slice(11, 19)} UTC</div>
            <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "#8ba3c0", marginTop: 3 }}>SESSION UPTIME · {uptime}</div>
          </div>
        </header>

        {/* BENTO GRID */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 14,
          marginTop: 18,
        }}>
          {/* HERO TELEMETRY (large) */}
          <Panel colSpan={8} accent="#a855f7" title="TELEMETRY · UNIVERSE OVERVIEW">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Metric label="NODES" value={stats.nodes} color="#00ffc8" />
              <Metric label="EDGES" value={stats.edges} color="#38bdf8" />
              <Metric label="DOMAINS" value={stats.domains} color="#a855f7" />
              <Metric label="MOTIONS" value={stats.motions} color="#ff8b3d" />
              <Metric label="VOCAB" value={stats.vocab} color="#7dd3fc" />
              <Metric label="EVENTS" value={stats.events} color="#fde047" />
              <Metric label="SCHOOLS" value={stats.schools} color="#fb7185" />
              <Metric label="CLUSTERS" value={CLUSTER_META.length} color="#c084fc" />
            </div>
            <div style={{ marginTop: 14, height: 6, background: "rgba(168,85,247,0.15)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${bootPct}%`, background: "linear-gradient(90deg, #00ffc8, #38bdf8, #a855f7)", boxShadow: "0 0 12px #00ffc8", transition: "width 300ms" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 9, letterSpacing: "0.3em", color: "#5a6f8a" }}>SYSTEM PRE-FLIGHT · {bootPct}% ONLINE</div>
          </Panel>

          {/* IGNITION CONTROL */}
          <Panel colSpan={4} accent="#00ffc8" title="IGNITION CONTROL">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch", minHeight: 190 }}>
              {countdown !== null ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 96, letterSpacing: "0.06em", color: "#00ffc8", textShadow: "0 0 30px #00ffc8, 0 0 60px #00ffc8" }}>{countdown === 0 ? "GO" : `T-${countdown}`}</div>
                  <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#8ba3c0", marginTop: 6 }}>IGNITION SEQUENCE</div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleInitiate}
                    style={{
                      padding: "18px 20px",
                      background: "linear-gradient(135deg, rgba(0,255,200,0.18), rgba(56,189,248,0.1))",
                      border: "2px solid #00ffc8",
                      color: "#e8f4ff",
                      fontFamily: "Bebas Neue",
                      fontSize: 28, letterSpacing: "0.3em",
                      cursor: "pointer",
                      borderRadius: 4,
                      boxShadow: "inset 0 0 30px rgba(0,255,200,0.15), 0 0 30px rgba(0,255,200,0.25)",
                      transition: "transform 150ms, box-shadow 150ms",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "inset 0 0 40px rgba(0,255,200,0.25), 0 0 50px rgba(0,255,200,0.4)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "inset 0 0 30px rgba(0,255,200,0.15), 0 0 30px rgba(0,255,200,0.25)"; }}
                  >
                    ▶ INITIATE
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      style={{ padding: "10px", background: "transparent", border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", cursor: "pointer", borderRadius: 3, fontSize: 10, letterSpacing: "0.25em" }}
                    >⚙ SETTINGS</button>
                    <button
                      onClick={() => { update({ lobbySeen: true }); onInitiate(); }}
                      style={{ padding: "10px", background: "transparent", border: "1px solid rgba(168,85,247,0.25)", color: "#8ba3c0", cursor: "pointer", borderRadius: 3, fontSize: 10, letterSpacing: "0.25em" }}
                    >⏭ SKIP</button>
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#5a6f8a", lineHeight: 1.6, marginTop: 4 }}>
                    Klik INITIATE untuk masuk ke 3D star universe. Lobby ini dapat dipanggil kembali di Settings › A11Y.
                  </div>
                </>
              )}
            </div>
          </Panel>

          {/* DISTRIBUTION CHART */}
          <Panel colSpan={5} accent="#38bdf8" title="DISTRIBUTION PER CLUSTER">
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={clusterData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={2}>
                    {clusterData.map((d, i) => <Cell key={i} fill={d.color} stroke="#0a0e18" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(5,8,15,0.95)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11 }}
                    labelStyle={{ color: "#e8f4ff" }}
                    itemStyle={{ color: "#00ffc8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 8 }}>
              {clusterData.slice(0, 9).map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, letterSpacing: "0.1em", color: "#8ba3c0" }}>
                  <span style={{ width: 8, height: 8, background: d.color, borderRadius: 2, boxShadow: `0 0 6px ${d.color}` }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  <span style={{ marginLeft: "auto", color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* MOTION CATEGORY BAR CHART */}
          <Panel colSpan={7} accent="#ff8b3d" title="MOTION BANK · TOP 10 CATEGORY">
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={motionCatData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" stroke="#5a6f8a" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#8ba3c0" fontSize={10} width={110} />
                  <Tooltip
                    contentStyle={{ background: "rgba(5,8,15,0.95)", border: "1px solid rgba(255,139,61,0.4)", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11 }}
                    cursor={{ fill: "rgba(255,139,61,0.08)" }}
                  />
                  <Bar dataKey="value" fill="url(#gradMotion)" radius={[0, 4, 4, 0]} />
                  <defs>
                    <linearGradient id="gradMotion" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ff8b3d" />
                      <stop offset="100%" stopColor="#fde047" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* MISSION CARDS (per cluster) */}
          <Panel colSpan={12} accent="#c084fc" title="MISSION DECKS · CLICK TO ENTER">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}>
              {CLUSTER_META.map((c) => {
                const count = clusterData.find((d) => d.name === c.label)?.value || 0;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      update({ lobbySeen: true });
                      focusCluster(c.key);
                      select(`cluster:${c.key}`);
                      onInitiate();
                    }}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
                      border: `1px solid ${c.color}55`,
                      borderLeft: `3px solid ${c.color}`,
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "#e8f4ff",
                      transition: "all 180ms",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${c.color}20, transparent)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, letterSpacing: "0.28em", color: c.color }}>{c.label}</span>
                      <span style={{ fontFamily: "Bebas Neue", fontSize: 20, color: c.color, textShadow: `0 0 8px ${c.color}` }}>{count}</span>
                    </div>
                    <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#8ba3c0", marginTop: 4, letterSpacing: "0.05em" }}>
                      Klik untuk fokus ke gugusan {c.label.toLowerCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* FOOTER */}
        <footer style={{ marginTop: 22, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
          border: "1px solid rgba(168,85,247,0.2)", borderRadius: 4,
          background: "rgba(5,8,15,0.6)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#5a6f8a" }}>
            © SMANDASH DEBATE CLUB × ROJAAKS · MISSION CONTROL v1.0 · TANSTACK / R3F
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#8ba3c0" }}>
            READY FOR IGNITION ▸
          </div>
        </footer>
      </div>
    </div>
  );
}

function Panel({ colSpan, title, accent, children }: { colSpan: number; title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{
      gridColumn: `span ${colSpan} / span ${colSpan}`,
      padding: "14px 16px",
      background: "linear-gradient(180deg, rgba(11,18,32,0.85), rgba(5,8,15,0.7))",
      border: `1px solid ${accent}44`,
      borderRadius: 4,
      backdropFilter: "blur(6px)",
      boxShadow: `inset 0 0 30px ${accent}0c`,
      position: "relative",
    }}>
      {/* corner brackets */}
      <span aria-hidden style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <span aria-hidden style={{ position: "absolute", top: -1, right: -1, width: 12, height: 12, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
      <span aria-hidden style={{ position: "absolute", bottom: -1, left: -1, width: 12, height: 12, borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <span aria-hidden style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 6, height: 6, background: accent, borderRadius: 999, boxShadow: `0 0 8px ${accent}` }} />
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: accent }}>{title}</div>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: `linear-gradient(180deg, ${color}12, transparent)`,
      border: `1px solid ${color}33`,
      borderRadius: 3,
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", color }}>{label}</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 28, letterSpacing: "0.02em", color: "#e8f4ff", marginTop: 2, textShadow: `0 0 10px ${color}66` }}>{value.toLocaleString()}</div>
    </div>
  );
}
