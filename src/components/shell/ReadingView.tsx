import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, BookOpen, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOTIONS, MATTER, ROLES, VOCAB } from "@/data";
import { buildGraph } from "@/lib/graph/build";
import { useUniverse } from "@/lib/store";
import { PanelContent } from "./panels/PanelContent";
import nebulaAsset from "@/assets/lobby/nasa-carina.jpg.asset.json";

type Shelf = "mosi" | "matter" | "roles" | "kamus";
export function ReadingView() {
  const [shelf, setShelf] = useState<Shelf>("mosi");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const graph = useMemo(() => buildGraph(), []);
  const selectedId = useUniverse((s) => s.selectedId);
  const select = useUniverse((s) => s.select);
  const node = selectedId ? graph.byId.get(selectedId) : null;
  const entries = useMemo(() => {
    if (shelf === "mosi") return MOTIONS.map((m) => ({ id: `motion:${m.id}`, title: m.title, meta: `${m.cat} · ${m.type}`, body: m.ctx || m.pro?.[0] || "Buka analisis mosi" }));
    if (shelf === "matter") return Object.entries(MATTER).map(([key, d]) => ({ id: `domain:${key}`, title: d.label, meta: `${d.babs.length} bab`, body: d.desc }));
    if (shelf === "roles") return graph.nodes.filter((n) => n.cluster === "roles" && (n.kind === "role" || n.kind === "subhub")).map((n) => ({ id: n.id, title: n.label, meta: "Peran debat", body: "Uraian tugas, waktu, dan keterampilan pembicara." }));
    return graph.nodes.filter((n) => n.kind === "letter").map((n) => ({ id: n.id, title: n.label, meta: "Kamus debat", body: `${VOCAB.filter((v) => v.term.toUpperCase().startsWith(n.label)).length} istilah` }));
  }, [shelf, graph]);
  const filtered = useMemo(() => entries.filter((e) => `${e.title} ${e.meta} ${e.body}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id"))), [entries, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const shown = filtered.slice(Math.min(page, pageCount - 1) * 8, (Math.min(page, pageCount - 1) + 1) * 8);

  return <div className="reading-view dark fixed inset-0 overflow-y-auto bg-background text-foreground">
    <div className="reading-sky" style={{ backgroundImage: `linear-gradient(to bottom, rgb(5 8 15 / 0.74), rgb(5 8 15 / 0.96)), url(${nebulaAsset.url})` }} aria-hidden />
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-20 md:px-10 md:pt-24">
      <header className="mb-9 border-b border-border pb-7">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase text-primary"><BookOpen size={16} /> SMANDASH · v1.2.2</div>
        <h1 className="text-4xl font-semibold md:text-5xl">Atlas Pengetahuan Debat</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Matter, mosi, peran, dan kamus dalam halaman bacaan yang dapat dijelajahi.</p>
      </header>
      <div className="mb-7 flex flex-wrap gap-2" role="tablist" aria-label="Bagian bacaan">
        {([ ["mosi", "Mosi", MOTIONS.length], ["matter", "Matter", Object.keys(MATTER).length], ["roles", "Peran", ROLES.length], ["kamus", "Kamus", VOCAB.length] ] as const).map(([key, label, count]) =>
          <Button key={key} role="tab" aria-selected={shelf === key} variant={shelf === key ? "default" : "outline"} onClick={() => { setShelf(key); setPage(0); setQuery(""); }}>{label} <span className="opacity-60">{count}</span></Button>
        )}
      </div>
      <label className="mb-7 flex max-w-xl items-center gap-3 border-b border-border py-3 text-muted-foreground"><Search size={18} /><input className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" aria-label="Cari materi" placeholder={`Cari ${shelf}…`} value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} /></label>
      {node && node.id !== "root" && <section className="reading-detail mb-9 border-y border-primary/40 bg-card p-5 md:p-8" aria-label={`Isi ${node.label}`}>
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{node.label}</h2><Button variant="ghost" size="sm" onClick={() => select(null)} aria-label="Tutup bacaan">✕</Button></div>
        <PanelContent node={node} />
      </section>}
      <div className="reading-branches grid gap-3 md:grid-cols-2">
        {shown.map((entry, i) => <Button key={entry.id} variant="outline" onClick={() => { select(entry.id); document.querySelector(".reading-view")?.scrollTo({ top: 0, behavior: "smooth" }); }} className="reading-item h-auto min-h-44 w-full flex-col items-start justify-start whitespace-normal rounded-sm p-5 text-left transition-transform hover:-translate-y-1">
          <span className="flex w-full items-center justify-between text-xs uppercase text-primary"><span>{entry.meta}</span><span>{String(page * 8 + i + 1).padStart(2, "0")}</span></span>
          <strong className="mt-4 text-lg leading-snug text-foreground">{entry.title}</strong><span className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{entry.body}</span><Network className="mt-auto self-end text-primary" size={17} />
        </Button>)}
      </div>
      {!filtered.length && <p className="py-14 text-muted-foreground">Tidak ada materi yang cocok.</p>}
      <nav className="mt-8 flex items-center justify-center gap-5" aria-label="Halaman materi"><Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft /></Button><span className="text-sm text-muted-foreground">{Math.min(page, pageCount - 1) + 1} / {pageCount}</span><Button variant="outline" size="icon" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya"><ChevronRight /></Button></nav>
    </div>
  </div>;
}