# v1.2 — Bento Infographic Penuh, Lobby NASA-Style, Konten Ekstensif KBBI

Enam pekerjaan besar. Fokus utama: **ekspansi materi** (matter/motion/roles) dengan bahasa Indonesia KBBI, probabilitas menang berbasis heuristik nyata, dan lobby ala NASA yang jadi satu dengan data preview.

---

## 1 · Bento Infographic Penuh (matter/motion/roles/jenis/vocab)

Rombak `src/components/shell/panels/PanelContent.tsx` + tambah subkomponen `src/components/panels/infographic/`.

- **BentoGrid**: CSS-grid asimetris (row/col span campur), corner-bracket HUD, border neon warna domain, gradasi soft, hover-lift.
- **Typography**: `text-align: justify`, `hyphens: auto`, `lang="id"` untuk hyphenation KBBI, `text-indent` paragraf panjang, drop-cap opsional untuk section pembuka.
- **Kartu per-kind**:
  - **Motion** → Header (kategori, tipe, stance-badge OFENSIF/DEFENSIF/HYBRID), **WinProbabilityCard** (lihat §2), **RotationCard** (lihat §2), Pro-cards (≥10 poin, tiap poin ada `strength%`, `risk%`, `causality` chain), Kon-cards (idem), **RadarPro/Kon**, TermsChips (klik → popover kamus §5), Research links, Ideal case, Related motions grid.
  - **Matter (Bab/Subbab)** → KeyPoints (≥10), Common mistakes, Winning angles, Sample analogy, Data point, Sunburst subtree, Stacked bar motion terkait.
  - **Role** → Duties (≥10), Time budget bar, Radar skills, Signature phrases, Advanced tactics, Common pitfalls, DoNots (list eksplisit).
  - **Jenis Mosi** → Contoh (≥5), Strategy tips, Do/Don't grid.
  - **Vocab** → Definisi, usage example, related terms chips, misconception box.
- **Mini-chart lib**: pakai SVG murni (no recharts overhead) — RadarChart, HorizBar, DonutRing, ChipCloud di `src/components/panels/infographic/charts/`.
- **FactBox** "Tahukah kamu?" di footer bento.

## 2 · Presentasi Probabilitas Menang (bukan 100/50/25)

File baru `src/lib/motion/win-probability.ts`:

- **Skor per motion** dihitung dari: rasio pro:kon count, jumlah `terms`, kualitas `research` (ada/tidak), keberadaan `ideal`, `catAll` weight (policy vs value vs fact), keyword offense/defense.
- Output: `winProProb`, `winKonProb`, `balance` (–1..+1), `bias` ("berat pro"/"berat kon"/"seimbang"), `confidence` 0..1.
- Angka bukan bulat — hasilnya seperti `54.7%`, `38.2%`, `61.4%` (deterministik dari seed motion.id + heuristik, bukan Math.random tiap render).
- **RotationCard**: heuristik apakah motion butuh `half-stance` (kalau balance ekstrem >0.7 → wajib half; kalau tipe policy dengan kon kuat → rotasi standar; kalau value seimbang → free rotation). Tampilkan sebagai matrix 4-slot dengan rekomendasi teks pendek.
- **Per-poin scoring** (untuk pro/kon list): tiap poin diberi `strength%` (kekuatan argumen), `risk%` (risiko backfire), `causality` (rantai sebab-akibat 2-3 langkah), `tier` (S/A/B/C berdasarkan strength-risk). Angka gacor: `73.4%`, `41.8%`, dst. Deterministik via hash poin+motion.id.
- Ditampilkan di panel motion sebagai bar horizontal berlabel + tooltip causality.

## 3 · Ekstensi Materi Besar-Besaran (KBBI Indonesia)

File baru `src/data/enrich/{matter,motions,roles,jenis,vocab}.ts` — augmentation layer, tidak overwrite raw JSON.

