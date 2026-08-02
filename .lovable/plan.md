## v1.3 — Prioritas: UI/UX Lobby + Universe (baru setelah itu isi mosi)

### 1. Lobby: slider sinematik dark-neon (bukan carousel generik)

Hero diganti **stage slider 5 slide** dengan gambar NASA/ESA public domain 4K asli (Hubble/JWST/APOD, diunduh dari NASA Images API — bukan AI).

```text
┌──────────────────────────────────────────────────────────────┐
│  ◉ LIVE   SMANDASH DEBATE UNIVERSE           20:14:03 WIB    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [ Ken Burns pan, 12s ]      ◤ neon scanline overlay ◢      │
│                                                              │
│   01 / 05  ── MATTER ──────────────────────────              │
│   PETA PENGETAHUAN                                           │
│   15 domain · 240+ subbab                    [ MASUK → ]     │
│                                                              │
│   ▌▌▌▌▌▌▌▌▌▌░░░░░░░░  progress bar neon (auto 7s)            │
│   ●━━━━  ○  ○  ○  ○   thumbnail rail (hover = preview kecil) │
└──────────────────────────────────────────────────────────────┘
```

- Transisi crossfade + wipe diagonal (clip-path), teks masuk per-baris stagger 60 ms blur→sharp.
- Ken Burns 1.0→1.08, parallax kursor tiga lapis (gambar / teks / grid HUD).
- Neon: garis aksen glow, grid HUD tipis, grain halus, bracket sudut beranimasi tiap ganti slide.
- Autoplay 7 s + progress, pause on hover, drag/swipe, keyboard ←/→, hormati `prefers-reduced-motion`.
- Tiap slide CTA mendarat langsung ke cluster terkait.
- Kartu-kartu lain di lobby dinaikkan: border gradien neon, glow hover, angka telemetri monospace.

### 2. Universe 3D: formasi galaksi per cluster + pencahayaan realistis

```text
   TAMPAK ATAS (per cluster)          TAMPAK SAMPING
        .  ·   ·                       ·  ····•····  ·
     ·  ·:•:·..  ·                    ····•••◉•••····
   · .:•:◉ hub  ·:·  ·      →          ·  ····•····  ·
     · ·:·..·:•· ·                    tebal di inti, tipis di tepi
        ·   ·  ·                      (piringan, bukan bola)
```

- Cakram spiral logaritmik 2 lengan per cluster, kerapatan menurun ke tepi, ketebalan profil sech².
- Tiap cakram miring berbeda; keseluruhan tetap bola besar tak simetris. Cluster tipis (kamus) diberi radius lebih besar untuk mengisi volume, dengan cek tabrakan antar-cluster. Deterministik.
- **Reduce lighting**: ambient/fill diturunkan drastis, bloom lebih selektif (threshold naik), latar benar-benar hitam pekat, bintang jadi sumber cahaya sendiri (emissive + halo kecil), kontras tinggi seperti foto luar angkasa asli. Nebula dibuat lebih redup dan tipis.

### 3. Garis penghubung & mode Full Tree

- Semua garis utama (bukan hanya hover) mendapat animasi aliran: paket cahaya berjalan sepanjang garis lurus, kecepatan mengikuti kedalaman hierarki, opasitas berdenyut halus.
- **Full Tree dua arah**: menekan node leaf menyalakan jalur balik leaf → induk → hub → pusat dengan animasi rambat, persis seperti arah pusat → leaf. Node di jalur ikut menyala; sisanya redup.
- Garis yang sudah tampil di pass utama tidak digambar ulang saat hover (tetap seperti sekarang).

### 4. Navigasi: tombol Next & Undo

Kontrol melayang di universe:

```text
   [ ↩ UNDO ]  [ ● node saat ini ]  [ NEXT ↪ ]     [ ⌂ pusat ]
```

- **Undo** kembali ke node sebelumnya (riwayat kunjungan, juga bisa `Alt+←` / tombol back browser).
- **Next** melompat ke node berikutnya secara berurutan dalam cluster/level yang sama (sibling → anak pertama), jadi tidak perlu balik ke pusat.
- Riwayat disimpan di store; tombol nonaktif saat tidak tersedia.

### 5. UI di dalam universe (dua panel kanan-kiri, saat ini terlalu datar)

- Sidebar kiri: indikator garis neon aktif, label meluncur saat hover, section collapsible, mini-sparkline jumlah node.
- Panel kanan: header sticky dengan breadcrumb + progress baca, layer kaca (blur + border gradien + inner glow), tab bergaris neon, kartu bento bersudut bracket, konten masuk bertahap.
- Buka/tutup panel: slide + scale halus.

### 6. Font: dipangkas jadi 4 dan diverifikasi

DEFAULT (Bebas + DM Sans) · PIXEL (Press Start 2P + VT323) · GENSHIN (Cinzel + Cormorant Unicase) · NASA (Orbitron + Michroma). Dua preset campuran dihapus; ukuran/leading disetel per preset agar panel panjang tetap terbaca, dan tiap preset dicek langsung di preview.

### 7. Mesin analisis mosi (setelah UI beres)

Semua 142 mosi otomatis mendapat: header tipe/konteks + **PRO __% / KON __%**, chip istilah kunci yang membuka kamus, tabel 10 poin PRO dan 10 poin KON (Tier S/A/B/C · Kekuatan% · Risiko% · Kausalitas), empat case (Ideal/Mayor/Minor/Niche + catatan risiko), rotasi Ofensif & Defensif (P1/P2/P3 + risiko) yang dipilih otomatis dari probabilitas, serta tabel riset & literasi. Selanjutnya kamu tunjuk batch mosi yang dinaikkan jadi tulisan tangan; data manual menimpa keluaran mesin.

### Teknis
- `src/lib/graph/build.ts`: `placeDisc()` / `placeSpiralArm()` menggantikan `placeCloud` untuk cluster besar.
- Pencahayaan & bloom diatur di `Universe.tsx` + `useDeviceProfile.ts` (preset ultra tetap, tapi eksposur turun).
- `HoverEdges.tsx` diperluas jadi renderer garis beranimasi untuk pass utama; jalur balik leaf→pusat lewat BFS di store.
- Store: `history[]`, `historyIndex`, aksi `goBack()` / `goNext()`.
- Komponen baru: `lobby/HeroSlider.tsx`, `universe/NavControls.tsx`, `panels/motion/DossierTable.tsx`, `CaseStack.tsx`, `RotationTimeline.tsx`, `src/lib/motion/analysis.ts`.
- Gambar NASA diunduh ke `src/assets/lobby/`, diekternalisasi via `lovable-assets`; aset AI lama dihapus.
