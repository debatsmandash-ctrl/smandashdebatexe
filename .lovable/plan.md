# Debate Star Universe — Major Upgrade v0.9 → v1.0 "Mission Control"

Ringkas: buang mode 2D, redesign layout galaksi 3D jadi blobby cluster sphere yang ramah mobile, tambah lobby NASA Mission Control sebelum start, isi panel dengan infografis kaya + chart, dan tambah banyak opsi baru di Settings.

---

## 1 · Universe 3D — Reshape & Low-Graphic Mode

**Hapus total 2D**
- Delete: `Universe2D.tsx`, `WheelOfFate2D.tsx`, toggle `viewMode` & `theme2D` di store dan SettingsPanel
- `index.tsx` selalu render `<Universe />` (3D)

**Blobby cluster sphere layout** (`src/lib/graph/build.ts`)
- Ganti algoritma posisi jadi: tiap domain = 1 gugusan padat (cluster centroid tersebar di permukaan bola non-simetris via 3D simplex-noise deform radius)
- Node dalam domain di-distribusi Poisson-disc dalam radius gugus (kerapatan medium, tidak longgar)
- Domain kecil (mis. Kamus) diperbolehkan menjorok ke ruang kosong antar-gugus lain, tapi jarak minimum antar-node dijaga (no-collision spacing check)
- Bab/Subbab/Mosi/Vocab nested di sekitar centroid domain-nya
- Bentuk keseluruhan: elipsoid ter-deform noise (bukan bola simetris)

**Palet bintang variatif (semua opsi, semua terang)**
- Tambah pool warna: Stellar Classification + Nebula Neon + NASA Hubble + Aurora Mix (~20 warna terang)
- Setiap node dapat warna dari pool berdasar seeded-hash id (deterministic, kecuali override khusus domain color untuk clarity)
- Guard: minimum luminance threshold (tidak boleh gelap)

**Low-Graphic 3D preset (auto mobile)**
- `useDeviceProfile` → deteksi mobile → default quality `low`:
  - Star instanced-mesh count -50%
  - Nebula/bloom off, milkyway skybox low-res
  - Auto-rotate mati, DPR clamp ≤ 1.5
  - Skip HoverEdges animation heavy path
- Setting `quality` tetap bisa override manual

**Hover edges: solid + animasi**
- `HoverEdges.tsx`: hilangkan opsi dashed, semua garis solid (`dashed={false}` hardcoded, lineWidth naik)
- Tambah animasi: shader flow (gradient stroke bergerak dari source→target) atau opacity pulse 0.5→1.0 loop, plus fade-in saat mount
- Ujung garis dapat glow dot kecil

---

## 2 · Link Visibility Modes (Settings baru)

Tambah 3 mode di Settings > Tampilan:
1. **NORMAL** — hover/klik node = tampilkan tautan node itu + redup selebihnya (current behavior)
2. **FULL TREE** — klik domain = highlight seluruh rantai bab→subbab→mosi/kamus sampai leaf terakhir. Toggle hover on/off khusus mode ini
3. **SHOW ALL** — semua link edges + label domain selalu tampil (perf warning ditampilkan)

Implementasi: state `linkMode: 'normal' | 'tree' | 'all'` di store, HoverEdges + Universe cek mode ini untuk decide render set.

---

## 3 · Info Panels — Infografis Kaya

**Rombak `SidePanel.tsx` + `PanelContent.tsx`**
- Layout kotak-kotak unik: bento grid dengan mixed sizes, border neon subtle, corner brackets ala HUD
- Text `text-align: justify` (rata kanan kiri) sesuai request, hyphenation on
- Setiap panel node punya sections:
  - **Overview interaktif**: header dengan mini-stats (jumlah edge, cluster, weight), tag chips clickable → filter/jump
  - **Extended matter**: expand semua konten mosi & matter (context, pro/kon lengkap, terms, ideal case, research links) dari data raw. Section dapat collapsible + progress read indicator
  - **Related stars**: grid card node terkait (klik = navigate)
  - **Chart mini**: per node relevan (mis. mosi → radar strength pro/kon; role → radar skills; domain → sunburst subtree)
- Animasi: fade-in stagger children, hover lift halus, section transition smooth

**Data extension**
- Audit `src/data/raw/*.json`, tarik semua field yang saat ini tidak ditampilkan (terms, research, ctx-multi, ideal cases)
- Jika ada batch mosi baru yang belum di-ingest (BATCH-04/05/06 dari upload), TIDAK di-scope di plan ini — kabari user terpisah bila mau

---

## 4 · NASA Mission Control Lobby (baru)

Flow: **Cinematic Intro (3-4s) → Mission Control Lobby → tombol INITIATE → fade ke Universe**

