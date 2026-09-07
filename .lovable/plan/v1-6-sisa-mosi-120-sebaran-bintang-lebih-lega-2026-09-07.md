# v1.6 — Sisa Mosi (±120) & Sebaran Bintang Lebih Lega

## Laporan sisa mosi

Bank saat ini: **292 mosi**. Berkas unggahan yang dicek ulang:

| Berkas | Isi | Status |
| --- | --- | --- |
| mosi_part1 (m001–m050) | 50 | sudah masuk |
| mosi_part2 (m051–m100) | 50 | sudah masuk |
| mosi_batch_01 (m001–m010) | 10 | sudah masuk |
| BATCH‑04 / 05 / 06 | — | sudah masuk |
| BATCH_FILOSOFI mf001–mf050 | 50 | sudah masuk |
| **PART_1_mosi_1-50** (lanjutan filosofi, Tipe A/B/C) | 50 | **49 belum masuk** |
| **PART_2_mosi_51-70** (batch aktor figur publik nyata) | 71 | **71 belum masuk** |

Jadi sisa **±120 mosi**, dan mayoritasnya justru mosi **aktor/role‑play** (Prabowo, Messi, Sundar Pichai, dll.) plus mosi filosofi Tipe A/B/C. Setelah diimpor, bank menjadi **±412 mosi** dan jumlah mosi aktor naik dari 28 menjadi sekitar 100.

## 1. Impor sisa mosi

- Perluas skrip parser yang sudah ada agar juga membaca dua berkas ini (format tabel/section-nya mirip, tapi PART_2 pakai penanda blok berbeda).
- Nomor bank lanjut dari m366 dst., kode sumber tetap ditampilkan (mf0xx / ma0xx) sehingga tiap kartu punya dua kode.
- Cek duplikat berdasarkan judul yang dinormalkan; mosi hibrid tetap tertaut ke dua jenis induknya.
- Tipe aktor diberi kategori jelas supaya gugus "aktor" tidak lagi kurus.

## 2. Sebaran bintang: lebih lega dan bervariasi

- **Antar gugus besar**: jarak minimum antar gugus dinaikkan, dan pasangan yang selama ini berdekatan (mosi ↔ kamus, mosi ↔ materi) diberi aturan tolak khusus supaya saling menjauh.
- **Antar subgugus**: aturan "kalau subgugus A dekat ke satu tetangga, ia harus jauh dari tetangga lain" — jarak diambil dari rentang yang lebih lebar dan diacak per subgugus, jadi tidak ada lagi cincin berjarak seragam.
- **Cabang mosi**: jarak jenis mosi → mosi individual diperpanjang paling banyak, karena gugus ini paling padat.
- **Gugus kamus**: bentuk cincin huruf yang terlalu rapi diganti menjadi rumpun tak simetris — tiap huruf punya radius, kemiringan, dan kepadatan sendiri, sehingga tidak lagi terlihat generik.
- Semesta dimanfaatkan lebih luas secara keseluruhan (skala global naik), tapi tetap dijaga batas atas supaya tidak ada lubang kosong raksasa.
- Kamera awal disesuaikan agar seluruh sebaran baru tetap masuk layar, dan aturan yang sama diterapkan pada tampilan 2D.

## Catatan teknis

- Parser: perluas `scripts/import-filosofi.py` (atau skrip serumpun baru) untuk PART_1/PART_2, tulis ke `src/data/raw/motions.json`.
- Tata letak: `src/lib/graph/build.ts` — naikkan `SPREAD`, tambahkan matriks jarak antar-gugus (repulsi khusus motion↔kamus↔matter), acak radius per subgugus di `placeCloud`, perlebar rentang `placeBranch` untuk cabang mosi, dan ganti penempatan huruf kamus dari cincin `letterDirs` seragam menjadi rumpun beradius acak.
- Penyesuaian jarak kamera awal di `Universe.tsx` dan skala di `Graph2D.tsx`.
