Pekerjaan besar dibagi 6 area. Tiap area bisa dijalankan paralel oleh saya tapi tetap dalam satu eksekusi.

## 1. Universe 3D — Bola Volumetrik (bukan kulit tipis)

Saat ini cluster ditaruh di permukaan Fibonacci sphere → terasa "kulit". Yang diminta: satu bola besar yang **menyebar dengan volume**, jadi setiap cluster ibarat lapisan/serpihan dari satu bola raksasa.

- `src/lib/graph/build.ts`:
  - Cluster: tetap Fibonacci sphere tapi dengan **radial jitter** lebar (radius 22–34, bukan fixed 28) → cluster nggak duduk di satu kulit.
  - `placeCloud`: ganti dari "sub-shell tipis" jadi **isi volume bola** (radius 0.25–1.0 dengan distribusi cube-root agar merata di volume), plus klaster anak tetap berorientasi menjauh dari pusat global → kesan bola besar berlapis.
  - Spasi antar cluster diperbesar (min angular 0.6 rad) supaya tag tidak tumpang tindih.
- Tag/label bintang: tambah `pointerEvents: none` + `z-index` di bawah panel UI, dan **clip area canvas** supaya label nggak nembus sidebar/info panel (bukan absolute over body, tapi di dalam container universe).
- Lighting ultra: rim light + falloff agar bintang jauh tetap kelihatan tipis (sesuai permintaan sebelumnya, dirapikan).

## 2. Universe 2D — Theme Genshin Astrolabe (Wheel of Fate)

Rombak total `Universe2D.tsx` agar mirip referensi gambar Genshin:

- Background: gradient ungu-deep `#0b0a24 → #1a1546 → #0a0820` + grid titik-titik kecil di pojok kiri (seperti referensi) + bintang halus.
- Layout: **astrolabe melingkar** — cluster menjadi node di sepanjang **ring konsentris** (3 ring), bukan tersebar acak. Root di pusat dengan ornamen "wheel of fate" (SVG ring + chevron + 11 tick).
- **Rotasi**: ring bisa berputar via drag (rotateZ pada grup), dengan inertia. Klik node = stop rotasi & buka panel.
- Node = lingkaran ber-border tipis perak + ikon domain di tengah (re-use lucide / emoji domain). Garis lengkung tipis menghubungkan ring (bukan polyline lurus).
- HUD kiri-atas: badge `✦ Wheel of Fate · 11 Domain ✦` mirip "Share this page".
- Komet & aurora dihapus untuk 2D Genshin (terlalu noisy untuk theme ini); ganti dengan **partikel bintang halus + ornamen sigil SVG** di belakang.
- File baru: `src/components/universe/WheelOfFate2D.tsx` (komponen astrolabe), `src/assets/genshin-sigil.svg`. `Universe2D.tsx` jadi wrapper yang panggil WheelOfFate2D.

## 3. Settings Panel — Lebih Kaya

`src/components/shell/SettingsPanel.tsx`:

- Tab baru: **Tampilan · Audio · Eksplorasi · Tentang**.
- Tampilan: quality (low/med/ultra), theme 2D (Aurora/Genshin), toggle label, toggle parallax, slider star density.
- **Eksplorasi → "Lihat Semua Rover"**: list semua node tipe `role`/`speaker` (anggota tim/rover) dengan avatar + jump-to. Implementasi sederhana: scan graph nodes, render grid kartu, klik = `select(id)` + close panel.
- Audio: ada (sudah) — tambah toggle "auto-next" & mini visualizer.
- Tentang: versi, credit, link.

## 4. Matter — Konversi Bahasa Indonesia + Ekspansi 1–3 halaman per bab

`src/data/raw/matter.json` (atau setara — saya cek struktur dulu, kalau hardcoded di TS pindah ke JSON).

- Semua bab di-rewrite ke **bahasa Indonesia baku** (boleh keep istilah teknis seperti "moral hazard", "fiat", "burden of proof", "consequentialism").
- Tiap subbab minimal 600–1800 kata (≈1–3 halaman Word) dengan sub-blok:
  - `pengantar` (paragraf naratif)
  - `konsep_inti` (definisi & framework)
  - `argumen_pro` & `argumen_kon` (masing-masing 3–5 poin terurai)
  - `studi_kasus` (1–2 contoh Indonesia/global)
  - `aplikasi_debat` (cara pakai di PRO/OPP)
  - `terms_kunci` (glosarium)
