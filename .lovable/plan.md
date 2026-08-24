# v1.2 — Cosmic Web, Event INSTINCT & Lanjutan Konten

## 1. Redesain sebaran bintang Universe 3D (cosmic web)

Target: intensitas struktur 8/10, void sedang dengan filamen tebal, dan filamen campuran (relasi nyata jadi tulang, leaf padat mengisi kepadatan).

```text
        void          ●●●●●●          void
                    ●●●●●●●●●
   ●●●●●        ··●●●●●●●●●●·······●●●●●●
  ●●●●●●● ······                       ●●●●●●●   ← knot besar (domain inti)
   ●●●●●            void besar            ●●●
        ·····●●●●····                 ·····
             ●●●●     ← subcluster / pulau terpencil
```

Struktur berlapis yang akan dibangun di `placeCloud` + penempatan cluster:

- **Supercluster**: pusat cluster tidak lagi disebar rata di bola fibonacci. Pusat ditarik ke 3–4 wilayah supercluster dengan ukuran dan kepadatan berbeda, sehingga ada domain besar dan domain kecil.
- **Knot & core**: tiap cluster jadi 1–3 knot. Node dengan derajat sambungan tinggi (hub, subhub, domain) menempel ke inti knot; leaf menyebar ke tepi mengikuti kepadatan power-law.
- **Subcluster**: bab, subbab, dan anggota tim yang satu induk membentuk gugus lokal rapat — konstelasi kecil yang terbaca sebagai satu topik.
- **Filamen organik**: jembatan antar cluster yang benar-benar punya relasi (mis. matter↔kamus, motion↔jenis mosi) dibangun sebagai tabung melengkung ber-noise: padat → renggang → padat. Tidak ada garis lurus buatan; jalur ikut membelok dan bercabang.
- **Void**: jarak minimum antar knot dijaga sehingga ada ruang kosong nyata, tapi tidak sampai memisahkan domain ke luar frame awal.
- **Kedalaman 3D**: bobot sumbu Z diacak per supercluster supaya beberapa gugus jauh di belakang, beberapa mendekat ke kamera — komposisi tetap enak dari berbagai sudut, bukan pipih.
- **Pulau terpencil**: node niche/yatim ditaruh di pinggiran sebagai gugus kecil terisolasi.

Semua fungsi tetap: tiap bintang tetap node konten yang bisa diklik, di-hover, dan ditelusuri. Hanya koordinatnya yang berubah.

## 2. Lobby — riwayat event

- Nama event kedua diganti menjadi **INSTINCT** (sebelumnya "Kompetisi Ilmiah Nasional Universitas Riau"); deskripsi tetap menyebut cabang DEBMA & DEBSIS.
- Kartu event memakai **foto stok nyata beresolusi tinggi yang relevan** (ruang sidang/DPR untuk OP 15, suasana kampus/kompetisi ilmiah untuk INSTINCT, panggung debat pelajar untuk LDI) — bukan gambar galaksi, bukan gambar AI. Foto dicari dari sumber bebas pakai (Wikimedia/portal resmi) dan disimpan sebagai Lovable Asset.
- Grid event ditata ulang: cover, tanggal, penyelenggara, sistem, tingkat, dan daftar tim/roster.

## 3. Menyelesaikan pekerjaan yang tertunda

- **Skema event**: `src/data/index.ts`, `build.ts`, dan panel event dibuat toleran terhadap event tanpa `brackets`/`prestasi`, serta membaca `cover`, `roster`, `milestones`. Ini menutup potensi error saat ini.
- **Node 2D berdasarkan hierarki**: radius node di Graph2D dihitung dari jumlah keturunan — makin banyak percabangan, makin besar bulatannya.
- **Rekomendasi mosi di lobby**: blok "Rekomendasi Mosi Menarik" berisi mosi Prabowo dan mosi ujian nasional/UTBK, klik langsung ke panel analisisnya.
- **Mosi & lagu**: sisa batch mosi dari unggahan dimasukkan ke bank mosi dengan template lengkap (probabilitas, 10 poin S/A/B/C, cases, rotasi, riset); lagu baru ditambahkan ke playlist.
- **Performa & bug**: preset kualitas adaptif, batas label yang dirender, jeda animasi saat tab tidak aktif, dan pembersihan error build/runtime.

## Detail teknis

- `src/lib/graph/build.ts`: ganti `placeCloud` dengan generator berlapis — `pickSuperclusterCenters()`, `knotField()` (power-law + simplex noise), `filamentPath()` (kurva Catmull-Rom ber-noise dengan kepadatan bertingkat), dan penjagaan jarak minimum antar knot.
- Bobot posisi memakai metadata yang sudah ada (`cluster`, `kind`, edge `tree`/`link`) untuk menentukan kedekatan semantik; derajat node menentukan kedalaman ke inti knot.
- `src/components/universe/Graph2D.tsx`: hitung descendant count sekali, radius `r = base * (1 + log2(1 + desc))`.
- `src/data/raw/event.json` + `src/data/index.ts` + `PanelContent.tsx`: field opsional dibuat aman, nama INSTINCT, cover per event.
- Cover baru disimpan sebagai `.asset.json`, bukan biner di repo.
