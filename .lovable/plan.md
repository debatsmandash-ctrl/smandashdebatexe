# V1.0.2 — Obsidian 2D, Universe 3D Tuning, Bore-Up Mosi

## 1. Mode 2D ala Obsidian (baru)

Toggle 2D/3D di Universe. Mode 2D adalah graph canvas seperti Obsidian:

- Node bisa di-drag bebas; posisi hasil drag "dipaku" (pinned) dan tersimpan lokal.
- Simulasi force sederhana (repulsi + pegas edge) berjalan halus, bisa di-pause.
- Pan (drag latar) + zoom scroll dengan sensitivitas yang sama-sama bisa diatur.
- Pengaturan hover ala Obsidian, semuanya on/off:
  - Highlight on hover (aktif / non-aktif)
  - Drag ikut menarik tetangga (chain drag) atau hanya node itu sendiri
  - Tampilkan label selalu / hanya saat hover / saat zoom dekat
  - Kekuatan repulsi, panjang link, gaya pusat (slider)
- Klik node tetap membuka panel yang sama seperti 3D.

## 2. Universe 3D

- **Sensitivitas**: zoom default dinaikkan (terasa lambat sekarang), plus slider di Settings untuk Zoom, Rotate, Pan, dan Damping — tersimpan di preferensi.
- **Tombol Back** ditambahkan ke HUD universe (di samping kontrol navigasi yang ada).
- **Nebula**: skybox versi lebih tinggi resolusi + anisotropy naik; intensitas nebula dan Bloom diturunkan defaultnya (tetap bisa dinaikkan manual).
- **Formasi bintang**: layout diubah supaya lebih menyebar dan merata tapi tetap padat — jarak antar-cluster naik sedikit, distribusi dalam cluster memakai densitas berkarakter (inti agak padat, tepian menyebar dengan filamen/lengan tak simetris), plus relaksasi jarak minimum supaya tidak ada rongga kosong besar maupun gumpalan.
- **UI/UX** mengikuti gambar referensi: HUD panel gelap dengan header berlabel bertanda `•`, angka statistik besar berwarna neon (mint/amber), daftar ringkas dengan angka di kanan, mini bar-meter horizontal, sparkline tren di bawah, dan hint kecil "CLICK ON SCENE — EXIT DASHBOARD" di tengah bawah. Panel kiri = metrik cepat, panel kanan = daftar hub, cluster, dan distribusi layer.
- Label versi di UI menjadi **V1.0.2**.

## 3. Konten

- **10 mosi baru** dari dua file yang diunggah (m001–m010) diimpor lengkap: tipe, konteks, catatan pakai, probabilitas PRO/KON, istilah kunci, 10 poin PRO dan 10 poin KON dengan Tier/Kekuatan/Risiko, cases, rotasi, riset.
- **Bore-up mosi lama**: semua mosi yang isinya masih tipis diseragamkan ke template yang sama (10 poin per sisi bertingkat S/A/B/C, kekuatan & risiko berupa persentase non-bulat, kausalitas, cases ideal/mayor/minor/niche, rotasi ofensif–defensif, riset). Dikerjakan bertahap sebanyak yang muat dalam sisa anggaran turn, diprioritaskan mosi yang paling kosong.
- **Matter**: ditambah dari dua berkas unggahan (pendekatan debat olahraga; ekonomi–marketing–corporate issue) sebagai matter baru dengan struktur bento yang sudah ada.
- **Lagu baru** yang diunggah dimasukkan ke playlist.
- **PKN**: gambar diganti dengan foto ruang sidang DPR RI.

## 4. Deploy Vercel

- Pastikan `vercel.json` (install/build/output) cocok dengan preset TanStack Start, hapus konfigurasi yang bentrok.
- Bersihkan impor/berkas sisa mode lama agar build produksi tidak gagal, lalu verifikasi dengan build produksi lokal sebelum selesai.

## Catatan teknis

- 2D memakai canvas 2D + simulasi force ringan buatan sendiri (tanpa dependensi graph baru), berbagi `buildGraph()` dan store yang sama dengan 3D; posisi pinned disimpan di store terpersist.
- Setting baru (`sensZoom`, `sensRotate`, `sensPan`, `graph2d.*`) ditambahkan ke store dengan kenaikan versi dan merge default agar preferensi lama tidak rusak.
- Impor mosi lewat skrip parser sekali jalan ke `src/data/raw/motions.json`, ditambah field baru opsional (`winPro`, `points[]` dengan tier/kekuatan/risiko, `cases`, `rotation`) di `src/data/types.ts`; panel membaca field baru jika ada dan jatuh balik ke format lama bila tidak.

## Soal API / GitHub — saran

Untuk sekarang **belum perlu** backend atau repo eksternal: semua data mosi/matter statis dan jauh lebih cepat disajikan dari bundel. Yang benar-benar menaikkan kelas web ini nanti:

1. **Lovable Cloud** (database + login) — untuk progres latihan, catatan pribadi per mosi, mosi buatan pengguna, dan leaderboard klub. Ini langkah paling berdampak dan tidak butuh akun eksternal.
2. **AI Gateway** (sudah ada di proyek) — sparring partner: generate rebuttal, POI, dan penilaian argumen. Ini "next level" yang paling terasa untuk pengguna debat.
3. **API berita** hanya kalau ingin mosi mengikuti isu terbaru secara otomatis; biayanya perawatan, jadi opsional.

Empat repo GitHub yang dikirim adalah proyek produktivitas/AI-agent generik; tidak ada yang cocok dijadikan basis untuk aplikasi debat ini. Polanya yang layak dicontek hanya struktur "workspace + AI assistant", dan itu bisa dibangun langsung di sini tanpa mengimpor kodenya.
