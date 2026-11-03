# Ekstensi Settings + UI Info + Background Semesta Baru + Formasi Seimbang

## 1. Settings ramah pengguna (src/components/shell/SettingsPanel.tsx + src/lib/store.ts)

UI settings dirombak jadi interaktif dan animatif:

- **Navigasi tab animatif**: indikator tab bergeser halus (framer-motion `layoutId`), konten tab fade/slide saat pindah, header panel dengan aurora gradient halus.
- **Keterangan detail saat ditekan**: tiap baris setting dapat tombol "i" kecil; saat ditekan muncul popover/expand dengan penjelasan lengkap (bukan hint sebaris). Popover animasi scale/fade.
- **Kontrol baru**: toggle switch dengan spring, slider dengan nilai live & track bercahaya, pill pilihan dengan highlight bergeser.
- **Setting dibedakan per dimensi** (tampil otomatis sesuai mode graf aktif, tetap bisa dilihat semua lewat sub-tab):
  - **3D**: sensitivitas zoom/rotasi/pan, auto-rotate, damping, bloom, star size, sebaran formasi (baru), tone warna, nebula opacity, mode tautan.
  - **2D**: sorot tetangga, chain drag, label, gaya tautan/tolak, paku (obsidian).
  - **Bacaan**: ukuran teks, lebar kolom bacaan, kecepatan auto-slide, toggle mode fokus kalimat (baru; diaplikasikan ke ReadingView).
- Tab lama tetap: Font, Audio/Playlist, Jelajah (rover), A11Y, Performa.

## 2. Grafik berjenjang: dari hemat Android sampai "Cinematic" (store + useDeviceProfile + Universe.tsx)

- Tambah preset kualitas **CINEMATIC** di atas ULTRA (`QualityPreset = low|medium|high|ultra|cinematic`).
- Preset cinemematic (hanya desktop, mobile tetap terkunci "low"):
  - DPR hingga 3, starSegments 64, crustOctaves 7-8, dekorasi latar penuh (lihat poin 3).
  - Post-processing lengkap: Bloom, Chromatic Aberration, Vignette, Noise film halus, SMAA/AA maksimum (`multisampling 8`), Depth of Field ringan.
- Label setting "Grafik" dengan deskripsi tiap tingkat (Rendah = Android hemat … Cinematic = kelas laptop gaming). FPS counter + FPS cap tetap.
- "Rendering lebih luas": kamera far/ fog digeser lebih jauh, skybox radius naik, sebaran dekorasi diperluas ke jarak lebih jauh.

## 3. Background semesta baru (ganti MilkyWaySky pada kualitas medium ke atas)

Komponen baru `src/components/universe/DeepSpaceBackground.tsx` menggantikan skybox foto:

- **Nebula prosedural** berbasis shader (fbm noise di sphere BackSide) — warna ungu-biru-amber, drift sangat pelan, resolusi langkah mengikuti preset kualitas.
- **Galaksi-galaksi jauh**: sprite spiral prosedural (canvas texture) di posisi sangat jauh, beberapa miring menabrak.
- **Blackhole** dekoratif di satu sisi jauh: cincin akresi bercahaya (shader ring) + glow gravitasi, tetap jauh dari peta agar tidak mengganggu orientasi.
- **Debu & gugus bintang** parallax bertambah pada quality high/cinematic.
- Mobile/low: tetap memakai skybox foto lama yang ringan (tanpa shader).

## 4. Formasi bintang kembali seimbang (src/lib/graph/build.ts)

- Turunkan `SPREAD` dari 3.05 ke sekitar 2.3–2.4 dan kurangi stretch pada `placeBranch` untuk jarak jauh, supaya bintang tak lagi melenceng jauh dari cluster-nya.
- Radius cluster di `CLUSTERS.dist` dan radius cabang dirapatkan proporsional; bentuk tetap tidak simetris/irregular.
- Tambah setting 3D "Sebaran formasi" (0.7×–1.3×) sebagai multiplier atas SPREAD, default 1.0 = seimbang baru.

## 5. Mode tautan fokus "hanya tautan mereka" (store + Universe.tsx + HoverEdges/FlowEdges)

- Tambah `LinkMode` baru **"focus" (TAUTAN FOKUS)**: saat sebuah bintang utama di subcluster dipilih (mis. domain Ekonomi atau mosi kebijakan), yang terlihat hanya bintang itu + tautan langsungnya; semua garis lain hilang total dan bintang non-tertaut dim mendalam.
- Cocok dipakai dengan mode tree yang ada; keterangan di settings menjelaskan perilakunya.

## 6. UI tab Info diperkuat (src/components/shell/panels/PanelContent.tsx)

- Komponen baru `InfoCard` (expand/collapse animasi framer-motion): tiap bagian info dalam panel bisa ditekan untuk membuka keterangan detail; chevron berotasi, isi naik-halus.
- Bento card diberi aksen animasi (sudut menyala saat terbuka, header berdenyut halus), angka/statistik dianimasikan count-up, progress/risk bar beranimasi saat muncul.
- Diterapkan ke semua tipe panel: mosi, cluster, anggota/klub (ClubPanel), vocab, event, kompetitor.

## Verifikasi

- `bunx tsgo --noEmit` bersih; build hijau (diperiksa lewat build-errors.log).
- Playwright: settings terbuka, tab animatif + popover keterangan bekerja; mode fokus menampilkan hanya tautan node terpilih (cek screenshot 3D); info panel expand/collapse berfungsi; Android viewport (412×915) tetap kualitas low & latar ringan.
- Catatan: rasa visual 3D (glow, kepadatan nebula) tak bisa dinilai dari sandbox CPU — saya beri petunjuk coba di perangkat sendiri.