**Bahasa**: Indonesia baku KBBI. Istilah asing dipertahankan (italic + kurung penjelasan pertama kali muncul). Mayoritas konten Indonesia karena kurikulum LDBI. Contoh: "argumen" bukan "argument", "pembuktian" bukan "proof", "mosi" bukan "motion" untuk narasi umum (tapi field `motion.title` tetap English karena data raw).

**Per motion** (55+ motion): minimum **10 pro + 10 kon** (tiap poin 1-2 kalimat lengkap dengan sebab-akibat), 5+ `terms`, 3+ `research` topics, `ideal` 3-4 kalimat, `contoh` skenario pro & kon, `commonRebuttals`, `analogies`, `stakeholders`, `impactShort`, `impactLong`, `doNots` (≥5).

**Per matter subbab**: `keyPoints` ≥10, `commonMistakes` ≥5, `winningAngles` ≥5, `analogies` ≥3, `dataPoints` ≥3 (statistik/fakta), `debateTips`, `crossExamples`, `misconceptions`.

**Per role**: `duties` ≥12, `timeBudget` per fase, `signaturePhrases` ≥8, `advancedTactics` ≥5, `commonPitfalls` ≥5, `doNots` ≥5, `synergyWith` (role lain).

**Per jenis mosi**: `contoh` ≥5, `strategyTips` ≥5, `doNots` ≥5.

**Per vocab**: `usageExample` (kalimat KBBI), `relatedTerms` ≥3, `misconception`, `debateContext`.

**Proses generation**: pakai `lovable_ai.py` skill dengan model default (openai/gpt-5.5) via batch script `scripts/enrich-content.mjs` — output JSON file di `src/data/enrich/*.json` yang di-consume runtime. Prompt template Indonesia KBBI + kurikulum LDBI eksplisit.

## 4 · Popover Kamus untuk Istilah Asing

- File baru `src/components/panels/VocabPopover.tsx` + `src/lib/vocab/index-terms.ts`.
- Runtime: scan teks matter/motion, cocokkan dengan `VOCAB[].term` dan `VOCAB[].en` (case-insensitive, word-boundary). Term match → dibungkus `<button class="vocab-term">`.
- Klik → popover kecil (Radix Popover) muncul di sebelah term: definisi singkat + tombol "Buka di Kamus" (navigate ke node vocab tapi tanpa close panel current).
- Popover kecil (max-width 280px), tidak fullscreen, tidak mengambil fokus reading. Escape/click-outside untuk tutup.
- Highlight visual: underline dotted warna accent, bukan bold, biar tidak mendistract.

## 5 · Hover Edges Lurus + Animasi Transfer

Edit `src/components/universe/HoverEdges.tsx`:

- Ganti kurva bezier → **garis lurus** point-to-point (BufferGeometry 2-vertex per edge).
- Shader flow: gradient offset bergerak sepanjang garis (uv.x + time) — efek "transfer packet" seperti data mengalir dari A ke B.
- **Skip logic**: jika edge sudah ada di `mainEdges` (tree edges yang visible via link-mode FULL_TREE atau SHOW_ALL), jangan render hover version. Cek via Set `renderedEdgeKeys` yang dipopulate dulu oleh main pass.
- Warna: gradient dari cluster-color A → cluster-color B, opacity pulse.

## 6 · Lobby NASA-Style (merge dengan Information)

Rombak total `src/components/lobby/MissionControl.tsx` mengikuti referensi NASA.gov yang di-upload:

