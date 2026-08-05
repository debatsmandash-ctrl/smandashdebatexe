/**
 * Template-based enrichment: memperpanjang pro/kon list mosi ke minimum 10 poin
 * dengan variasi angle (ekonomi, keadilan, hak, praktis, prinsip, jangka panjang, dll).
 * Semua bahasa Indonesia KBBI. Deterministik per motion.id.
 */
import type { Motion } from "@/data/types";

const PRO_ANGLES = [
  (t: string) => `Dari sisi keadilan struktural, kebijakan pada mosi "${t}" menutup ketimpangan yang selama ini terpelihara oleh status quo.`,
  (t: string) => `Secara pragmatis, biaya implementasi mosi ini lebih rendah daripada biaya sosial yang terus ditanggung akibat tidak bertindak.`,
  (t: string) => `Prinsip otonomi mendukung mosi ini karena aktor terkait berhak menentukan pilihan atas hidupnya sendiri.`,
  (t: string) => `Dampak jangka panjang lebih positif: sistem menjadi lebih stabil ketika akar masalah ditangani, bukan hanya gejalanya.`,
  (t: string) => `Presedennya sudah ada di negara/institusi lain, sehingga risiko eksperimental menjadi minimal.`,
  (t: string) => `Kelompok rentan mendapat perlindungan langsung — inilah kelompok yang paling perlu diprioritaskan dalam kalkulus moral.`,
  (t: string) => `Efek psikologis positif (kepercayaan publik, martabat) sering diabaikan lawan padahal ini benefit yang riil dan terukur.`,
  (t: string) => `Alternatif lawan (status quo atau perbaikan bertahap) sudah terbukti gagal menyelesaikan akar persoalan.`,
];
const KON_ANGLES = [
  (t: string) => `Mosi "${t}" berisiko menciptakan konsekuensi tak terduga (unintended consequences) yang justru merugikan kelompok yang ingin dilindungi.`,
  (t: string) => `Beban implementasi (biaya, birokrasi, penegakan) berpotensi tidak sebanding dengan manfaat yang dijanjikan.`,
  (t: string) => `Prinsip kebebasan/otonomi individu terlanggar ketika negara/institusi memaksakan intervensi yang paternalistik.`,
  (t: string) => `Solusi ini menyerang gejala, bukan akar masalah — sehingga masalah akan muncul kembali dalam bentuk lain.`,
  (t: string) => `Ada mekanisme alternatif yang lebih ringan (edukasi, insentif, regulasi bertahap) yang mampu mencapai tujuan yang sama tanpa trade-off ekstrem.`,
  (t: string) => `Kelompok minoritas/marjinal berpotensi menanggung dampak paling besar karena tidak memiliki daya tawar dalam sistem baru.`,
  (t: string) => `Preseden buruk: begitu batas prinsipnya digeser, sulit menariknya kembali — slippery slope yang nyata.`,
  (t: string) => `Legitimasi institusional dipertaruhkan bila kebijakan gagal, dan kepercayaan publik lebih sulit dibangun ulang dari nol.`,
];

function pick<T>(arr: T[], seed: number, taken: Set<number>): T {
  for (let i = 0; i < arr.length; i++) {
    const idx = (seed + i) % arr.length;
    if (!taken.has(idx)) { taken.add(idx); return arr[idx]; }
  }
  return arr[0];
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Return pro list padded up to `target` with template angles. */
export function enrichPro(m: Motion, target = 10): string[] {
  const base = [...(m.pro || [])];
  if (base.length >= target) return base;
  const seed = hash(m.id + ":pro");
  const taken = new Set<number>();
  while (base.length < target) {
    base.push(pick(PRO_ANGLES, seed + base.length, taken)(m.title));
  }
  return base;
}
export function enrichKon(m: Motion, target = 10): string[] {
  const base = [...(m.kon || [])];
  if (base.length >= target) return base;
  const seed = hash(m.id + ":kon");
  const taken = new Set<number>();
  while (base.length < target) {
    base.push(pick(KON_ANGLES, seed + base.length, taken)(m.title));
  }
  return base;
}

/**
 * Pecah satu poin argumen menjadi bullet ringkas (klaim → mekanisme → dampak →
 * bukti/uji) supaya mudah diserap saat latihan. Deterministik.
 */
export function bulletize(text: string, side: "pro" | "kon", index: number): { label: string; body: string }[] {
  const t = text.replace(/\s+/g, " ").trim();
  const parts = t.split(/(?<=[.;])\s+|\s+(?:karena|sehingga|akibatnya|maka)\s+/i).filter((s) => s.length > 3);
  const klaim = parts[0] ?? t;
  const seed = hash(side + index + t.slice(0, 30));

  const MEKANISME = [
    "Rantai sebabnya: aktor utama mengubah perilaku begitu insentif atau batas hukumnya bergeser.",
    "Mekanismenya berjalan lewat perubahan biaya-manfaat yang dihadapi pihak yang paling terdampak.",
    "Jalur kerjanya: aturan baru menutup celah yang selama ini dipakai untuk menghindar dari tanggung jawab.",
    "Prosesnya bertahap — kebijakan menggeser norma, norma menggeser praktik sehari-hari.",
  ];
  const DAMPAK = [
    "Dampak terukurnya jatuh pada kelompok yang paling sedikit punya daya tawar, dan itulah beban utama dalam penimbangan.",
    "Dampaknya bersifat kumulatif: kecil per kasus, besar ketika diakumulasi lintas tahun.",
    "Dampak terbesarnya bukan angka, melainkan perubahan ekspektasi publik terhadap institusi.",
    "Dampaknya langsung terasa pada akses, biaya, dan rasa aman pihak yang dibela.",
  ];
  const UJI = [
    "Uji lawan: minta mereka menunjukkan mekanisme tandingan yang konkret, bukan sekadar kemungkinan buruk.",
    "Uji lawan: bandingkan dengan status quo, bukan dengan dunia ideal yang tidak pernah ada.",
    "Uji lawan: tanyakan siapa yang menanggung biaya bila klaim mereka meleset.",
    "Uji lawan: periksa apakah bukti mereka berlaku pada konteks yang sedang diperdebatkan.",
  ];

  const rest = parts.slice(1).join(" ").trim();
  return [
    { label: "Klaim", body: klaim },
    { label: "Mekanisme", body: rest || MEKANISME[seed % MEKANISME.length] },
    { label: "Dampak", body: DAMPAK[(seed >> 3) % DAMPAK.length] },
    { label: "Uji", body: UJI[(seed >> 5) % UJI.length] },
  ];
}
