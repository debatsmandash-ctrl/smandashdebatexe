import { Trophy, Users, GraduationCap, Flag, ChevronRight } from "lucide-react";
import { ACHIEVEMENTS, ACTIVE_MEMBERS, SELECTION_2627 } from "@/data";
import { Button } from "@/components/ui/button";
import { useUniverse } from "@/lib/store";

export function ClubPanel({ refId }: { refId: string }) {
  const select = useUniverse((state) => state.select);
  const members = ACTIVE_MEMBERS.find((school) => school.rosterKind === "members");
  const leaders = members?.teams.flatMap((group) => group.speakers).filter((member) => member.office) ?? [];
  if (refId.startsWith("achievement:")) {
    const item = ACHIEVEMENTS.find((achievement) => `achievement:${achievement.id}` === refId);
    if (!item) return null;
    return <div className="space-y-5 text-foreground">
      <div className="flex flex-wrap items-center gap-3 text-primary"><Trophy size={22} /><span>{item.tahun ?? "Tahun belum dicantumkan"}</span></div>
      <h3 className="text-2xl font-semibold">{item.hasil}</h3>
      <p className="text-sm leading-7 text-muted-foreground">{item.desc}</p>
      {item.tahapan && <ol className="grid gap-3 border-l border-primary pl-4">{item.tahapan.map((stage, index) => <li key={stage} className="flex items-center gap-3 text-sm"><Flag size={16} className="shrink-0 text-primary" /><span>{index + 1}. {stage}</span></li>)}</ol>}
      <p className="text-xs text-muted-foreground">Catatan prestasi SMANDASH.</p>
      {item.url && <a className="inline-flex text-sm text-primary underline" href={item.url} target="_blank" rel="noreferrer">Arsip resmi kompetisi ↗</a>}
    </div>;
  }
  if (refId === "smandash:selection-archive") {
    return <div className="space-y-5 text-foreground"><h3 className="text-xl font-semibold">{SELECTION_2627.nama}</h3><p className="text-sm text-muted-foreground">{SELECTION_2627.status} · bukan peringkat atau jabatan tetap</p>
      {SELECTION_2627.catatan.map((note) => <p key={note} className="text-sm leading-6 text-muted-foreground">{note}</p>)}
      <div className="overflow-x-auto"><table className="w-full min-w-96 text-left text-sm"><thead><tr className="border-b border-border"><th className="p-2">Ronde</th><th className="p-2">Pro</th><th className="p-2">Kontra</th><th className="p-2">Total</th></tr></thead><tbody>{SELECTION_2627.hasil.map((row) => <tr key={row.round} className="border-b border-border"><td className="p-2">{row.round}</td><td className="p-2">{row.pro} · {row.proPoin}</td><td className="p-2">{row.kontra} · {row.kontraPoin}</td><td className="p-2">{row.total}</td></tr>)}</tbody></table></div>
      <dl className="space-y-2">{Object.entries(SELECTION_2627.penghargaan).map(([key, value]) => <div key={key} className="border-l border-primary pl-3 text-sm">{value}</div>)}</dl>
    </div>;
  }
  if (refId === "smandash:achievements") {
    return <div className="space-y-4 text-foreground"><h3 className="flex items-center gap-2 text-xl font-semibold"><Trophy size={20} /> Jejak Prestasi</h3><p className="text-sm text-muted-foreground">9 catatan · 2025–2026 · dua tahun delegasi nasional</p>
      {ACHIEVEMENTS.map((item) => <Button key={item.id} variant="outline" className="h-auto w-full justify-between gap-3 whitespace-normal p-4 text-left" onClick={() => select(`achievement:${item.id}`)}><span className="min-w-0"><span className="block text-xs text-primary">{item.tahun ?? "Tahun belum dicantumkan"} · {item.hasil}</span><span className="mt-2 block">{item.nama}</span></span><ChevronRight size={16} className="shrink-0" /></Button>)}
    </div>;
  }
  return <div className="space-y-6 text-foreground">
    <section className="space-y-3"><h3 className="flex items-center gap-2 text-xl font-semibold"><Users size={20} /> Kepengurusan</h3>{leaders.map((member) => <Button key={member.id} variant="outline" className="h-auto w-full flex-col items-start whitespace-normal p-4 text-left" onClick={() => select(`active_member:speaker:${member.id}`)}><span className="text-xs text-primary">{member.office}</span><span className="mt-2">{member.fullname ?? member.nama}</span></Button>)}</section>
    {refId !== "smandash:leadership" && <section className="space-y-3"><h3 className="flex items-center gap-2 text-xl font-semibold"><GraduationCap size={20} /> Struktur Anggota</h3>{ACTIVE_MEMBERS.map((school) => <Button key={school.id} variant="outline" className="h-auto w-full justify-between whitespace-normal p-4 text-left" onClick={() => select(`active_member:school:${school.id}`)}><span>{school.short}<span className="mt-1 block text-xs text-muted-foreground">{school.teams.reduce((total, group) => total + group.speakers.length, 0)} orang</span></span><ChevronRight size={16} /></Button>)}</section>}
  </div>;
}