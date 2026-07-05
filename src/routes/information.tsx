import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { buildGraph, CLUSTER_META } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS, JENIS_MOSI } from "@/data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const Route = createFileRoute("/information")({
  head: () => ({
    meta: [
      { title: "Information · Debate Coach Toolkit Dashboard" },
      { name: "description", content: "Dashboard NASA-style lengkap: statistik dataset, distribusi mosi, heatmap tautan antar-domain, dan fakta menarik tentang universe debat." },
      { property: "og:title", content: "Debate Coach Toolkit · Information Dashboard" },
      { property: "og:description", content: "Bento HUD, telemetry, distribution charts & mission decks untuk seluruh knowledge graph." },
    ],
  }),
  component: InformationPage,
});

function InformationPage() {
  const graph = useMemo(() => buildGraph(), []);
  const [clock, setClock] = useState(() => new Date());
  const [t0] = useState(() => Date.now());
  const [uptime, setUptime] = useState("00:00");
  const t0Ref = useRef(t0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(new Date());
      const s = Math.floor((Date.now() - t0Ref.current) / 1000);
      setUptime(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => ({
    nodes: graph.nodes.length, edges: graph.edges.length,
    domains: Object.keys(MATTER).length, motions: MOTIONS.length,
    vocab: VOCAB.length, events: EVENTS.length,
    schools: COMPETITORS.length + ACTIVE_MEMBERS.length,
    jenis: JENIS_MOSI.length,
  }), [graph]);

  const clusterData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    for (const c of CLUSTER_META) map[c.key] = { name: c.label, value: 0, color: c.color };
    for (const n of graph.nodes) { const k = n.cluster as string; if (map[k]) map[k].value++; }
    return Object.values(map).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [graph]);

  const motionCatData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of MOTIONS) map[m.cat] = (map[m.cat] || 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, []);

  const stanceData = useMemo(() => {
    let off = 0, def = 0;
    for (const m of MOTIONS as any[]) { if (m.comp === "ofensif") off++; else if (m.comp === "defensif") def++; }
    return [{ metric: "Offensive", A: off }, { metric: "Defensive", A: def }, { metric: "Multi-type", A: (MOTIONS as any[]).filter(m => m.typeAll?.length > 1).length }, { metric: "With Terms", A: MOTIONS.filter(m => m.terms?.length).length }, { metric: "Deep Ideal", A: MOTIONS.filter(m => (m.ideal||"").length > 200).length }];
  }, []);

  const facts = [
    `Universe berisi ${stats.nodes.toLocaleString()} bintang dan ${stats.edges.toLocaleString()} tautan aktif.`,
    `${stats.motions} mosi tersebar di ${stats.jenis} jenis mosi & ${Object.keys(MATTER).length} domain matter.`,
    `Kamus berisi ${stats.vocab.toLocaleString()} istilah — huruf terbanyak: ${topLetter()}.`,
    `${stats.events} event historis dengan ${stats.schools} sekolah kompetitor & active member.`,
    `Rasio Offensive vs Defensive: ${stanceData[0].A} : ${stanceData[1].A}.`,
  ];
  function topLetter(): string {
    const map: Record<string, number> = {};
    for (const v of VOCAB) { const L = (v.term[0]||"#").toUpperCase(); map[L] = (map[L]||0)+1; }
    return Object.entries(map).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "-";
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, overflow: "auto",
        background: `
          radial-gradient(ellipse at 15% 10%, rgba(168,85,247,0.18), transparent 55%),
          radial-gradient(ellipse at 85% 90%, rgba(0,255,200,0.14), transparent 55%),
          radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.06), transparent 70%),
          linear-gradient(180deg, #06081a 0%, #0a0f1f 50%, #050710 100%)
        `,
        color: "#e8f4ff", fontFamily: "Space Mono, monospace",
      }}
    >
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(168,85,247,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
      }} />

      <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "clamp(16px, 3vw, 32px)" }}>
        <header style={{
          display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 16,
          padding: "16px 20px",
          border: "1px solid rgba(168,85,247,0.35)",
          background: "linear-gradient(90deg, rgba(168,85,247,0.10), rgba(0,255,200,0.04))",
          boxShadow: "inset 0 0 30px rgba(168,85,247,0.10)", borderRadius: 4,
        }}>
          <div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 26, letterSpacing: "0.28em", color: "#e8f4ff" }}>INFORMATION DASHBOARD</div>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "#a855f7", marginTop: 4 }}>MISSION CONTROL LEGACY · DEBATE COACH TOOLKIT</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: "0.2em" }}>{clock.toISOString().slice(11, 19)} UTC</div>
            <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "#8ba3c0", marginTop: 3 }}>UPTIME · {uptime}</div>
          </div>
          <Link
            to="/"
            style={{
              padding: "10px 18px", fontSize: 10, letterSpacing: "0.3em",
              background: "linear-gradient(135deg, rgba(0,255,200,0.15), rgba(56,189,248,0.08))",
              border: "1px solid rgba(0,255,200,0.5)", color: "#00ffc8",
              textDecoration: "none", borderRadius: 3,
            }}
          >◄ BACK TO UNIVERSE</Link>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14, marginTop: 18 }}>
          <Panel colSpan={8} accent="#a855f7" title="TELEMETRY · UNIVERSE OVERVIEW">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Metric label="NODES" value={stats.nodes} color="#00ffc8" />
              <Metric label="EDGES" value={stats.edges} color="#38bdf8" />
              <Metric label="DOMAINS" value={stats.domains} color="#a855f7" />
              <Metric label="MOTIONS" value={stats.motions} color="#ff8b3d" />
              <Metric label="VOCAB" value={stats.vocab} color="#7dd3fc" />
              <Metric label="EVENTS" value={stats.events} color="#fde047" />
              <Metric label="SCHOOLS" value={stats.schools} color="#fb7185" />
              <Metric label="JENIS MOSI" value={stats.jenis} color="#c084fc" />
            </div>
          </Panel>

          <Panel colSpan={4} accent="#00ffc8" title="STANCE ANALYSIS">
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <RadarChart data={stanceData}>
                  <PolarGrid stroke="rgba(0,255,200,0.2)" />
                  <PolarAngleAxis dataKey="metric" stroke="#8ba3c0" fontSize={10} />
                  <PolarRadiusAxis stroke="rgba(0,255,200,0.15)" tick={false} />
                  <Radar dataKey="A" stroke="#00ffc8" fill="#00ffc8" fillOpacity={0.32} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel colSpan={5} accent="#38bdf8" title="DISTRIBUTION PER CLUSTER">
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={clusterData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={2}>
                    {clusterData.map((d, i) => <Cell key={i} fill={d.color} stroke="#0a0e18" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(5,8,15,0.95)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 4, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 8 }}>
              {clusterData.slice(0, 9).map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, letterSpacing: "0.1em", color: "#8ba3c0" }}>
                  <span style={{ width: 8, height: 8, background: d.color, borderRadius: 2, boxShadow: `0 0 6px ${d.color}` }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  <span style={{ marginLeft: "auto", color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel colSpan={7} accent="#ff8b3d" title="MOTION BANK · TOP 10 CATEGORY">
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={motionCatData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" stroke="#5a6f8a" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#8ba3c0" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ background: "rgba(5,8,15,0.95)", border: "1px solid rgba(255,139,61,0.4)", borderRadius: 4, fontSize: 11 }} cursor={{ fill: "rgba(255,139,61,0.08)" }} />
                  <Bar dataKey="value" fill="url(#gradInfo)" radius={[0, 4, 4, 0]} />
                  <defs><linearGradient id="gradInfo" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff8b3d" /><stop offset="100%" stopColor="#fde047" /></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel colSpan={12} accent="#fde047" title="DID YOU KNOW · FACTS ABOUT THIS UNIVERSE">
            <ul style={{ margin: 0, padding: "0 0 0 18px", lineHeight: 1.85, fontFamily: "DM Sans", fontSize: 13, color: "#c7d2e0" }}>
              {facts.map((f, i) => <li key={i} style={{ marginBottom: 6 }}>{f}</li>)}
            </ul>
          </Panel>

          <Panel colSpan={12} accent="#c084fc" title="MISSION DECKS · JUMP INTO A CLUSTER">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {CLUSTER_META.map(c => {
                const count = clusterData.find(d => d.name === c.label)?.value || 0;
                return (
                  <Link
                    key={c.key}
                    to="/"
                    search={{ focus: c.key } as any}
                    style={{
                      textAlign: "left", padding: "12px 14px",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
                      border: `1px solid ${c.color}55`, borderLeft: `3px solid ${c.color}`,
                      borderRadius: 4, color: "#e8f4ff", textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, letterSpacing: "0.28em", color: c.color }}>{c.label}</span>
                      <span style={{ fontFamily: "Bebas Neue", fontSize: 20, color: c.color, textShadow: `0 0 8px ${c.color}` }}>{count}</span>
                    </div>
                    <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#8ba3c0", marginTop: 4 }}>Buka gugusan {c.label.toLowerCase()}</div>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

        <footer style={{ marginTop: 22, padding: "12px 20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          border: "1px solid rgba(168,85,247,0.2)", borderRadius: 4, background: "rgba(5,8,15,0.6)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#5a6f8a" }}>© SMANDASH × ROJAAKS · INFORMATION v1.1 · TANSTACK / R3F</div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#8ba3c0" }}>DATA · LIVE ▸</div>
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
      background: "linear-gradient(180deg, rgba(15,20,38,0.85), rgba(8,12,24,0.7))",
      border: `1px solid ${accent}44`, borderRadius: 4,
      backdropFilter: "blur(6px)", boxShadow: `inset 0 0 30px ${accent}0c`, position: "relative",
    }}>
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
      border: `1px solid ${color}33`, borderRadius: 3,
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", color }}>{label}</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 28, letterSpacing: "0.02em", color: "#e8f4ff", marginTop: 2, textShadow: `0 0 10px ${color}66` }}>{value.toLocaleString()}</div>
    </div>
  );
}