**Cinematic Intro** (`components/lobby/Intro.tsx`)
- Countdown "T-3 … T-2 … T-1 … IGNITION" dengan SFX, logo SMANDASH Debate sweep in
- Skip-able (klik/tap)

**Mission Control Lobby** (`components/lobby/MissionControl.tsx`)
- Full-page dark tech UI, grid modular ala NASA JPL dashboard
- Panel-panel:
  - **HUD Telemetry**: jam UTC live, "MISSION STATUS: NOMINAL", uptime session
  - **Stats live**: total nodes / edges / domains / mosi / vocab (dari graph)
  - **Sunburst chart** distribusi node per-domain (interactive, klik = pre-select saat masuk universe)
  - **Bar chart** mosi per kategori
  - **Heatmap** tautan antar-domain
  - **Mission Cards** per domain (klik = deep-link masuk universe fokus ke domain itu)
  - **Playlist widget** compact
  - **Tombol besar**: `[ INITIATE UNIVERSE ]` + `[ SETTINGS ]` + `[ ABOUT ]`
- Charts pakai Recharts (sudah ada di project), style custom dark neon
- Route: `/` = Lobby, `/universe` = 3D scene (atau state-based di homepage; final call saat build)

**Kembali ke lobby**: tombol kecil "◄ MISSION CONTROL" di sidebar Universe

---

## 5 · Settings Panel — Expand

**Tab Tampilan** — tambah:
- Link visibility mode (normal/tree/all) — lihat §2
- Toggle hover-on-tree
- Solid line thickness slider

**Tab Font** (baru)
- Preset UI font: Default (Bebas+DM Sans), + 6 opsi baru:
  - **Pixel Pack**: Press Start 2P (heading) / VT323 (body)
  - **Genshin Pack**: Cinzel / Cormorant Unicase
  - **NASA-Tech Pack**: Orbitron / Michroma
- Install via `@fontsource/*` packages, tokenize di `styles.css` (`--font-heading`, `--font-body`), swap by preset
- Live preview di setting

**Tab Audio / Playlist**
- Auto-ingest 4 lagu upload baru sebagai asset (`lovable-assets create`):
  - The Internationale (Sovietwave)
  - In The Pool — The Dreamer Piano
  - Solace — Txmy
  - Solas — Jamie Duffy
- Default: **aktif di shuffle** (user boleh matikan)

**Tab Performance**
- Preset `low` default untuk mobile terdeteksi
- Tambah toggle "Disable nebula", "Disable bloom" individual

---

## Technical Notes

**Files baru**
- `src/components/lobby/Intro.tsx`
- `src/components/lobby/MissionControl.tsx`
- `src/components/lobby/charts/{Sunburst,BarMosi,Heatmap}.tsx`
- `src/components/panels/infographic/{BentoSection,MiniRadar,RelatedGrid}.tsx`
- `src/lib/graph/layout-blobby.ts` (algoritma posisi baru)
- `src/lib/fonts.ts` (preset map)

**Files diedit**
- `src/lib/graph/build.ts` (layout call baru + palette)
- `src/lib/store.ts` (state: `linkMode`, `fontPreset`, hapus `viewMode`/`theme2D`, `lobbyDone`)
- `src/components/universe/Universe.tsx` (low-graphic branch)
- `src/components/universe/HoverEdges.tsx` (solid + animasi)
- `src/components/shell/SettingsPanel.tsx` (expand tabs)
- `src/components/shell/{SidePanel,MobileShell}.tsx`, `panels/PanelContent.tsx` (bento redesign)
- `src/routes/index.tsx` (lobby gate)

**Files dihapus**
- `src/components/universe/Universe2D.tsx`
- `src/components/universe/WheelOfFate2D.tsx`

**Packages ditambah**
- `@fontsource/press-start-2p`, `@fontsource/vt323`, `@fontsource/cinzel`, `@fontsource/cormorant-unicase`, `@fontsource/orbitron`, `@fontsource/michroma`
- `simplex-noise` (untuk layout deform) — kalau belum ada
- Recharts sudah ada, no add

**Assets ditambah** (lovable-assets)
- 4 MP3 baru → `src/assets/audio/*.mp3.asset.json`

---

## Scope Guardrails

- TIDAK ingest BATCH mosi baru dari file txt upload (perlu konfirmasi terpisah — bisa jadi task lanjutan)
- TIDAK ubah auth/backend (belum ada)
- TIDAK refactor data schema, hanya extend rendering
- Kompatibilitas mobile: uji manual di viewport 375×667 setelah build

---

## Estimasi Urutan Build
1. Hapus 2D + palette + blobby layout + HoverEdges solid-anim (foundation)
2. Ingest lagu baru + font packs + Settings expansion
3. Panel infografis + charts
4. Lobby (intro + Mission Control) + gating flow
5. QA mobile + perf pass

Kalau plan ini oke, klik **Implement** dan aku mulai dari step 1.