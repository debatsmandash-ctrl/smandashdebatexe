import { useMemo, useState } from "react";
import { useUniverse, useSettings, type QualityPreset, type FpsCap, type LinkMode } from "@/lib/store";
import { TRACKS, DEFAULT_ENABLED_TRACKS } from "@/lib/playlist";
import { buildGraph } from "@/lib/graph/build";
import { FONT_PRESETS, applyFontPreset, type FontPreset } from "@/lib/fonts";


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.3em", color: "#a855f7", marginBottom: 10, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "DM Sans", fontSize: 12, color: "#cbd5e1" }}>{label}</span>
        {children}
      </div>
      {hint && <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#5a6f8a", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "4px 10px", fontSize: 11, fontFamily: "Space Mono", letterSpacing: "0.1em",
        background: active ? "rgba(168,85,247,0.18)" : "transparent",
        border: `1px solid ${active ? "#a855f7" : "rgba(168,85,247,0.25)"}`,
        color: active ? "#e8f4ff" : "#8ba3c0", borderRadius: 4, cursor: "pointer",
      }}>{children}</button>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: 130, accentColor: "#a855f7" }} />
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{
        width: 38, height: 20, borderRadius: 99, position: "relative", cursor: "pointer",
        background: value ? "rgba(0,255,200,0.35)" : "rgba(168,85,247,0.15)",
        border: `1px solid ${value ? "#00ffc8" : "rgba(168,85,247,0.3)"}`,
      }}>
      <span style={{
        position: "absolute", top: 1, left: value ? 18 : 1, width: 16, height: 16, borderRadius: 99,
        background: value ? "#00ffc8" : "#a855f7", transition: "left 150ms",
      }} />
    </button>
  );
}