- **Hero fullscreen**: background image antariksa (nebula/galaxy dari asset existing `milkyway_pano_hd` atau generate hero baru), headline besar bold serif/sans ("Jelajahi Semesta Debat" atau brand-appropriate), sub-copy, CTA merah bulat ("Enter Universe →") + secondary "Discover More".
- **Section "Welcome to the Universe"**: grid 4 kartu besar (Matter, Motions, Roles, Kamus) dengan gambar cover — klik langsung teleport ke domain di universe (bypass lobby exit + focus node).
- **Section "Image of the Day"**: featured card besar — konten dinamis (motion of the day / fact of the day dari data).
- **Section "Featured News"**: 3-4 kartu artikel gaya blog (tips debat, update dataset, event kompetisi dari `EVENTS`).
- **Section "More Data"**: 3 tile gambar besar (Statistik, Distribusi, Timeline) → klik ke `/information` deep-dive.
- **Section CTA banner**: "Explore the Universe from your Inbox" analog → "Mulai eksplorasi sekarang" dengan tombol besar.
- **Top nav**: logo tengah, "Explore" dropdown kiri, search bar, right menu (News, Multimedia, Settings).
- **Footer**: credits SMANDASH × Rojaaks.
- Warna: latar putih untuk section konten (kontras NASA), hero & CTA gelap dengan foto space, aksen merah `#EF4444` (bulat), body serif untuk headline besar mirip NASA (`"Inter"` weight 700-900 uppercase tight-tracking).
- `/information` route → **dihapus** atau di-redirect ke lobby (karena sudah merged). Data telemetry pindah ke section lobby.
- Intro cinematic (`Intro.tsx`) tetap → play sekali → lobby.

## 7 · Boilerplate & QA

- Update `src/lib/store.ts`: hapus `informationSeen`, tambah `preferHalfStance` toggle, `vocabPopoverEnabled` toggle.
- Update `src/routes/index.tsx`: flow Intro → Lobby → Universe.
- Delete/redirect `src/routes/information.tsx`.
- QA: mobile (lobby scroll smooth, kartu stack), desktop ultra (hover edges tidak lag), popover kamus tidak overflow.

---

## Technical Section

**Files baru**
- `src/lib/motion/win-probability.ts` (heuristik + deterministic hash)
- `src/lib/motion/stance.ts` (jika belum ada)
- `src/lib/vocab/index-terms.ts` (term scanner)
- `src/data/enrich/{matter,motions,roles,jenis,vocab}.json` (output enrichment)
- `src/data/enrich/index.ts` (loader + merge)
- `src/components/panels/infographic/{BentoGrid,WinProbability,RotationCard,PoinTierBar,CausalityChain,StanceBadge,FactBox,RelatedGrid}.tsx`
- `src/components/panels/infographic/charts/{RadarChart,HorizBar,DonutRing,ChipCloud,Sunburst}.tsx`
- `src/components/panels/VocabPopover.tsx`
- `scripts/enrich-content.mjs` (batch AI generation)

**Files diedit**
- `src/components/shell/panels/PanelContent.tsx` (bento total)
- `src/components/universe/HoverEdges.tsx` (straight + skip existing)
- `src/components/lobby/MissionControl.tsx` (NASA-style)
- `src/routes/index.tsx` (flow)
- `src/routes/information.tsx` (delete atau redirect)
- `src/lib/store.ts` (toggles baru)
- `src/lib/graph/build.ts` (inject enrichment)

**Packages**
- `@radix-ui/react-popover` (untuk vocab popover)

**Bahasa & Style**
- Semua narasi baru: **Bahasa Indonesia KBBI**, `lang="id"` di root panel, hyphenation aktif.
- Istilah asing: italic + parentesis penjelasan pertama muncul, klik → popover kamus.
- Nomor probabilitas: 2 desimal (`54.73%`), deterministik.

---

## Urutan Build
1. Enrichment script + generate JSON (§3) — konten dulu karena panel butuh
2. Win-probability + stance heuristik (§2)
3. Bento panel + charts + popover kamus (§1, §4)
4. HoverEdges straight + transfer animation (§5)
5. Lobby NASA-style merge (§6)
6. Cleanup routes + store + QA (§7)

## Guardrails
- Raw JSON tidak dimutasi (enrich = layer terpisah).
- Kalau AI batch enrichment kelewat quota, fallback ke template-based enrichment (masih 10 poin, tapi dari kombinatorik keyword — kualitas lebih rendah tapi tidak crash).
- Tidak ubah auth/backend/database.
- 2D tetap tidak ada.

Approve untuk mulai step 1 (enrichment content generation) — ini step terberat & terlama karena butuh AI batch call untuk 55+ motion, 100+ subbab, semua role/jenis/vocab.
