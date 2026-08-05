## v1.4 — Pencahayaan realistis, formasi kulit bola, lobby profesional, mosi bullet

### 1. Pencahayaan: terang wajar, tetap realistis

Sekarang terlalu gelap (exposure 0.55, ambient 0.05, fog `#01020a`).

- Exposure naik ke ~0.95, ambient ke ~0.18 dengan sedikit fill light dingin/hangat agar ada kedalaman.
- Bloom: threshold turun ke ~0.28 supaya bintang benar-benar bersinar, radius sedikit lebih lembut (bukan silau putih).
- Fog dimundurkan (mulai lebih jauh) agar node jauh tidak lenyap total; latar tetap hitam-biru pekat.
- Bintang: emissive dinaikkan, halo lebih halus, node redup tidak turun sampai hilang (dim floor dinaikkan).
- Nebula/Milky Way: opacity dikurangi ~25–30% agar tidak menutupi bintang.

### 2. Formasi: kulit bola tak sempurna (bukan piringan spiral)

```text
   SEKARANG (piringan)          TARGET (shell bergelombang)
      ·:•:◉:•:·                    ·   ·  ·   ·   ·
    pipih, terlihat 2D           ·  ·  ◉   ·  ·   ·
                                  ·   ·   ·  ·   ·
                                 titik menempel di kulit
                                 bola, radius di-noise
```

- `placeCloud` diganti `placeShell()`: titik disebar merata (fibonacci/blue-noise) pada permukaan bola cluster, lalu radius dimodulasi noise (±18%) sehingga permukaannya bergelombang — tidak sempurna, tetap terasa 3D.
- Jarak antar-titik dijaga (relaksasi minimum separation) agar menyebar dan tidak menumpuk.
- Sedikit isian di dalam (10–15% node ditarik ke radius lebih dalam) supaya tidak terlihat seperti cangkang kosong.
- Cek tabrakan antar-cluster tetap dipertahankan; deterministik.

### 3. Animasi tautan: transfer data

- `FlowEdges` disempurnakan: paket cahaya terlihat jelas berjalan induk → anak dengan kepala terang + ekor memudar, kecepatan mengikuti kedalaman, dan garis dasar sedikit lebih tegas (tidak nyaris tak terlihat).
- Saat node dipilih: paket di jalur aktif dipercepat dan lebih terang; garis lain redup tapi masih terbaca.

### 4. Lobby: gambar realistis + diagram profesional

- Ganti semua gambar AI (`nebula-gold`, `constellation`, `debate-stage`, `mission-control`, `lexicon`, `planet-hero`) dengan foto NASA/ESA asli 4K (arsip NASA Images, sama seperti slider hero). File AI lama dihapus.
- **Ganti bagian "distribusi stance"** dengan **komposisi jenis mosi**: persentase tiap jenis (kebijakan, nilai, aktor, kausalitas, kompetitif, hibrid…) dalam bentuk:
  - donut chart persentase + legenda angka,
  - bar horizontal terurut dengan label persen,
  - garis tren kesulitan/keseimbangan pro-kon per jenis.
- Di bawah tiap diagram ditambahkan paragraf penjelas ringkas (apa artinya, cara membaca, implikasi latihan) supaya lobby terasa seperti laporan profesional, bukan hiasan.
- Rapikan UI: spasi konsisten, tipografi berjenjang, kartu dengan border tipis + hover halus, semua teks rata kanan-kiri di blok panjang.

### 5. Mosi: konten lebih mudah dicerna (bullet)

Sisa kapasitas dipakai untuk memperluas isi mosi:

- Setiap poin PRO/KON ditulis sebagai bullet pendek berjenjang: klaim → mekanisme → dampak → contoh, bukan paragraf panjang.
- Ringkasan atas tiap mosi: 4–6 bullet "inti yang harus diingat".
- Case (Ideal/Mayor/Minor/Niche) dan rotasi ofensif/defensif juga dipecah jadi bullet dengan label tebal.
- Istilah asing tetap tertaut ke kamus.

### Teknis
- `src/lib/graph/build.ts`: `placeShell()` menggantikan `placeCloud()` (API sama), plus relaksasi separasi.
- `src/components/universe/Universe.tsx`: exposure, ambient/fill, bloom threshold, fog, dim floor, opacity nebula.
- `src/components/universe/FlowEdges.tsx`: shader paket (head+tail), kecepatan per-depth.
- `src/components/lobby/MissionControl.tsx`: bagian diagram jenis mosi + teks penjelas; aset foto baru di `src/assets/lobby/` via `lovable-assets`.
- Komponen chart kecil baru: `src/components/panels/infographic/Donut.tsx`, `TrendLine.tsx`.
- `src/lib/motion/enrich.ts` + `PanelContent.tsx`: keluaran berbentuk bullet.
