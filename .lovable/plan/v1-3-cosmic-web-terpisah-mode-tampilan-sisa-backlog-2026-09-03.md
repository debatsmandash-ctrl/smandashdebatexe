# v1.3 — Cosmic Web Terpisah, Mode Tampilan & Sisa Backlog

## 0. Verifikasi dulu

Layout cosmic web dari sesi lalu belum pernah dijalankan. Langkah pertama: jalankan build + preview, baca log error, perbaiki yang muncul sebelum menyentuh fitur baru.

## 1. Formasi bintang — Cosmic Web, cluster terpisah

Arah yang dipilih: **C · Cosmic Web** dengan jarak **campuran + acak deterministik**. Zona supercluster berbasis "wilayah tetap" dihapus; tiap cluster berdiri sendiri.

```text
        ·····●●●●●         void besar
   ●●●●●●●●          ·····●●●●●●●●●●
  ●●●●●●●●●●  ← knot besar (matter)      ●●●●
        ·····                      ●●●●●●●●●●   ← knot motion (jauh, tautan banyak)
   ●●●●   ← cluster kecil (dekat)
                    ●●●   ← pulau niche terpencil
```

- Tiap cluster = 1–3 knot sendiri, tidak dipaksa masuk zona kurikulum/arena/teknik/sistem.
- Jarak dari pusat = fungsi jumlah tautan/anggota cluster + jitter acak deterministik (seed tetap, jadi posisi konsisten tiap muat). Cluster besar cenderung menjauh, tapi tidak berbaris rapi.
- Filamen hanya dibangun di antara cluster yang benar-benar punya relasi (matter↔kamus, motion↔jenis mosi), melengkung ber-noise, dengan void nyata di antaranya.
- Kedalaman Z diacak per cluster agar komposisi tidak pipih.
- Node niche/yatim jadi pulau kecil di pinggiran.

## 2. Tautan "debate universe" dikembalikan

Garis penghubung dari pusat ke tiap supercluster dan turun ke subcluster dihidupkan lagi, dengan panjang bervariasi: cluster dekat = garis pendek tegas, cluster jauh = garis panjang tipis dengan animasi transfer data yang lebih lambat.

## 3. Mode tampilan tautan (Settings)

Empat mode, berlaku di 3D dan 2D:

1. **Bintang saja** — semua garis disembunyikan.
2. **Hover saja** — garis hanya muncul saat node di-hover/diklik.
3. **Full tree saat diklik** — rantai root↔leaf menyala dua arah, sisanya redup.
4. **Semua garis tampil** — semua edge permanen dan redup.

## 4. Tone warna & lighting — dua preset

Dua preset yang bisa dipilih di Settings:

- **Deep Space Realistis** — latar hampir hitam, bintang putih-biru-amber, bloom rendah, kontras tinggi.
- **Neon Teal–Violet** — tone dingin sinematik, glow kuat, gaya tech dashboard.

Preset mengatur: warna ambient/point light, exposure, kekuatan bloom, opasitas nebula, dan palet warna bintang. Berlaku juga untuk warna garis di mode 2D.

## 5. Backlog yang diselesaikan

- **Lobby**: event kedua diganti nama menjadi **INSTINCT**; cover riwayat event memakai foto stok nyata yang relevan (ruang sidang untuk OP 15, kampus/kompetisi untuk INSTINCT, panggung debat untuk LDI), bukan gambar galaksi.
- **Skema event aman**: `brackets` dan `prestasi` dibuat opsional; `cover`, `roster`, `milestones` dibaca di data layer, graph builder, dan panel event.
- **Node 2D**: radius dihitung dari jumlah keturunan — makin banyak percabangan, makin besar bulatannya.
- **Rekomendasi Mosi Menarik** di lobby: kartu mosi Prabowo dan mosi ujian nasional/UTBK, klik langsung ke panel analisis.
- **Konten**: sisa batch mosi diimpor dengan template lengkap; mosi hybrid ditandai dan ditautkan ke dua jenis mosi induknya; lagu baru masuk playlist.
- **Performa & bug**: batas label yang dirender, jeda animasi saat tab tidak aktif, pembersihan error build/runtime, dan pengecekan deploy.

## Detail teknis

- `src/lib/graph/build.ts`: hapus tabel `SUPERCLUSTERS`, ganti dengan penempatan per-cluster berbasis skor tautan + PRNG berseed; `placeCloud` tetap knot/power-law, filamen hanya untuk pasangan cluster berelasi.
- `src/lib/store.ts`: state baru `linkView` ("stars" | "hover" | "tree" | "all") dan `colorPreset` ("deepspace" | "neon"), versi persist dinaikkan.
- `src/components/universe/Universe.tsx`, `FlowEdges.tsx`, `HoverEdges.tsx`: baca `linkView` dan `colorPreset`; parameter lighting/bloom/nebula diturunkan dari preset.
- `src/components/universe/Graph2D.tsx`: hormati `linkView`; radius `r = base * (1 + log2(1 + descendantCount))`.
- `src/data/index.ts` + `event.json` + `PanelContent.tsx`: field event opsional, nama INSTINCT, cover per event.
- Cover baru disimpan sebagai `.asset.json`, bukan biner di repo.
