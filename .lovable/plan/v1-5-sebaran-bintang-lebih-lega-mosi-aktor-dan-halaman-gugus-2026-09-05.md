# v1.5 — Sebaran Bintang Lebih Lega, Mosi Aktor, dan Halaman Gugus yang Berisi

## 1. Penataan ulang sebaran bintang (3D & 2D)

Tujuan: terasa alami, tidak jomplang, tapi jelas ada ruang kosong dan padatan.

- Pusat semesta "DEBATE UNIVERSE" dikembalikan sebagai bintang inti, tetapi posisinya digeser acak (tidak persis di titik nol) supaya komposisi tidak simetris.
- Jarak pusat → gugus (matter, motion, roles, kamus, dst.) diperbesar dan dibuat bervariasi: sekitar 20% gugus ditempatkan relatif dekat, sisanya jauh dan acak.
- Jarak gugus → subgugus diperbesar (mis. MOTION → jenis mosi, MATTER → domain) memakai aturan variasi yang sama.
- Jarak subgugus → cabang/daun juga diperbesar, dengan rentang minimum–maksimum lebih lebar sehingga cabang tidak menempel ke induknya.
- Ruang kosong (void) dikurangi ekstremnya: batas atas jarak dibatasi dan ada aturan jarak minimal antar bintang, agar tidak ada lubang raksasa maupun gumpalan padat berlebihan.
- Pengaturan yang sama diterapkan ke tampilan 2D supaya kedua mode konsisten.

## 2. Tambah mosi (prioritas mosi aktor)

- Impor 50 mosi filosofi/kontrafaktual dari berkas unggahan (mf001–mf050), lengkap dengan infoslide, probabilitas, 10 poin PRO/KON + poin Rank N, kasus ideal/mayor/minor/niche, rotasi, dan riset.
- Sistem dua kode: setiap mosi punya nomor urut vault (m316 dan seterusnya) **dan** kode sumber/tipe (mf001 dst.), keduanya ditampilkan pada kartu mosi.
- Prioritas: mosi bertipe aktor / role-play aktor diimpor dan ditandai lebih dulu, karena saat ini baru ada 5 dari 242 mosi. Mosi hibrid tetap tertaut ke dua jenis induknya.
- Sisa berkas batch lama dicek duplikatnya sebelum ditambahkan.

## 3. Rombak halaman gugus & kategori

Saat ini menekan MATTER, MOTION, atau domain seperti Hukum/Sosial menampilkan halaman kosong atau berantakan.

- Halaman gugus jadi halaman ringkasan + pencarian: kolom cari di dalam panel, ringkasan jumlah isi, statistik ringkas (grafik batang/donat kecil), lalu daftar isi yang bisa diklik.
- Halaman domain matter (Hukum, Sosial, dll.) menampilkan daftar bab dan subbab lengkap dengan cuplikan isi, bukan sekadar judul.
- Halaman jenis mosi (kebijakan dll.) yang sudah punya klasifikasi dipertahankan isinya, hanya dipercantik: kartu kotak-kotak, warna tipe, dan grafik persentase.
- Bagian "tautan" (bintang yang terhubung) dipindah ke bawah, setelah informasi umum.

## Catatan teknis

- Perubahan tata letak ada di `src/lib/graph/build.ts` (`CLUSTERS.dist`, `placeCloud`, `placeBranch`, penempatan root) dan penyesuaian ukuran/skala di `Graph2D.tsx`.
- Impor mosi lewat skrip parser baru di `scripts/` yang menulis ke `src/data/raw/motions.json`; tipe `Motion` di `src/data/types.ts` ditambah bidang `kode` (kode sumber seperti `mf001`) dan `infoslide`.
- Panel di `src/components/shell/panels/PanelContent.tsx`: `ClusterPanel`, `MatterDomainPanel`, dan `JenisPanel` ditulis ulang dengan pencarian, statistik, dan tata letak bento.
