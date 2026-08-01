import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { buildGraph } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS, JENIS_MOSI } from "@/data";
import { useUniverse, useSettings } from "@/lib/store";
import { analyzeMotion } from "@/lib/motion/win-probability";
import logo from "@/assets/smandash-logo.png";
import milkyway from "@/assets/milkyway_pano_hd.jpg.asset.json";

/* ────────────────────────────────────────────────────────────
   Dark elegant "Mission Control" lobby.
   Palette: obsidian bg, ivory text, amber/cyan accents, hairline borders.
──────────────────────────────────────────────────────────── */

const C = {
  bg: "#06080D",
  bg2: "#0A0D14",
  panel: "rgba(255,255,255,0.035)",
  line: "rgba(255,255,255,0.09)",
  lineSoft: "rgba(255,255,255,0.05)",
  text: "#ECEFF4",
  dim: "#8C93A3",
  faint: "#5A6070",
  accent: "#D8B26A",      // champagne gold
  accent2: "#4FD1C5",     // teal
  accent3: "#7C9CFF",     // periwinkle
  danger: "#F27059",
};

const MONO = "'Space Mono', ui-monospace, monospace";

function useCountUp(target: number, active: boolean, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return v;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 620ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform 620ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.34em", color: C.accent, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function SectionTitle({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
      <div>
        <Eyebrow>{kicker}</Eyebrow>
        <h2 style={{ margin: "10px 0 0", fontSize: "clamp(26px,3.2vw,40px)", fontWeight: 300, letterSpacing: "-0.02em", color: C.text }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: "11px 20px", background: h ? "rgba(216,178,106,0.12)" : "transparent",
        border: `1px solid ${h ? C.accent : C.line}`, color: h ? C.accent : C.text,
        borderRadius: 2, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
        fontFamily: MONO, cursor: "pointer", transition: "all 220ms ease",
        display: "inline-flex", alignItems: "center", gap: 10,
      }}
    >
      {children}
      <span style={{ transform: h ? "translateX(4px)" : "none", transition: "transform 220ms ease" }}>→</span>
    </button>
  );
}

