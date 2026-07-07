import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { buildGraph } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS, JENIS_MOSI } from "@/data";
import { useUniverse, useSettings } from "@/lib/store";
import { analyzeMotion } from "@/lib/motion/win-probability";
import logo from "@/assets/smandash-logo.png";
import milkyway from "@/assets/milkyway_pano_hd.jpg.asset.json";

/**
 * NASA-style lobby — hero besar antariksa + welcome cards + featured news +
 * data telemetry sections. Merges old lobby + information dashboard.
 */
export function MissionControl({ onInitiate }: { onInitiate: () => void }) {
  const graph = useMemo(() => buildGraph(), []);
  const setSettingsOpen = useUniverse((s) => s.setSettingsOpen);
  const select = useUniverse((s) => s.select);
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
    jenis: JENIS_MOSI.length,
  }), [graph]);

  // "Motion of the day" — deterministic pick from today's date
  const featuredMotion = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    const m = MOTIONS[day % MOTIONS.length];
    return { m, analysis: analyzeMotion(m) };
  }, []);

  const enter = () => {
    setDismissing(true);
    window.setTimeout(() => {
      update({ lobbySeen: true });
      onInitiate();
    }, 420);
  };

  const enterDomain = (domainKey: string) => {
    setDismissing(true);
    window.setTimeout(() => {
      update({ lobbySeen: true });
      select(`domain:${domainKey}`);
      onInitiate();
    }, 420);
  };

  const enterCluster = (cluster: string) => {
    setDismissing(true);
    window.setTimeout(() => {
      update({ lobbySeen: true });
      select(`cluster:${cluster}`);
      onInitiate();
    }, 420);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, overflow: "auto",
        background: "#0A0E1A", color: "#111827",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: dismissing ? 0 : mounted ? 1 : 0,
        transform: dismissing ? "scale(0.98)" : "scale(1)",
        transition: "opacity 420ms ease-out, transform 420ms ease-out",
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      {/* ─── Top Nav ─── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 32px", background: "rgba(10,14,26,0.92)",
        backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={() => setSettingsOpen(true)} style={{ background: "transparent", border: "none", color: "#F3F4F6", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 14, height: 14, background: "#F3F4F6", maskImage: "linear-gradient(45deg, currentColor 25%, transparent 25%)" }} />
            Explore
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="Debate Coach" style={{ width: 40, height: 40, borderRadius: 8 }} />
          <div style={{ color: "#F3F4F6", fontFamily: "Inter", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>SMANDASH · ROJAAKS</div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", color: "#F3F4F6", fontSize: 13, fontWeight: 500 }}>
          <button onClick={enter} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit" }}>Universe →</button>
          <span style={{ padding: "3px 8px", background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", borderRadius: 3 }}>LIVE</span>
        </div>
      </nav>

      {/* ─── Hero fullscreen ─── */}
      <section style={{
        position: "relative", minHeight: "88vh",
        background: `linear-gradient(180deg, rgba(10,14,26,0.55) 0%, rgba(10,14,26,0.9) 100%), url(${milkyway.url}) center/cover`,
        display: "flex", alignItems: "center", padding: "0 clamp(24px, 6vw, 80px)",
        color: "#F9FAFB",
      }}>
        <div style={{ maxWidth: 720, position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.3em", color: "#9CA3AF", marginBottom: 20, textTransform: "uppercase" }}>
            Debate Coach Toolkit · v1.2
          </div>
          <h1 style={{
            margin: 0, fontFamily: "Inter, system-ui", fontWeight: 800,
            fontSize: "clamp(48px, 7vw, 92px)", lineHeight: 0.98,
            letterSpacing: "-0.03em", color: "#F9FAFB",
          }}>
            Jelajahi<br/>Semesta Debat
          </h1>
          <p style={{
            marginTop: 28, maxWidth: 540, fontSize: 17, lineHeight: 1.65, color: "#D1D5DB",
            fontWeight: 400,
          }}>
            {stats.motions.toLocaleString()} mosi, {stats.vocab.toLocaleString()} istilah kamus,
            {stats.domains} domain matter, dan {stats.nodes.toLocaleString()} bintang saling terhubung
            dalam satu peta 3D interaktif untuk seluruh kurikulum LDBI.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={enter}
              style={{
                padding: "18px 36px", background: "#EF4444", color: "#fff",
                border: "none", borderRadius: 999, fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em",
                display: "inline-flex", alignItems: "center", gap: 10,
                boxShadow: "0 10px 30px rgba(239,68,68,0.4)",
                transition: "transform 160ms, box-shadow 160ms",
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(239,68,68,0.55)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(239,68,68,0.4)"; }}
            >
              Enter Universe
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "rgba(255,255,255,0.2)", borderRadius: 999 }}>→</span>
            </button>
            <a href="#welcome" style={{ color: "#F9FAFB", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Discover More
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "#EF4444", borderRadius: 999, color: "#fff" }}>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Welcome to the Universe ─── */}
      <section id="welcome" style={{ background: "#fff", padding: "80px clamp(24px, 6vw, 80px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ margin: 0, fontFamily: "Inter", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>
            Welcome to the Universe
          </h2>
          <button onClick={enter} style={{ background: "transparent", border: "none", color: "#111827", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>
            Discover More
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#EF4444", borderRadius: 999, color: "#fff" }}>→</span>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <UniverseCard label="Matter" bg="linear-gradient(135deg, #f97316, #ea580c)" onClick={() => enterCluster("matter")} icon="◉" />
          <UniverseCard label="Motions" bg="linear-gradient(135deg, #a855f7, #7c3aed)" onClick={() => enterCluster("motion")} icon="◈" />
          <UniverseCard label="Roles" bg="linear-gradient(135deg, #ef4444, #dc2626)" onClick={() => enterCluster("roles")} icon="◐" />
          <UniverseCard label="Kamus" bg="linear-gradient(135deg, #3b82f6, #1d4ed8)" onClick={() => enterCluster("kamus")} icon="✦" />
        </div>
      </section>

      {/* ─── Featured Motion of the Day ─── */}
      <section style={{ background: "#fff", padding: "40px clamp(24px, 6vw, 80px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 60, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.28em", color: "#9CA3AF", textTransform: "uppercase" }}>Today</div>
            <h2 style={{ margin: "6px 0 20px", fontFamily: "Inter", fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>Motion of the Day</h2>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.35, marginBottom: 12 }}>{featuredMotion.m.title}</div>
            <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.65, marginBottom: 20 }}>
              Bias: <b style={{ color: "#111827" }}>{featuredMotion.analysis.bias}</b> · Sisi PRO <b style={{ color: "#EF4444" }}>{featuredMotion.analysis.winProProb.toFixed(1)}%</b> · Sisi KON <b style={{ color: "#3B82F6" }}>{featuredMotion.analysis.winKonProb.toFixed(1)}%</b>. Latih {featuredMotion.analysis.rotation}.
            </div>
            <button onClick={() => { update({ lobbySeen: true }); select(`motion:${featuredMotion.m.id}`); onInitiate(); }}
              style={{ background: "transparent", border: "none", color: "#111827", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>
              Buka di Universe
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#EF4444", borderRadius: 999, color: "#fff" }}>→</span>
            </button>
          </div>
          <div style={{
            position: "relative", borderRadius: 12, overflow: "hidden", minHeight: 380,
            background: `linear-gradient(135deg, rgba(59,130,246,0.85), rgba(30,64,175,0.9)), url(${milkyway.url}) center/cover`,
            display: "flex", alignItems: "flex-end", padding: 32, color: "#fff",
          }}>
            <div>
              <div style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.28em", opacity: 0.85 }}>{featuredMotion.m.cat} · {featuredMotion.m.type}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>"{featuredMotion.m.title}"</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Data Telemetry (was Information page) ─── */}
      <section style={{ background: "#F9FAFB", padding: "80px clamp(24px, 6vw, 80px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.28em", color: "#9CA3AF", textTransform: "uppercase" }}>Live Data</div>
            <h2 style={{ margin: "6px 0 0", fontFamily: "Inter", fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>Dataset Telemetry</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <StatCard label="Nodes" value={stats.nodes} accent="#3b82f6" />
          <StatCard label="Edges" value={stats.edges} accent="#a855f7" />
          <StatCard label="Motions" value={stats.motions} accent="#ef4444" />
          <StatCard label="Kamus" value={stats.vocab} accent="#22d3ee" />
          <StatCard label="Domains" value={stats.domains} accent="#f97316" />
          <StatCard label="Jenis Mosi" value={stats.jenis} accent="#eab308" />
          <StatCard label="Sekolah" value={stats.schools} accent="#22c55e" />
          <StatCard label="Events" value={stats.events} accent="#ec4899" />
        </div>
      </section>

      {/* ─── Featured News (Events) ─── */}
      <section style={{ background: "#fff", padding: "80px clamp(24px, 6vw, 80px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ margin: 0, fontFamily: "Inter", fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>Featured Events</h2>
          <button onClick={() => enterCluster("event")} style={{ background: "transparent", border: "none", color: "#111827", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>
            All Events
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#EF4444", borderRadius: 999, color: "#fff" }}>→</span>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {EVENTS.slice(0, 4).map((ev) => (
            <div key={ev.id} style={{
              background: "#111827", color: "#fff", borderRadius: 12, padding: 24, minHeight: 220,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              cursor: "pointer",
            }} onClick={() => { update({ lobbySeen: true }); select(`event:${ev.id}`); onInitiate(); }}>
              <div style={{ fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.28em", color: "#EF4444" }}>◉ EVENT</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, marginBottom: 8 }}>{ev.nama}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>{ev.desc?.slice(0, 100)}...</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA banner ─── */}
      <section style={{
        background: `linear-gradient(135deg, rgba(10,14,26,0.6), rgba(10,14,26,0.85)), url(${milkyway.url}) center/cover`,
        padding: "100px clamp(24px, 6vw, 80px)", color: "#fff",
      }}>
        <h2 style={{ margin: 0, fontFamily: "Inter", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05, maxWidth: 720 }}>
          Mulai eksplorasi<br/>semesta debat sekarang.
        </h2>
        <p style={{ marginTop: 20, maxWidth: 560, fontSize: 16, lineHeight: 1.6, color: "#D1D5DB" }}>
          Setiap bintang adalah pintu masuk — matter, motion bank, roles, kamus, dan lebih banyak lagi.
        </p>
        <button onClick={enter} style={{
          marginTop: 32, padding: "16px 32px", background: "#EF4444", color: "#fff",
          border: "none", borderRadius: 999, fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 10px 30px rgba(239,68,68,0.4)",
        }}>
          Enter Universe →
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ background: "#0A0E1A", color: "#9CA3AF", padding: "40px clamp(24px, 6vw, 80px)", fontSize: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>© 2026 SMANDASH Debate Club × ROJAAKS. All rights reserved.</div>
        <div><Link to="/information" style={{ color: "#9CA3AF" }}>Legacy Information</Link></div>
      </footer>
    </div>
  );
}

function UniverseCard({ label, bg, onClick, icon }: { label: string; bg: string; onClick: () => void; icon: string }) {
  return (
    <button onClick={onClick} style={{
      position: "relative", aspectRatio: "3 / 4", background: bg, color: "#fff",
      border: "none", borderRadius: 12, cursor: "pointer",
      padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between",
      fontFamily: "inherit", textAlign: "left",
      transition: "transform 180ms",
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ fontSize: 48, opacity: 0.7 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 800 }}>
        {label}
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#EF4444", borderRadius: 999 }}>→</span>
      </div>
    </button>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ padding: "20px 22px", background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.24em", color: "#6B7280", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>{value.toLocaleString()}</div>
    </div>
  );
}
