# v1.1 — Cloud, Data Event, Formasi Bintang Alami & Performa

## 1. Aktivasi Lovable Cloud
Menyalakan backend bawaan Lovable (database, autentikasi, storage, fungsi server). Setelah aktif, kandidat pemakaian pertama: menyimpan layout node yang dipaku, preferensi setting, dan bookmark mosi per pengguna. Tidak ada tabel yang dibuat di langkah ini kecuali disetujui terpisah.

Catatan GitHub: sinkronisasi GitHub tidak bisa dinyalakan dari sisi saya. Perlu dilakukan sekali lewat menu Plus (+) → GitHub → Connect project. Setelah tersambung, setiap perubahan dari sini otomatis ter-push.

## 2. Formasi Universe 3D lebih alami (referensi gambar 1)
Gambar 1 memperlihatkan struktur kosmik: gugusan padat (knot), filamen tipis penghubung, dan void besar. Layout diubah dari "spiral disc per cluster" menjadi model filamen-void:

```text
   void besar
        ·          ●●●●      ← knot padat (cluster inti)
   ·        ·    ●●●●●●
        ·  ····●●●●●●●●···●●●   ← filamen tipis antar knot
   ·   ●●●●·                ●●●●
      ●●●●        void        ●●
```

- Tiap cluster jadi 1–3 knot (sub-gugus) dengan kepadatan power-law, bukan bola merata.
- Node antar sub-hub diletakkan sepanjang filamen tipis (tabung berjari-jari kecil) yang menyambung knot.
- Void dijaga dengan jarak minimum antar knot; hasilnya ada ruang kosong nyata tanpa terasa bolong.
- Leaf (kamus, subbab) yang jumlahnya banyak dipakai untuk mengisi filamen supaya sebaran terasa penuh.

## 3. Graph 2D: ukuran node berdasar hierarki (referensi gambar 2)
- Radius node dihitung dari jumlah keturunan (descendant count), bukan hanya rank: makin banyak percabangan, makin besar bulatannya — persis pola Obsidian di gambar 2.
- Warna node mengikuti warna cluster, leaf lebih kecil dan lebih redup.
- Tuning gaya: repulsi lebih besar untuk node besar, panjang pegas menyesuaikan ukuran, agar gugusan terpisah rapi.

## 4. Data event & cover
`src/data/raw/event.json` diperluas jadi tiga event dengan detail lengkap:

- **Olimpiade PPKn 15 (OP 15)** — Himaprodi PPKn FKIP Universitas Riau, 4–8 Mei 2026, tingkat SMA & Mahasiswa, sistem British Parliamentary. Cover diganti ke foto ruang sidang paripurna DPR RI yang sudah ada di proyek.
- **Kompetisi ilmiah nasional tahunan Universitas Riau (mendatang)** — cabang DEBMA & DEBSIS. SMANDASH menurunkan 3 tim:
  - Pandau United: Valentino Alexandros Saragih, Pramudya Fathur Roza, Ismat Habibi Akma
  - Ceciwii Bosss: Syifa Aurelia Qalbina, Nur Amirah Syahnas Nasution, Enp Iryany Sangjia Putri
  - Cihul Twiga: Nabila Meysun Nur Fitriana, Raysa Rahmania, Marsha Millano
- **Lomba Debat Indonesia (LDI) Tingkat Nasional** — Puspresnas, Kemendikdasmen, jenjang SMA/SMK. Jalur Valentino, Amirah, Eny: seleksi kabupaten → delegasi Kampar → menang → delegasi Riau untuk tingkat nasional.

Node graf (event, tim, speaker) otomatis bertambah mengikuti data baru, dan panel event menampilkan cover, tanggal, penyelenggara, sistem, serta daftar tim/speaker.

Cover event baru: dicari dari sumber stok resolusi tinggi yang bebas dipakai (mis. Wikimedia/portal resmi). Bila tidak ditemukan yang layak, saya pakai komposisi foto yang sudah ada + panel bergaya poster, bukan gambar AI.

## 5. Mosi
- Menambahkan batch mosi dari berkas yang diunggah ke `motions.json` dengan template lengkap (probabilitas, 10 poin bertingkat S/A/B/C, cases, rotasi, riset).
- Lobby mendapat blok "Rekomendasi Mosi Menarik" yang menampilkan mosi Prabowo dan mosi UTBK sebagai kartu sorotan yang bisa diklik langsung ke panel analisisnya.

## 6. Performa & perbaikan bug
- Deteksi perangkat: preset otomatis (mobile → low, desktop → high) dengan opsi manual di Settings.
- Pengurangan beban: instancing untuk node, batas jumlah label yang dirender, bloom & resolusi render adaptif, jeda animasi saat tab tidak aktif.
- Membersihkan error yang muncul di log build/runtime dan memastikan build produksi bersih.

## Detail teknis
- `src/lib/graph/build.ts`: ganti `placeCloud` dengan generator knot + filamen (noise + power-law radial), tambah util jarak minimum antar knot.
- `src/components/universe/Graph2D.tsx`: hitung descendant count sekali dari `buildGraph()`, map ke radius `r = base * (1 + log2(1 + desc))`.
- `src/components/universe/Universe.tsx` + `useDeviceProfile.ts`: preset kualitas adaptif, DPR clamp, pause rAF via `document.visibilitychange`.
- `src/data/raw/event.json` + `src/data/index.ts` + panel event di `PanelContent.tsx`: skema event diperluas (tanggal, penyelenggara, sistem, cover, tim, catatan prestasi).
- Cover disimpan sebagai Lovable Asset (`.asset.json`), bukan biner di repo.
