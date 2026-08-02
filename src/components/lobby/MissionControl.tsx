import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { buildGraph } from "@/lib/graph/build";
import { MOTIONS, VOCAB, MATTER, EVENTS, COMPETITORS, ACTIVE_MEMBERS, JENIS_MOSI, ROLES } from "@/data";
import { useUniverse, useSettings } from "@/lib/store";
import { analyzeMotion } from "@/lib/motion/win-probability";
import logo from "@/assets/smandash-logo.png";
import milkyway from "@/assets/milkyway_pano_hd.jpg.asset.json";
import heroImg from "@/assets/lobby/planet-hero.jpg";
import nebulaImg from "@/assets/lobby/nebula-gold.jpg";
import constellationImg from "@/assets/lobby/constellation.jpg";
import stageImg from "@/assets/lobby/debate-stage.jpg";
import controlImg from "@/assets/lobby/mission-control.jpg";
import lexiconImg from "@/assets/lobby/lexicon.jpg";
import { HeroSlider, buildSlides } from "./HeroSlider";


/* ────────────────────────────────────────────────────────────
   NASA-style Mission Control lobby — dark elegant, image-led.
──────────────────────────────────────────────────────────── */

const C = {
  bg: "#06080D",
  bg2: "#0A0D14",
  line: "rgba(255,255,255,0.09)",
  lineSoft: "rgba(255,255,255,0.05)",
  text: "#ECEFF4",
  dim: "#9AA1B1",
  faint: "#606776",
  accent: "#D8B26A",
  accent2: "#4FD1C5",
  accent3: "#7C9CFF",
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
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
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
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setSeen(true)), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} style={{
      opacity: seen ? 1 : 0,
      transform: seen ? "none" : "translateY(20px)",
      transition: `opacity 700ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform 700ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

function Eyebrow({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.34em", color, textTransform: "uppercase" }}>{children}</div>;
}

function SectionHead({ kicker, title, sub, right }: { kicker: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginBottom: 30 }}>
      <div style={{ maxWidth: 640 }}>
        <Eyebrow>{kicker}</Eyebrow>
        <h2 style={{ margin: "10px 0 0", fontSize: "clamp(26px,3.4vw,42px)", fontWeight: 300, letterSpacing: "-0.025em", color: C.text }}>{title}</h2>
        {sub && <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.75, color: C.dim, textAlign: "justify", hyphens: "auto" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      padding: "11px 20px", background: h ? "rgba(216,178,106,0.12)" : "transparent",
      border: `1px solid ${h ? C.accent : C.line}`, color: h ? C.accent : C.text, borderRadius: 2,
      fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: MONO,
      cursor: "pointer", transition: "all 220ms ease", display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
    }}>
      {children}<span style={{ transform: h ? "translateX(4px)" : "none", transition: "transform 220ms ease" }}>→</span>
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
  const [scrollY, setScrollY] = useState(0);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("SEMUA");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const id = window.setTimeout(() => setMounted(true), 30); return () => window.clearTimeout(id); }, []);
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => ({
    nodes: graph.nodes.length, edges: graph.edges.length,
    domains: Object.keys(MATTER).length, motions: MOTIONS.length, vocab: VOCAB.length,
    events: EVENTS.length, schools: COMPETITORS.length + ACTIVE_MEMBERS.length,
    jenis: JENIS_MOSI.length, roles: ROLES.length,
    babs: Object.values(MATTER).reduce((a: number, d: any) => a + (d.babs?.length ?? 0), 0),
    subbabs: Object.values(MATTER).reduce(
      (a: number, d: any) => a + (d.babs ?? []).reduce((b: number, x: any) => b + (x.subbabs?.length ?? 0), 0), 0),
  }), [graph]);

  const featured = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    const m = MOTIONS[day % MOTIONS.length];
    return { m, a: analyzeMotion(m) };
  }, []);

  const mix = useMemo(() => {
    const off = MOTIONS.filter((m) => analyzeMotion(m).stance === "OFENSIF").length;
    const def = MOTIONS.filter((m) => analyzeMotion(m).stance === "DEFENSIF").length;
    return { off, def, hyb: MOTIONS.length - off - def };
  }, []);

  const cats = useMemo(() => {
    const s = new Set<string>();
    MOTIONS.forEach((m: any) => m.cat && s.add(String(m.cat)));
    return ["SEMUA", ...Array.from(s).slice(0, 10)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTIONS.filter((m: any) =>
      (cat === "SEMUA" || String(m.cat) === cat) && (!q || String(m.title).toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, cat]);

  const go = (fn?: () => void) => {
    setDismissing(true);
    window.setTimeout(() => { update({ lobbySeen: true }); fn?.(); onInitiate(); }, 420);
  };

  const PAD = "clamp(20px, 6vw, 96px)";

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setScrollY((e.target as HTMLDivElement).scrollTop)}
      style={{
        position: "fixed", inset: 0, zIndex: 200, overflow: "auto",
        background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif",
        opacity: dismissing ? 0 : mounted ? 1 : 0,
        transform: dismissing ? "scale(0.985)" : "scale(1)",
        transition: "opacity 420ms ease-out, transform 420ms ease-out",
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: `12px ${PAD}`, background: "rgba(6,8,13,0.86)",
        backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.lineSoft}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="SMANDASH Debate Club" width={28} height={28} style={{ borderRadius: 4 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.22em" }}>SMANDASH · ROJAAKS</span>
          <span className="hide-sm" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: C.accent2, border: `1px solid rgba(79,209,197,0.35)`, padding: "3px 8px", borderRadius: 999 }}>◉ LIVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: MONO, fontSize: 10.5, color: C.dim, letterSpacing: "0.14em" }}>
          <a href="#universe" style={{ color: C.dim, textDecoration: "none" }}>UNIVERSE</a>
          <a href="#telemetry" style={{ color: C.dim, textDecoration: "none" }}>DATA</a>
          <a href="#motions" style={{ color: C.dim, textDecoration: "none" }}>MOSI</a>
          <span className="hide-sm">{clock} WIB</span>
          <button onClick={() => setSettingsOpen(true)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em" }}>SETTINGS</button>
          <button onClick={() => go()} style={{ background: C.accent, border: "none", padding: "8px 16px", color: "#12100A", cursor: "pointer", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", borderRadius: 2 }}>ENTER →</button>
        </div>
      </nav>

      {/* ── HERO SLIDER ── */}
      <HeroSlider slides={buildSlides({ stats, enter: () => go(), goCluster: (k) => go(() => select(`cluster:${k}`)) })} />


      {/* ── WELCOME TO THE UNIVERSE (image cards) ── */}
      <section id="universe" style={{ padding: `78px ${PAD}`, background: C.bg }}>
        <Reveal>
          <SectionHead
            kicker="Welcome to the universe"
            title="Empat Gugus Utama"
            sub="Setiap gugus adalah kumpulan bintang dengan hierarki sendiri: hub domain, bab, subbab, hingga daun materi. Klik satu kartu untuk mendarat langsung di gugusnya."
            right={<GhostButton onClick={() => go()}>Peta penuh</GhostButton>}
          />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
          <ImageCard img={nebulaImg} tag="Matter" title="Amunisi Argumen" meta={`${stats.domains} domain · ${stats.babs} bab`}
            desc="Ekonomi, politik, hukum, filsafat, sains, hingga filosofi cinta — lengkap dengan contoh dan bantahan."
            onClick={() => go(() => select("cluster:matter"))} delay={0} />
          <ImageCard img={constellationImg} tag="Motion Bank" title="Bank Mosi Teranalisis" meta={`${stats.motions} mosi · ${stats.jenis} jenis`}
            desc="Setiap mosi dibedah: probabilitas menang, keberpihakan, stance ofensif atau defensif, dan rotasi latihan."
            onClick={() => go(() => select("cluster:motion"))} delay={70} />
          <ImageCard img={stageImg} tag="Roles" title="Peran & Timing" meta={`${stats.roles} peran · AP + BP`}
            desc="Tugas tiap pembicara, alokasi waktu, beban pembuktian, dan sub-keterampilan yang wajib dikuasai."
            onClick={() => go(() => select("cluster:roles"))} delay={140} />
          <ImageCard img={lexiconImg} tag="Kamus" title="Leksikon Debat" meta={`${stats.vocab.toLocaleString()} entri`}
            desc="Istilah asing di matter dan mosi tertaut otomatis ke kamus lewat tab kecil agar bacaan tetap fokus."
            onClick={() => go(() => select("cluster:kamus"))} delay={210} />
        </div>
      </section>

      {/* ── MOTION OF THE DAY (image of the day style) ── */}
      <section style={{ padding: `78px ${PAD}`, background: C.bg2, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,1.25fr) minmax(280px,1fr)", gap: 44, alignItems: "center" }}>
            <div style={{ position: "relative", minHeight: 380, border: `1px solid ${C.line}`, overflow: "hidden" }}>
              <img src={nebulaImg} alt="Nebula emas sebagai ilustrasi mosi hari ini" loading="lazy" width={1280} height={800}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,8,13,0.15), rgba(6,8,13,0.92))" }} />
              <div style={{ position: "relative", padding: 30, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 380 }}>
                <Eyebrow>Motion of the day</Eyebrow>
                <div style={{ marginTop: 12, fontSize: "clamp(20px,2.4vw,30px)", fontWeight: 300, lineHeight: 1.32 }}>“{featured.m.title}”</div>
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: C.faint, textTransform: "uppercase" }}>
                  {(featured.m as any).cat} · {(featured.m as any).type} · {featured.a.stance}
                </div>
              </div>
            </div>
            <div>
              <Eyebrow color={C.accent2}>Analisis harian</Eyebrow>
              <h2 style={{ margin: "12px 0 18px", fontSize: "clamp(22px,2.6vw,32px)", fontWeight: 300, letterSpacing: "-0.02em" }}>Peluang & Rotasi</h2>
              <ProbBar label="Sisi PRO" value={featured.a.winProProb} color={C.accent} />
              <ProbBar label="Sisi KON" value={featured.a.winKonProb} color={C.accent3} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "20px 0" }}>
                <MiniFact k="Keberpihakan" v={featured.a.bias} />
                <MiniFact k="Rotasi" v={featured.a.rotation} />
                <MiniFact k="Half-stance" v={featured.a.needsHalfStance ? "Diperlukan" : "Tidak wajib"} />
                <MiniFact k="Keyakinan" v={`${(featured.a.confidence * 100).toFixed(1)}%`} />
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.85, color: C.dim, textAlign: "justify", hyphens: "auto" }}>
                {featured.a.rotationReason}
              </p>
              <div style={{ marginTop: 20 }}>
                <GhostButton onClick={() => go(() => select(`motion:${featured.m.id}`))}>Buka analisis penuh</GhostButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── TELEMETRY ── */}
      <section id="telemetry" style={{ padding: `78px ${PAD}`, background: C.bg, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionHead kicker="Live dataset" title="Telemetri Kurikulum"
            sub="Angka berikut dihitung langsung dari basis data aplikasi setiap kali lobi dimuat, bukan nilai statis." />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px,1fr))", gap: 1, background: C.lineSoft, border: `1px solid ${C.lineSoft}` }}>
          <Stat label="Bintang" value={stats.nodes} accent={C.accent3} />
          <Stat label="Tautan" value={stats.edges} accent={C.accent2} />
          <Stat label="Mosi" value={stats.motions} accent={C.accent} />
          <Stat label="Subbab" value={stats.subbabs} accent={C.accent3} />
          <Stat label="Kamus" value={stats.vocab} accent={C.accent2} />
          <Stat label="Domain" value={stats.domains} accent={C.accent} />
          <Stat label="Sekolah" value={stats.schools} accent={C.accent2} />
          <Stat label="Event" value={stats.events} accent={C.danger} />
        </div>

        {/* stance distribution */}
        <div style={{ marginTop: 26, border: `1px solid ${C.lineSoft}`, padding: 24, background: "rgba(255,255,255,0.02)" }}>
          <Eyebrow color={C.accent2}>Distribusi stance mosi</Eyebrow>
          <div style={{ display: "flex", height: 10, marginTop: 16, overflow: "hidden", borderRadius: 2 }}>
            <Seg w={mix.off / stats.motions} c={C.danger} />
            <Seg w={mix.def / stats.motions} c={C.accent2} />
            <Seg w={mix.hyb / stats.motions} c={C.accent} />
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 14, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.dim }}>
            <Legend c={C.danger} t={`OFENSIF ${mix.off}`} />
            <Legend c={C.accent2} t={`DEFENSIF ${mix.def}`} />
            <Legend c={C.accent} t={`HIBRID ${mix.hyb}`} />
          </div>
        </div>
      </section>

      {/* ── DOMAIN GRID ── */}
      <section style={{ padding: `78px ${PAD}`, background: C.bg2, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionHead kicker="Matter" title="Pilih Domain, Langsung Mendarat"
            sub="Setiap domain memuat bab dan subbab dengan penjelasan, contoh kasus, serta amunisi bantahan siap pakai." />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(212px,1fr))", gap: 12 }}>
          {Object.entries(MATTER).map(([key, d]: [string, any], i) => (
            <Reveal key={key} delay={Math.min(i * 26, 220)}>
              <DomainCard icon={d.icon} label={d.label} desc={d.desc} babs={d.babs?.length ?? 0} onClick={() => go(() => select(`domain:${key}`))} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── MOTION EXPLORER ── */}
      <section id="motions" style={{ padding: `78px ${PAD}`, background: C.bg, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionHead kicker="Motion bank" title="Telusuri Mosi"
            sub="Ketik kata kunci atau saring berdasarkan kategori. Persentase menunjukkan peluang menang sisi pemerintah menurut analisis heuristik." />
        </Reveal>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari mosi… mis. 'THW ban'"
          style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 2, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "6px 12px", fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase",
              background: cat === c ? "rgba(216,178,106,0.14)" : "transparent",
              border: `1px solid ${cat === c ? C.accent : C.line}`, color: cat === c ? C.accent : C.dim,
              borderRadius: 999, cursor: "pointer", transition: "all 180ms ease",
            }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 1, background: C.lineSoft, border: `1px solid ${C.lineSoft}` }}>
          {filtered.map((m: any) => {
            const a = analyzeMotion(m);
            return <MotionRow key={m.id} title={m.title} cat={String(m.cat ?? "")} stance={a.stance} pro={a.winProProb} onClick={() => go(() => select(`motion:${m.id}`))} />;
          })}
          {filtered.length === 0 && <div style={{ background: C.bg, padding: 24, color: C.faint, fontSize: 13 }}>Tidak ada mosi yang cocok.</div>}
        </div>
      </section>

      {/* ── EVENTS ── */}
      <section style={{ padding: `78px ${PAD}`, background: C.bg2, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal>
          <SectionHead kicker="Arsip kompetisi" title="Event Pilihan"
            right={<GhostButton onClick={() => go(() => select("cluster:event"))}>Semua event</GhostButton>} />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))", gap: 12 }}>
          {EVENTS.slice(0, 4).map((ev, i) => (
            <Reveal key={ev.id} delay={i * 60}>
              <ImageCard img={[controlImg, stageImg, constellationImg, nebulaImg][i % 4]} tag="Event" title={ev.nama}
                meta={`${ev.brackets?.length ?? 0} bracket`} desc={ev.desc} onClick={() => go(() => select(`event:${ev.id}`))} short />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: `78px ${PAD}`, background: C.bg, borderTop: `1px solid ${C.lineSoft}` }}>
        <Reveal><SectionHead kicker="Panduan singkat" title="Cara Menjelajah" /></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 1, background: C.lineSoft, border: `1px solid ${C.lineSoft}` }}>
          {[
            ["01", "Masuk universe", "Tekan Enter untuk memuat peta bintang tiga dimensi. Mode grafis menyesuaikan perangkat secara otomatis."],
            ["02", "Arahkan & sorot", "Menyorot satu bintang akan menyalakan garis penuh ke seluruh bintang yang tertaut dengannya."],
            ["03", "Buka panel", "Klik bintang untuk membuka panel infografis: penjelasan, contoh, bagan, dan istilah yang tertaut ke kamus."],
            ["04", "Atur tampilan", "Panel pengaturan menyediakan mode tautan, preset font, kualitas grafis, dan pemutar musik latar."],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: C.bg, padding: "26px 22px" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.24em", color: C.accent }}>{n}</div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 500 }}>{t}</div>
              <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.75, color: C.faint, textAlign: "justify", hyphens: "auto" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", padding: `110px ${PAD}`, overflow: "hidden", borderTop: `1px solid ${C.lineSoft}` }}>
        <img src={milkyway.url} alt="Panorama Bima Sakti" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,8,13,0.8), rgba(6,8,13,0.96))" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <Eyebrow>Siap terbang</Eyebrow>
          <h2 style={{ margin: "16px 0 0", fontSize: "clamp(32px,5vw,62px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1.06, maxWidth: 760 }}>
            Setiap bintang adalah<br /><span style={{ color: C.accent, fontWeight: 400 }}>pintu masuk</span> materi.
          </h2>
          <div style={{ marginTop: 32 }}><GhostButton onClick={() => go()}>Masuk universe</GhostButton></div>
        </div>
      </section>

      <footer style={{ background: C.bg, color: C.faint, padding: `26px ${PAD}`, fontSize: 10.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `1px solid ${C.lineSoft}`, fontFamily: MONO, letterSpacing: "0.12em" }}>
        <span>© 2026 SMANDASH DEBATE CLUB × ROJAAKS</span>
        <Link to="/information" style={{ color: C.faint, textDecoration: "none" }}>LEGACY INFORMATION →</Link>
      </footer>
    </div>
  );
}

/* ── sub components ── */

function Seg({ w, c }: { w: number; c: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return <div ref={ref} style={{ width: seen ? `${w * 100}%` : 0, background: c, transition: "width 900ms cubic-bezier(.16,1,.3,1)" }} />;
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><i style={{ width: 8, height: 8, background: c, display: "inline-block", borderRadius: 2 }} />{t}</span>;
}

function MiniFact({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ border: `1px solid ${C.lineSoft}`, padding: "12px 14px", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.22em", color: C.faint, textTransform: "uppercase" }}>{k}</div>
      <div style={{ marginTop: 6, fontSize: 13, color: C.text, textTransform: "capitalize" }}>{v}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const v = useCountUp(value, seen);
  const [h, setH] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? "rgba(255,255,255,0.04)" : C.bg, padding: "22px 20px", transition: "background 220ms ease", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: h ? "100%" : "26%", background: accent, transition: "width 340ms cubic-bezier(.16,1,.3,1)" }} />
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.24em", color: C.faint, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 200, letterSpacing: "-0.03em" }}>{v.toLocaleString()}</div>
    </div>
  );
}

function ImageCard({ img, tag, title, meta, desc, onClick, delay = 0, short = false }: {
  img: string; tag: string; title: string; meta?: string; desc?: string; onClick: () => void; delay?: number; short?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <Reveal delay={delay}>
      <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          position: "relative", width: "100%", aspectRatio: short ? "4 / 3" : "3 / 4", overflow: "hidden",
          border: `1px solid ${h ? "rgba(216,178,106,0.5)" : C.line}`, borderRadius: 2, padding: 0,
          cursor: "pointer", background: C.bg2, textAlign: "left", fontFamily: "inherit",
          transform: h ? "translateY(-4px)" : "none", transition: "all 300ms cubic-bezier(.16,1,.3,1)",
          boxShadow: h ? "0 22px 50px rgba(0,0,0,0.55)" : "none",
        }}>
        <img src={img} alt={title} loading="lazy" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          transform: h ? "scale(1.08)" : "scale(1)", transition: "transform 700ms cubic-bezier(.16,1,.3,1)", opacity: 0.9,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,8,13,0.15) 0%, rgba(6,8,13,0.55) 45%, rgba(6,8,13,0.96) 100%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20, color: C.text }}>
          <span style={{ alignSelf: "flex-start", fontFamily: MONO, fontSize: 9, letterSpacing: "0.26em", textTransform: "uppercase", color: C.accent, border: `1px solid rgba(216,178,106,0.4)`, padding: "4px 9px", borderRadius: 999 }}>{tag}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.3 }}>{title}</div>
            {meta && <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: C.accent2, textTransform: "uppercase" }}>{meta}</div>}
            {desc && <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.65, color: C.dim, textAlign: "justify", hyphens: "auto", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.2em", color: h ? C.accent : C.faint, transition: "color 220ms" }}>
              BUKA <span style={{ transform: h ? "translateX(4px)" : "none", transition: "transform 220ms" }}>→</span>
            </span>
          </div>
        </div>
      </button>
    </Reveal>
  );
}

function DomainCard({ icon, label, desc, babs, onClick }: { icon: string; label: string; desc?: string; babs: number; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: h ? "rgba(216,178,106,0.07)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${h ? "rgba(216,178,106,0.45)" : C.line}`, borderRadius: 2, padding: 20, minHeight: 176,
        display: "flex", flexDirection: "column", justifyContent: "space-between", color: C.text,
        transform: h ? "translateY(-3px)" : "none", transition: "all 260ms cubic-bezier(.16,1,.3,1)",
        boxShadow: h ? "0 16px 40px rgba(0,0,0,0.45)" : "none",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: C.faint }}>{babs} BAB</span>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: h ? C.accent : C.text, marginBottom: 6, transition: "color 220ms" }}>{label}</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.6, color: C.faint, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</div>
      </div>
    </button>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: C.faint, marginBottom: 6, textTransform: "uppercase" }}>
        <span>{label}</span><span style={{ color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)" }}>
        <div style={{ height: "100%", width: seen ? `${value}%` : 0, background: color, transition: "width 950ms cubic-bezier(.16,1,.3,1)" }} />
      </div>
    </div>
  );
}

function MotionRow({ title, cat, stance, pro, onClick }: { title: string; cat: string; stance: string; pro: number; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", textAlign: "left",
        background: h ? "rgba(255,255,255,0.045)" : C.bg, border: "none", cursor: "pointer",
        padding: "16px 18px", fontFamily: "inherit", color: C.text, transition: "background 200ms ease",
      }}>
      <div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: h ? C.accent : C.text, transition: "color 200ms" }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: C.faint, marginTop: 5, textTransform: "uppercase" }}>{cat} · {stance}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, color: pro >= 50 ? C.accent : C.accent3, whiteSpace: "nowrap" }}>PRO {pro.toFixed(1)}%</div>
    </button>
  );
}
