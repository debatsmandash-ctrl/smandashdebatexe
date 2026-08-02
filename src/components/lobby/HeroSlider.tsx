import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import carina from "@/assets/lobby/nasa-carina.jpg.asset.json";
import pillars from "@/assets/lobby/nasa-pillars.jpg.asset.json";
import andromeda from "@/assets/lobby/nasa-andromeda.jpg.asset.json";
import tower from "@/assets/lobby/nasa-nebula-tower.jpg.asset.json";
import earth from "@/assets/lobby/nasa-earth.jpg.asset.json";

const MONO = "'Space Mono', ui-monospace, monospace";

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  accentTitle: string;
  body: string;
  cta: string;
  meta: [string, string][];
  img: string;
  alt: string;
  neon: string;
  credit: string;
  onGo: () => void;
}

export function buildSlides(opts: {
  stats: { nodes: number; edges: number; motions: number; vocab: number; domains: number; subbabs: number };
  enter: () => void;
  goCluster: (k: string) => void;
}): HeroSlide[] {
  const { stats, enter, goCluster } = opts;
  return [
    {
      id: "universe",
      kicker: "Debate coach toolkit · Mission control v1.3",
      title: "Jelajahi",
      accentTitle: "Semesta Debat",
      body: `Peta tiga dimensi berisi ${stats.nodes.toLocaleString()} bintang pengetahuan yang saling tertaut lewat ${stats.edges.toLocaleString()} garis relasi — seluruh kurikulum LDBI dalam satu ruang.`,
      cta: "Masuk Universe",
      meta: [["Bintang", stats.nodes.toLocaleString()], ["Tautan", stats.edges.toLocaleString()], ["Cluster", "15"]],
      img: carina.url,
      alt: "Tebing kosmik Nebula Carina difoto teleskop James Webb",
      neon: "#4FD1C5",
      credit: "NASA / ESA / CSA · JWST — Cosmic Cliffs, Carina Nebula",
      onGo: enter,
    },
    {
      id: "matter",
      kicker: "Divisi 01 · Matter",
      title: "Peta",
      accentTitle: "Pengetahuan",
      body: `${stats.domains} domain matter dengan ${stats.subbabs.toLocaleString()} subbab tertulis lengkap: ekonomi, politik, hukum, filsafat, sains, hingga feminisme — semuanya bertaut ke kamus.`,
      cta: "Buka Matter",
      meta: [["Domain", String(stats.domains)], ["Subbab", stats.subbabs.toLocaleString()], ["Bahasa", "KBBI"]],
      img: pillars.url,
      alt: "Pillars of Creation di Nebula Elang difoto Hubble",
      neon: "#00FFC8",
      credit: "NASA / ESA / Hubble — Pillars of Creation, Eagle Nebula",
      onGo: () => goCluster("matter"),
    },
    {
      id: "motion",
      kicker: "Divisi 02 · Motion Bank",
      title: "Bank",
      accentTitle: "Mosi Teranalisis",
      body: `${stats.motions} mosi dengan probabilitas menang, tier argumen, rantai kausalitas, empat lapis case, dan rekomendasi rotasi ofensif maupun defensif.`,
      cta: "Buka Motion Bank",
      meta: [["Mosi", String(stats.motions)], ["Poin/Mosi", "20"], ["Tier", "S · A · B · C"]],
      img: andromeda.url,
      alt: "Galaksi spiral berpendar difoto teleskop Hubble",
      neon: "#FF8B3D",
      credit: "NASA / ESA / Hubble — Spiral Galaxy",
      onGo: () => goCluster("motion"),
    },
    {
      id: "roles",
      kicker: "Divisi 03 · Roles & Styles",
      title: "Peran",
      accentTitle: "di Atas Mimbar",
      body: "Uraian tugas tiap pembicara pada format Asian, British, dan Australasian Parliamentary — lengkap dengan keterampilan turunan dan kesalahan umum.",
      cta: "Buka Roles",
      meta: [["Format", "3"], ["Peran", "18+"], ["Skill", "60+"]],
      img: tower.url,
      alt: "Menara gas dan debu kosmik yang menjulang di nebula",
      neon: "#FF6B6B",
      credit: "NASA / ESA / Hubble — Towering Infernos",
      onGo: () => goCluster("roles"),
    },
    {
      id: "kamus",
      kicker: "Divisi 04 · Kamus",
      title: "Leksikon",
      accentTitle: "Istilah Debat",
      body: `${stats.vocab.toLocaleString()} entri istilah debat, filsafat, hukum, dan ekonomi. Setiap istilah asing di matter maupun mosi tertaut langsung ke definisinya.`,
      cta: "Buka Kamus",
      meta: [["Entri", stats.vocab.toLocaleString()], ["Kategori", "12"], ["Tautan", "Otomatis"]],
      img: earth.url,
      alt: "Bumi dilihat dari Stasiun Luar Angkasa Internasional",
      neon: "#38BDF8",
      credit: "NASA — Earth Observation, ISS Expedition 40",
      onGo: () => goCluster("kamus"),
    },
  ];
}