export function MissionControl({ onInitiate }: { onInitiate: () => void }) {
  const graph = useMemo(() => buildGraph(), []);
  const setSettingsOpen = useUniverse((s) => s.setSettingsOpen);
  const select = useUniverse((s) => s.select);
  const update = useSettings((s) => s.update);
  const [mounted, setMounted] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [clock, setClock] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("SEMUA");

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 30);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
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

  const featured = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    const m = MOTIONS[day % MOTIONS.length];
    return { m, a: analyzeMotion(m) };
  }, []);

  const cats = useMemo(() => {
    const set = new Set<string>();
    MOTIONS.forEach((m: any) => m.cat && set.add(String(m.cat)));
    return ["SEMUA", ...Array.from(set).slice(0, 10)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTIONS.filter((m: any) => {
      const okCat = cat === "SEMUA" || String(m.cat) === cat;
      const okQ = !q || String(m.title).toLowerCase().includes(q);
      return okCat && okQ;
    }).slice(0, 8);
  }, [query, cat]);

  const go = (fn?: () => void) => {
    setDismissing(true);
    window.setTimeout(() => {
      update({ lobbySeen: true });
      fn?.();
      onInitiate();
    }, 420);
  };

  const pad = "0 clamp(20px, 6vw, 96px)";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, overflow: "auto",
        background: C.bg, color: C.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: dismissing ? 0 : mounted ? 1 : 0,
        transform: dismissing ? "scale(0.985)" : "scale(1)",
        transition: "opacity 420ms ease-out, transform 420ms ease-out",
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 30,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px clamp(20px, 6vw, 96px)",
        background: "rgba(6,8,13,0.82)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.lineSoft}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logo} alt="SMANDASH Debate Club" style={{ width: 30, height: 30, borderRadius: 4, opacity: 0.95 }} />
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.22em", color: C.text }}>SMANDASH · ROJAAKS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: MONO, fontSize: 11, color: C.dim, letterSpacing: "0.12em" }}>
          <span className="hide-sm">UTC+7 · {clock}</span>
          <button onClick={() => setSettingsOpen(true)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em" }}>SETTINGS</button>
          <button onClick={() => go()} style={{ background: "none", border: `1px solid ${C.line}`, padding: "7px 14px", color: C.text, cursor: "pointer", fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", borderRadius: 2 }}>ENTER →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", minHeight: "86vh", display: "flex", alignItems: "center", padding: pad,
        background: `radial-gradient(120% 90% at 78% 20%, rgba(124,156,255,0.16), transparent 60%),
                     linear-gradient(180deg, rgba(6,8,13,0.55) 0%, rgba(6,8,13,0.93) 78%, ${C.bg} 100%),
                     url(${milkyway.url}) center/cover`,
      }}>
        <div style={{ maxWidth: 760, zIndex: 2 }}>
          <Eyebrow>Debate Coach Toolkit · v1.3</Eyebrow>
          <h1 style={{
            margin: "22px 0 0", fontWeight: 200, fontSize: "clamp(44px, 7.4vw, 96px)",
            lineHeight: 0.98, letterSpacing: "-0.045em", color: C.text,
          }}>
            Jelajahi<br />
            <span style={{ fontWeight: 500, color: C.accent }}>Semesta Debat</span>
          </h1>
          <p style={{ marginTop: 26, maxWidth: 560, fontSize: 16, lineHeight: 1.75, color: C.dim }}>
            {stats.motions} mosi, {stats.vocab.toLocaleString()} entri kamus, {stats.domains} domain matter,
            dan {stats.nodes.toLocaleString()} bintang yang saling tertaut dalam satu peta tiga dimensi
            untuk seluruh kurikulum LDBI.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => go()}
              style={{
                padding: "16px 30px", background: C.accent, color: "#12100A", border: "none", borderRadius: 2,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
                fontFamily: MONO, cursor: "pointer", boxShadow: "0 14px 44px rgba(216,178,106,0.24)",
                transition: "transform 200ms ease, box-shadow 200ms ease",
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 18px 54px rgba(216,178,106,0.36)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 14px 44px rgba(216,178,106,0.24)"; }}
            >
              Masuk Universe
            </button>
            <a href="#telemetry" style={{ color: C.dim, fontSize: 12, fontFamily: MONO, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", borderBottom: `1px solid ${C.line}`, paddingBottom: 4 }}>
              Pelajari data ↓
            </a>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.line}, transparent)` }} />
      </section>

      {/* ── Telemetry ── */}
      <section id="telemetry" style={{ padding: `72px ${pad.split(" ")[1]}`, background: C.bg }}>
        <Reveal>
          <SectionTitle kicker="Live dataset" title="Telemetri Kurikulum" right={<GhostButton onClick={() => go()}>Buka peta</GhostButton>} />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 1, background: C.lineSoft, border: `1px solid ${C.lineSoft}` }}>
          <Stat label="Bintang" value={stats.nodes} accent={C.accent3} />
          <Stat label="Tautan" value={stats.edges} accent={C.accent2} />
          <Stat label="Mosi" value={stats.motions} accent={C.accent} />
          <Stat label="Kamus" value={stats.vocab} accent={C.accent2} />
          <Stat label="Domain" value={stats.domains} accent={C.accent3} />
          <Stat label="Jenis Mosi" value={stats.jenis} accent={C.accent} />
          <Stat label="Sekolah" value={stats.schools} accent={C.accent2} />
          <Stat label="Event" value={stats.events} accent={C.danger} />
        </div>
      </section>

      {/* ── Domain grid (interaktif) ── */}
      <section style={{ padding: `72px ${pad.split(" ")[1]}`, background: C.bg2, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionTitle kicker="Matter" title="Pilih Domain, Langsung Mendarat" />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {Object.entries(MATTER).map(([key, d]: [string, any], i) => (
            <Reveal key={key} delay={Math.min(i * 30, 240)}>
              <DomainCard icon={d.icon} label={d.label} desc={d.desc} onClick={() => go(() => select(`domain:${key}`))} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Motion of the day ── */}
      <section style={{ padding: `72px ${pad.split(" ")[1]}`, background: C.bg, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(300px, 1.25fr)", gap: 48, alignItems: "center" }}>
            <div>
              <Eyebrow>Motion of the day</Eyebrow>
              <h2 style={{ margin: "12px 0 18px", fontSize: "clamp(24px,2.8vw,34px)", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                {featured.m.title}
              </h2>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: C.faint, textTransform: "uppercase", marginBottom: 20 }}>
                {(featured.m as any).cat} · {(featured.m as any).type} · bias {featured.a.bias}
              </div>
              <ProbBar label="PRO" value={featured.a.winProProb} color={C.accent} />
              <ProbBar label="KON" value={featured.a.winKonProb} color={C.accent3} />
              <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.8, color: C.dim, textAlign: "justify", hyphens: "auto" }}>
                Rotasi yang disarankan: {featured.a.rotation}. Gunakan analisis ini untuk menentukan apakah tim
                perlu berlatih setengah sisi (half stance) atau menyeimbangkan beban kedua kubu.
              </p>
              <div style={{ marginTop: 22 }}>
                <GhostButton onClick={() => go(() => select(`motion:${featured.m.id}`))}>Buka analisis penuh</GhostButton>
              </div>
            </div>
            <div style={{
              position: "relative", minHeight: 340, border: `1px solid ${C.line}`,
              background: `linear-gradient(160deg, rgba(6,8,13,0.35), rgba(6,8,13,0.9)), url(${milkyway.url}) center/cover`,
              display: "flex", alignItems: "flex-end", padding: 30,
            }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.3em", color: C.accent }}>ANALISIS HARIAN</div>
                <div style={{ marginTop: 10, fontSize: 22, fontWeight: 300, lineHeight: 1.4, color: C.text }}>
                  “{featured.m.title}”
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Motion explorer (interaktif) ── */}
      <section style={{ padding: `72px ${pad.split(" ")[1]}`, background: C.bg2, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionTitle kicker="Motion bank" title="Telusuri Mosi" />
        </Reveal>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari mosi… mis. 'THW ban'"
          style={{
            width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.line}`, borderRadius: 2, color: C.text, fontSize: 14,
            outline: "none", fontFamily: "inherit", marginBottom: 14,
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "6px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
              background: cat === c ? "rgba(216,178,106,0.14)" : "transparent",
              border: `1px solid ${cat === c ? C.accent : C.line}`, color: cat === c ? C.accent : C.dim,
              borderRadius: 999, cursor: "pointer", transition: "all 180ms ease",
            }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 1, background: C.lineSoft, border: `1px solid ${C.lineSoft}` }}>
          {filtered.map((m: any) => {
            const a = analyzeMotion(m);
            return <MotionRow key={m.id} title={m.title} cat={String(m.cat ?? "")} pro={a.winProProb} onClick={() => go(() => select(`motion:${m.id}`))} />;
          })}
          {filtered.length === 0 && (
            <div style={{ background: C.bg, padding: 24, color: C.faint, fontSize: 13 }}>Tidak ada mosi yang cocok.</div>
          )}
        </div>
      </section>

      {/* ── Events ── */}
      <section style={{ padding: `72px ${pad.split(" ")[1]}`, background: C.bg, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionTitle kicker="Arsip" title="Event Pilihan" right={<GhostButton onClick={() => go(() => select("cluster:event"))}>Semua event</GhostButton>} />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {EVENTS.slice(0, 4).map((ev, i) => (
            <Reveal key={ev.id} delay={i * 60}>
              <EventCard nama={ev.nama} desc={ev.desc} onClick={() => go(() => select(`event:${ev.id}`))} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: `104px ${pad.split(" ")[1]}`,
        background: `linear-gradient(180deg, rgba(6,8,13,0.7), rgba(6,8,13,0.95)), url(${milkyway.url}) center/cover`,
        borderTop: `1px solid ${C.lineSoft}`,
      }}>
        <Eyebrow>Siap terbang</Eyebrow>
        <h2 style={{ margin: "16px 0 0", fontSize: "clamp(32px,5vw,60px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1.06, maxWidth: 720 }}>
          Setiap bintang adalah<br /><span style={{ color: C.accent, fontWeight: 400 }}>pintu masuk</span> materi.
        </h2>
        <div style={{ marginTop: 34 }}>
          <GhostButton onClick={() => go()}>Masuk universe</GhostButton>
        </div>
      </section>

      <footer style={{
        background: C.bg, color: C.faint, padding: `28px ${pad.split(" ")[1]}`, fontSize: 11,
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        borderTop: `1px solid ${C.lineSoft}`, fontFamily: MONO, letterSpacing: "0.1em",
      }}>
        <div>© 2026 SMANDASH DEBATE CLUB × ROJAAKS</div>
        <Link to="/information" style={{ color: C.faint, textDecoration: "none" }}>LEGACY INFORMATION →</Link>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const v = useCountUp(value, seen);
  const [h, setH] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? "rgba(255,255,255,0.04)" : C.bg, padding: "22px 20px",
        transition: "background 220ms ease", position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: h ? "100%" : "26%", background: accent, transition: "width 320ms cubic-bezier(.16,1,.3,1)" }} />
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", color: C.faint, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 200, letterSpacing: "-0.03em", color: C.text }}>{v.toLocaleString()}</div>
    </div>
  );
}

function DomainCard({ icon, label, desc, onClick }: { icon: string; label: string; desc?: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: h ? "rgba(216,178,106,0.07)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${h ? "rgba(216,178,106,0.45)" : C.line}`, borderRadius: 2,
        padding: 20, minHeight: 168, display: "flex", flexDirection: "column", justifyContent: "space-between",
        transform: h ? "translateY(-3px)" : "none",
        transition: "all 260ms cubic-bezier(.16,1,.3,1)",
        boxShadow: h ? "0 16px 40px rgba(0,0,0,0.45)" : "none",
      }}
    >
      <div style={{ fontSize: 26, opacity: 0.9 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: h ? C.accent : C.text, marginBottom: 6, transition: "color 220ms" }}>{label}</div>
        <div style={{
          fontSize: 11.5, lineHeight: 1.6, color: C.faint,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{desc}</div>
      </div>
    </button>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: C.faint, marginBottom: 6 }}>
        <span>{label}</span><span style={{ color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)" }}>
        <div style={{ height: "100%", width: seen ? `${value}%` : 0, background: color, transition: "width 900ms cubic-bezier(.16,1,.3,1)" }} />
      </div>
    </div>
  );
}