export function SettingsPanel() {
  const open = useUniverse((s) => s.settingsOpen);
  const setOpen = useUniverse((s) => s.setSettingsOpen);
  const s = useSettings();
  const update = useSettings((st) => st.update);
  const reset = useSettings((st) => st.reset);
  const [tab, setTab] = useState<"display" | "links" | "performance" | "audio" | "font" | "explore" | "access">("display");
  const graph = useMemo(() => buildGraph(), []);
  const select = useUniverse((st) => st.select);
  const rovers = useMemo(() => {
    return graph.nodes.filter((n) =>
      n.kind === "role" || n.kind === "speaker" ||
      (n.cluster === "active_member" && (n.kind === "domain" || n.kind === "subbab" || n.kind === "bab"))
    );
  }, [graph]);


  if (!open) return null;

  const trackMap = { ...DEFAULT_ENABLED_TRACKS, ...s.enabledTracks };

  return (
    <>
      <div onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50 }} />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 94vw)", zIndex: 51,
          background: "linear-gradient(180deg, rgba(8,13,24,0.98), rgba(5,8,15,0.96))",
          borderLeft: "1px solid rgba(168,85,247,0.25)",
          backdropFilter: "blur(16px)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(168,85,247,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: "0.18em", color: "#e8f4ff" }}>SETTINGS</div>
            <div style={{ fontFamily: "Space Mono", fontSize: 8, letterSpacing: "0.3em", color: "#5a6f8a", marginTop: 2 }}>DISPLAY · LINKS · FONT · PERF · AUDIO · A11Y</div>
          </div>
          <button onClick={() => setOpen(false)}
            style={{ width: 30, height: 30, background: "transparent", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", cursor: "pointer", borderRadius: 4 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "0 12px", borderBottom: "1px solid rgba(168,85,247,0.12)", gap: 2, overflowX: "auto" }}>
          {([
            ["display", "TAMPILAN"],
            ["links", "TAUTAN"],
            ["font", "FONT"],
            ["performance", "PERF"],
            ["audio", "AUDIO"],
            ["explore", "JELAJAH"],
            ["access", "A11Y"],
          ] as const).map(([k, label]) => (

            <button key={k} onClick={() => setTab(k)}
              style={{
                flex: "0 0 auto", padding: "10px 10px", background: "transparent",
                border: "none", borderBottom: `2px solid ${tab === k ? "#a855f7" : "transparent"}`,
                color: tab === k ? "#e8f4ff" : "#5a6f8a", cursor: "pointer",
                fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.2em", whiteSpace: "nowrap",
              }}>{label}</button>
          ))}
        </div>

        <div className="panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {tab === "display" && (<>
          <Section title="Visual">
            <Row label={`Bloom ${s.bloomIntensity.toFixed(2)}`}>
              <Slider value={s.bloomIntensity} min={0} max={1.5} step={0.05} onChange={(v) => update({ bloomIntensity: v })} />
            </Row>
            <Row label={`Nebula opacity ${s.nebulaOpacity.toFixed(2)}`}>
              <Slider value={s.nebulaOpacity} min={0} max={1.2} step={0.05} onChange={(v) => update({ nebulaOpacity: v })} />
            </Row>
            <Row label={`Star size ×${s.starSize.toFixed(2)}`}>
              <Slider value={s.starSize} min={0.5} max={1.6} step={0.05} onChange={(v) => update({ starSize: v })} />
            </Row>
            <Row label={`Edge thickness ${s.edgeThickness.toFixed(1)}`} hint="Ketebalan garis hover (solid, tanpa dashed)">
              <Slider value={s.edgeThickness} min={1} max={4} step={0.1} onChange={(v) => update({ edgeThickness: v })} />
            </Row>
          </Section>
          <Section title="Camera">
            <Row label="Auto-rotate"><Toggle value={s.autoRotate} onChange={(v) => update({ autoRotate: v })} /></Row>
            <Row label={`Rotate speed ${s.autoRotateSpeed.toFixed(2)}`}>
              <Slider value={s.autoRotateSpeed} min={0.05} max={1.5} step={0.05} onChange={(v) => update({ autoRotateSpeed: v })} />
            </Row>
            <Row label={`Damping ${s.damping.toFixed(2)}`}>
              <Slider value={s.damping} min={0.04} max={0.2} step={0.01} onChange={(v) => update({ damping: v })} />
            </Row>
          </Section>
          <Section title="Mobile Layout">
            <Row label="Style" hint="Berlaku di tampilan HP/tablet sentuh">
              <div style={{ display: "flex", gap: 4 }}>
                <Pill active={s.mobileLayout === "sheet"} onClick={() => update({ mobileLayout: "sheet" })}>SHEET</Pill>
                <Pill active={s.mobileLayout === "pills"} onClick={() => update({ mobileLayout: "pills" })}>PILLS</Pill>
              </div>
            </Row>
          </Section>
          </>)}

          {tab === "links" && (<>
          <Section title="Mode Tampilan Tautan">
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "#8ba3c0", lineHeight: 1.6, marginBottom: 6 }}>
              Pilih bagaimana garis-garis penghubung ditampilkan saat menjelajah semesta.
            </div>
            {([
              ["normal", "NORMAL", "Hover/klik satu bintang → tampil tautan-nya saja. Lain redup."],
              ["tree",   "FULL TREE", "Klik domain/hub → highlight seluruh rantai turunan sampai leaf."],
              ["all",    "SHOW ALL", "Semua garis tampil sekaligus. Berat — cocok untuk audit."],
            ] as const).map(([k, label, hint]) => (
              <Row key={k} label={label} hint={hint}>
                <Pill active={s.linkMode === (k as LinkMode)} onClick={() => update({ linkMode: k as LinkMode })}>PILIH</Pill>
              </Row>
            ))}
          </Section>
          <Section title="Hover">
            <Row label="Tampilkan hover edges" hint="Matikan bila tidak ingin garis muncul saat hover">
              <Toggle value={s.showHoverEdges} onChange={(v) => update({ showHoverEdges: v })} />
            </Row>
            <Row label="Hover di mode FULL TREE" hint="Nyalakan agar hover tetap aktif pada mode tree">
              <Toggle value={s.treeHoverEnabled} onChange={(v) => update({ treeHoverEnabled: v })} />
            </Row>
          </Section>
          </>)}

          {tab === "font" && (<>
          <Section title="Font Preset">
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "#8ba3c0", marginBottom: 8, lineHeight: 1.6 }}>
              Ganti keseluruhan tampilan teks. Efek langsung ke seluruh UI.
            </div>
            {FONT_PRESETS.map((p) => {
              const active = s.fontPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { update({ fontPreset: p.id as FontPreset }); applyFontPreset(p.id as FontPreset); }}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    background: active ? "rgba(168,85,247,0.14)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${active ? "#a855f7" : "rgba(168,85,247,0.2)"}`,
                    borderLeft: `3px solid ${active ? "#00ffc8" : "#a855f7"}`,
                    color: "#e8f4ff", cursor: "pointer", borderRadius: 4,
                  }}
                >
                  <div style={{ fontFamily: p.display, fontSize: 16, letterSpacing: "0.08em", color: "#e8f4ff" }}>{p.label}</div>
                  <div style={{ fontFamily: p.body, fontSize: 12, color: "#8ba3c0", marginTop: 3 }}>{p.hint} — Aa Bb Cc 123</div>
                </button>
              );
            })}
          </Section>
          </>)}

          {tab === "performance" && (<>
          <Section title="Performance">
            <Row label="Quality preset" hint="LOW = ramah mobile; ULTRA = maksimal desktop">
              <div style={{ display: "flex", gap: 4 }}>
                {(["low","medium","high","ultra"] as QualityPreset[]).map(q => (
                  <Pill key={q} active={s.quality === q} onClick={() => update({ quality: q })}>{q.toUpperCase()}</Pill>
                ))}
              </div>
            </Row>
            <Row label="FPS cap" hint="0 = unlimited (gunakan refresh rate layar)">
              <div style={{ display: "flex", gap: 4 }}>
                {([0,30,60,120] as FpsCap[]).map(f => (
                  <Pill key={f} active={s.fpsCap === f} onClick={() => update({ fpsCap: f })}>{f === 0 ? "∞" : f}</Pill>
                ))}
              </div>
            </Row>
            <Row label="FPS counter"><Toggle value={s.showFps} onChange={(v) => update({ showFps: v })} /></Row>
          </Section>
          </>)}

          {tab === "audio" && (<>
          <Section title="Audio">
            <Row label="Background music"><Toggle value={!s.audioMuted} onChange={(v) => update({ audioMuted: !v })} /></Row>
            <Row label={`Volume ${(s.audioVolume*100).toFixed(0)}%`}>
              <Slider value={s.audioVolume} min={0} max={1} step={0.05} onChange={(v) => update({ audioVolume: v })} />
            </Row>
            <Row label="Play mode">
              <div style={{ display: "flex", gap: 4 }}>
                <Pill active={s.playMode === "shuffle"} onClick={() => update({ playMode: "shuffle" })}>SHUFFLE</Pill>
                <Pill active={s.playMode === "sequential"} onClick={() => update({ playMode: "sequential" })}>URUT</Pill>
              </div>
            </Row>
          </Section>
          <Section title="Playlist">
            <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#5a6f8a", marginBottom: 6 }}>
              Centang lagu yang ingin diputar. Minimum 1 lagu aktif.
            </div>
            {TRACKS.map((t) => {
              const on = trackMap[t.id] !== false;
              const activeCount = TRACKS.filter((x) => trackMap[x.id] !== false).length;
              const canDisable = activeCount > 1 || !on;
              return (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: 4, gap: 8,
                  background: on ? "rgba(0,255,200,0.06)" : "transparent",
                  border: `1px solid ${on ? "rgba(0,255,200,0.25)" : "rgba(168,85,247,0.15)"}`,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "DM Sans", fontSize: 12, color: on ? "#e8f4ff" : "#8ba3c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#5a6f8a" }}>{t.artist}</div>
                  </div>
                  <Toggle
                    value={on}
                    onChange={(v) => {
                      if (!v && !canDisable) return;
                      update({ enabledTracks: { ...trackMap, [t.id]: v } });
                    }}
                  />
                </div>
              );
            })}
          </Section>
          </>)}

          {tab === "explore" && (<>
          <Section title={`Semua Rover (${rovers.length})`}>
            <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "#5a6f8a", marginBottom: 8 }}>
              Daftar lengkap peran & speaker. Klik untuk meluncur ke node-nya di universe.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {rovers.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { select(r.id); setOpen(false); }}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    background: "rgba(168,85,247,0.06)",
                    border: `1px solid ${r.color}55`,
                    borderLeft: `3px solid ${r.color}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    color: "#e8f4ff",
                    fontFamily: "DM Sans",
                    fontSize: 11,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={r.label}
                >
                  <span style={{ color: r.color, marginRight: 6 }}>●</span>
                  {r.label}
                </button>
              ))}
            </div>
          </Section>
          </>)}



          {tab === "access" && (<>
          <Section title="Accessibility">
            <Row label="Reduced motion" hint="Matikan auto-rotate dan animasi transisi">
              <Toggle value={s.reducedMotion} onChange={(v) => update({ reducedMotion: v, autoRotate: v ? false : s.autoRotate })} />
            </Row>
            <Row label="High-contrast labels"><Toggle value={s.highContrastLabels} onChange={(v) => update({ highContrastLabels: v })} /></Row>
          </Section>
          <Section title="Lobby">
            <Row label="Tampilkan Mission Control lagi" hint="Reset gate agar lobby NASA muncul lagi di reload berikut">
              <Pill active={false} onClick={() => { update({ lobbySeen: false }); location.reload(); }}>RESET</Pill>
            </Row>
          </Section>
          </>)}

          <button onClick={() => reset()}
            style={{ width: "100%", padding: "10px", marginTop: 8, background: "transparent",
              border: "1px solid rgba(251,113,133,0.4)", color: "#fb7185", cursor: "pointer", borderRadius: 4,
              fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.2em" }}>
            RESET TO DEFAULTS
          </button>
        </div>
      </aside>
    </>
  );
}