const AUTOPLAY = 7000;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const dragX = useRef<number | null>(null);

  const goTo = useCallback((n: number, d: 1 | -1) => {
    setI((cur) => {
      if (n === cur) return cur;
      setPrev(cur);
      setDir(d);
      setProgress(0);
      return (n + slides.length) % slides.length;
    });
  }, [slides.length]);

  const next = useCallback(() => goTo((i + 1) % slides.length, 1), [goTo, i, slides.length]);
  const back = useCallback(() => goTo((i - 1 + slides.length) % slides.length, -1), [goTo, i, slides.length]);

  // autoplay + progress
  useEffect(() => {
    if (paused || reduced) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = (t - t0) / AUTOPLAY;
      setProgress(Math.min(1, p));
      if (p >= 1) { next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, paused, reduced, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), 1000);
    return () => window.clearTimeout(id);
  }, [prev]);

  const s = slides[i];
  const px = pointer.x, py = pointer.y;

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setPointer({ x: 0, y: 0 }); }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPointer({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
      }}
      onPointerDown={(e) => { dragX.current = e.clientX; }}
      onPointerUp={(e) => {
        if (dragX.current === null) return;
        const d = e.clientX - dragX.current;
        if (Math.abs(d) > 60) (d < 0 ? next() : back());
        dragX.current = null;
      }}
      style={{
        position: "relative",
        minHeight: "94vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        background: "#02030A",
        userSelect: "none",
      }}
    >
      {/* lapisan gambar */}
      {slides.map((sl, idx) => {
        const active = idx === i;
        const leaving = idx === prev;
        if (!active && !leaving) return null;
        return (
          <img
            key={sl.id}
            src={sl.img}
            alt={sl.alt}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              opacity: active ? 0.95 : 0,
              transform: active
                ? `scale(${reduced ? 1.02 : 1.1}) translate(${px * -18}px, ${py * -14}px)`
                : `scale(1.14) translate(${dir * -3}%, 0)`,
              clipPath: active
                ? "polygon(-20% 0, 100% 0, 100% 100%, -20% 100%)"
                : `polygon(${dir > 0 ? "-20% 0, -12% 0, -4% 100%, -20% 100%" : "112% 0, 120% 0, 120% 100%, 104% 100%"})`,
              transition: reduced
                ? "opacity 400ms linear"
                : "opacity 1100ms cubic-bezier(.16,1,.3,1), transform 9000ms linear, clip-path 1000ms cubic-bezier(.7,0,.2,1)",
              filter: "saturate(1.08) contrast(1.05)",
            }}
          />
        );
      })}

      {/* gradasi + grid HUD + grain */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(92deg, rgba(2,3,10,0.95) 0%, rgba(2,3,10,0.62) 44%, rgba(2,3,10,0.30) 70%, rgba(2,3,10,0.9) 100%), linear-gradient(180deg, rgba(2,3,10,0.7) 0%, transparent 32%, #02030A 100%)" }} />
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.32,
        transform: `translate(${px * 26}px, ${py * 18}px)`,
        transition: "transform 400ms cubic-bezier(.16,1,.3,1)",
        backgroundImage:
          `linear-gradient(${s.neon}14 1px, transparent 1px), linear-gradient(90deg, ${s.neon}14 1px, transparent 1px)`,
        backgroundSize: "78px 78px",
        maskImage: "radial-gradient(120% 90% at 30% 50%, #000 20%, transparent 78%)",
      }} />
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.16,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
      }} />

      {/* bracket sudut */}
      {([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([bx, by], k) => (
        <div key={k} aria-hidden style={{
          position: "absolute", width: 44, height: 44, pointerEvents: "none",
          [bx ? "right" : "left"]: 30, [by ? "bottom" : "top"]: 96,
          borderTop: by ? "none" : `1px solid ${s.neon}88`,
          borderBottom: by ? `1px solid ${s.neon}88` : "none",
          borderLeft: bx ? "none" : `1px solid ${s.neon}88`,
          borderRight: bx ? `1px solid ${s.neon}88` : "none",
          boxShadow: `0 0 22px -6px ${s.neon}`,
          transition: "border-color 700ms ease",
          animation: reduced ? undefined : `heroBracket 900ms cubic-bezier(.16,1,.3,1)`,
        } as React.CSSProperties} />
      ))}

      {/* konten */}
      <div
        key={s.id}
        style={{
          position: "relative", zIndex: 3, maxWidth: 780,
          padding: "0 clamp(24px, 5vw, 76px)",
          transform: `translate(${px * 12}px, ${py * 8}px)`,
          transition: "transform 500ms cubic-bezier(.16,1,.3,1)",
        }}
      >
        {[
          <div key="k" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 34, height: 1, background: s.neon, boxShadow: `0 0 14px ${s.neon}` }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.34em", color: s.neon, textTransform: "uppercase" }}>{s.kicker}</span>
          </div>,
          <h1 key="t" style={{ margin: "22px 0 0", fontWeight: 200, fontSize: "clamp(42px,7.2vw,96px)", lineHeight: 0.95, letterSpacing: "-0.045em", color: "#ECEFF4" }}>
            {s.title}<br />
            <span style={{ fontWeight: 500, color: s.neon, textShadow: `0 0 46px ${s.neon}55` }}>{s.accentTitle}</span>
          </h1>,
          <p key="b" style={{ marginTop: 24, maxWidth: 560, fontSize: 15.5, lineHeight: 1.85, color: "#9AA1B1", textAlign: "justify", hyphens: "auto" }}>{s.body}</p>,
          <div key="m" style={{ marginTop: 30, display: "flex", gap: 26, flexWrap: "wrap" }}>
            {s.meta.map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.26em", color: "#606776", textTransform: "uppercase" }}>{k}</div>
                <div style={{ marginTop: 5, fontSize: 20, fontWeight: 300, color: "#ECEFF4" }}>{v}</div>
              </div>
            ))}
          </div>,
          <div key="c" style={{ marginTop: 34, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={s.onGo}
              style={{
                padding: "15px 30px", borderRadius: 2, cursor: "pointer",
                background: `linear-gradient(180deg, ${s.neon}22, rgba(2,3,10,0.6))`,
                border: `1px solid ${s.neon}`, color: s.neon,
                fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                boxShadow: `0 0 40px -14px ${s.neon}, inset 0 0 24px -14px ${s.neon}`,
                transition: "transform 200ms ease, box-shadow 240ms ease",
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 0 60px -12px ${s.neon}, inset 0 0 34px -12px ${s.neon}`; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 0 40px -14px ${s.neon}, inset 0 0 24px -14px ${s.neon}`; }}
            >{s.cta} →</button>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#4A5162", textTransform: "uppercase" }}>{s.credit}</span>
          </div>,
        ].map((el, k) => (
          <div key={k} style={{
            animation: reduced ? undefined : `heroLine 760ms cubic-bezier(.16,1,.3,1) ${k * 70}ms both`,
          }}>{el}</div>
        ))}
      </div>

      {/* rail bawah */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 4,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "linear-gradient(180deg, rgba(2,3,10,0.4), rgba(2,3,10,0.86))",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
          <div style={{
            height: "100%", width: `${progress * 100}%`, background: s.neon,
            boxShadow: `0 0 16px ${s.neon}`, transition: paused ? "none" : "width 90ms linear",
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "stretch", overflowX: "auto" }}>
          {slides.map((sl, idx) => {
            const on = idx === i;
            return (
              <button
                key={sl.id}
                onClick={() => goTo(idx, idx > i ? 1 : -1)}
                style={{
                  flex: "1 1 0", minWidth: 150, textAlign: "left", cursor: "pointer",
                  display: "flex", gap: 12, alignItems: "center",
                  padding: "13px 18px", background: on ? `linear-gradient(180deg, ${sl.neon}14, transparent)` : "transparent",
                  border: "none", borderLeft: "1px solid rgba(255,255,255,0.06)",
                  borderTop: `2px solid ${on ? sl.neon : "transparent"}`,
                  transition: "background 300ms ease, border-color 300ms ease",
                }}
              >
                <img src={sl.img} alt="" style={{
                  width: 46, height: 30, objectFit: "cover", borderRadius: 2,
                  opacity: on ? 1 : 0.45, filter: on ? "none" : "grayscale(0.7)",
                  boxShadow: on ? `0 0 18px -6px ${sl.neon}` : "none", transition: "all 300ms ease",
                }} />
                <span>
                  <span style={{ display: "block", fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.26em", color: on ? sl.neon : "#606776" }}>
                    {String(idx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </span>
                  <span style={{ display: "block", marginTop: 3, fontSize: 12, color: on ? "#ECEFF4" : "#8A91A1", letterSpacing: "0.02em" }}>
                    {sl.accentTitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes heroLine {
          from { opacity: 0; transform: translateY(14px); filter: blur(7px); }
          to   { opacity: 1; transform: none;             filter: blur(0);   }
        }
        @keyframes heroBracket {
          from { opacity: 0; transform: scale(1.6); }
          to   { opacity: 1; transform: scale(1);   }
        }
      `}</style>
    </section>
  );
}