function MotionRow({ title, cat, pro, onClick }: { title: string; cat: string; pro: number; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", textAlign: "left",
        background: h ? "rgba(255,255,255,0.045)" : C.bg, border: "none", cursor: "pointer",
        padding: "16px 18px", fontFamily: "inherit", color: C.text, transition: "background 200ms ease",
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: h ? C.accent : C.text, transition: "color 200ms" }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: C.faint, marginTop: 5, textTransform: "uppercase" }}>{cat}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 12, color: pro >= 50 ? C.accent : C.accent3, whiteSpace: "nowrap" }}>
        PRO {pro.toFixed(1)}%
      </div>
    </button>
  );
}

function EventCard({ nama, desc, onClick }: { nama: string; desc?: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: "rgba(255,255,255,0.025)", border: `1px solid ${h ? "rgba(79,209,197,0.45)" : C.line}`,
        borderRadius: 2, padding: 22, minHeight: 200, color: C.text,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        transform: h ? "translateY(-3px)" : "none", transition: "all 260ms cubic-bezier(.16,1,.3,1)",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.3em", color: C.accent2 }}>◉ EVENT</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 8 }}>{nama}</div>
        <div style={{ fontSize: 12, lineHeight: 1.65, color: C.faint, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</div>
      </div>
    </button>
  );
}
