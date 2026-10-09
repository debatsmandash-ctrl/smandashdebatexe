import { useEffect, useState } from "react";
import { CheckCircle2, Download, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function OfflineStatus() {
  const [ready, setReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistration().then((registration) => setReady(Boolean(registration?.active && navigator.serviceWorker.controller)));
    const onController = () => setReady(true);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  return <div className="offline-status fixed bottom-16 right-3 z-40 md:bottom-4 md:right-4">
    <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="border-border/70 bg-card/90 shadow-lg backdrop-blur-xl">
      {ready ? <CheckCircle2 /> : <WifiOff />}{ready ? "Luring siap" : "Luring belum siap"}
    </Button>
    {open && <div className="absolute bottom-11 right-0 w-[min(20rem,calc(100vw-1.5rem))] border border-border bg-card p-4 shadow-2xl">
      <p className="text-sm font-semibold text-foreground">{ready ? "Materi inti sudah siap dibuka tanpa internet." : "Buka aplikasi terbit sekali saat daring untuk menyiapkan materi luring."}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Android: buka menu Chrome, pilih “Tambahkan ke layar utama” atau “Instal aplikasi”.</p>
      {installPrompt && <Button size="sm" className="mt-3 w-full" onClick={async () => { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }}><Download /> Instal di Android</Button>}
    </div>}
  </div>;
}