- Konten dari `PART.docx` + 6 BATCH files diintegrasikan: saya parse docx lewat `document--parse_document`, lalu merge ke matter & motions.
- Tipe data `MatterSubBab` di `src/data/types.ts` diperluas dengan field baru di atas (backward compatible — field lama tetap optional).

## 5. Information Panel — UI/UX Modern Interaktif

`src/components/shell/panels/PanelContent.tsx` + `SidePanel.tsx`:

- Layout artikel **majalah modern**: hero header (gradient + kategori chip + judul besar), sticky tab bar (Overview · Konsep · PRO · KON · Studi Kasus · Aplikasi · Glosarium).
- Scroll-spy: tab aktif berubah saat scroll.
- Komponen baru:
  - `MatterArticle.tsx` — render konten panjang dengan typography drop-cap, pull-quote, accordion sub-section, callout box, mini-infographic.
  - `TermsGlossary.tsx` — hover tooltip definisi.
  - `CaseStudyCard.tsx` — kartu studi kasus dengan ikon + meta.
- Hierarki sidebar (`Sidebar.tsx`) diperbaiki: Domain (huruf besar + ikon kotak) → Sub-domain (indent + ikon kecil) → Bab (indent lebih + dot) → Leaf (indent paling dalam + dot kecil + warna muted). Beda background per tier.
- Z-index: panel info dipastikan **di atas tag bintang** (z-50, tag z-10).

## 6. Easter Egg Simeone — Kotak Foto Besar & Jelas

`src/components/panels/SimeoneEgg.tsx`:

- Ganti dari sticker melayang → **frame kotak (180×220px)** dengan border tebal perak + caption "EL CHOLO · HARAMDEBATE ICON", foto Simeone di-cover full frame (object-fit cover), shadow dramatic, sedikit tilt -4°. Muncul hanya di section HaramDebate (sudah).

## 7. Compatibility — GitHub / Netlify / Vercel

Project ini TanStack Start (Cloudflare Worker default). Agar deploy di Netlify/Vercel/static juga jalan:

- Tidak ada perubahan runtime — pastikan tidak ada hard-import `process.env.*` di client bundle.
- Audit `src/lib/*.server.ts` agar hanya diimport dari handler/server-only paths.
- README tambah catatan deploy (Node 20+, build command `bun run build`, output `dist/`).
- Tidak ada secret yang dibutuhkan untuk runtime client.

## Pertanyaan yang perlu dijawab user setelah plan ini

Saya akan tetap eksekusi default, tapi ada 2 hal yang akan saya tanyakan setelah plan disetujui (lewat ask_questions):
1. Foto Simeone — pakai foto upload sebelumnya, atau generate baru gaya potret hitam-putih dramatis?
2. Theme 2D — Genshin Astrolabe jadi **default** atau opt-in (toggle di Settings)?

## File yang akan disentuh

Edit: `src/lib/graph/build.ts`, `src/components/universe/Universe.tsx`, `src/components/universe/Universe2D.tsx`, `src/components/universe/MilkyWaySky.tsx`, `src/components/shell/SettingsPanel.tsx`, `src/components/shell/Sidebar.tsx`, `src/components/shell/SidePanel.tsx`, `src/components/shell/panels/PanelContent.tsx`, `src/components/panels/SimeoneEgg.tsx`, `src/data/types.ts`, `src/data/raw/matter.*`, `src/data/raw/motions.json`, `src/lib/store.ts`.

Baru: `src/components/universe/WheelOfFate2D.tsx`, `src/components/panels/MatterArticle.tsx`, `src/components/panels/TermsGlossary.tsx`, `src/components/panels/CaseStudyCard.tsx`, `src/components/panels/RoverGallery.tsx`, `scripts/import-batch-all.mjs`, `src/assets/genshin-sigil.svg`.

Estimasi besar — eksekusi dalam 1 run penuh setelah disetujui.
