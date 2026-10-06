import { useState } from "react";
import { useUniverse } from "@/lib/store";
import { userCanEdit } from "@/lib/editor/overrides";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function EditorUnlockModal() {
  const open = useUniverse((s) => s.editorUnlockOpen);
  const setOpen = useUniverse((s) => s.setEditorUnlockOpen);
  const setEditorMode = useUniverse((s) => s.setEditorMode);
  const editorMode = useUniverse((s) => s.editorMode);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true); setErr(null);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      setBusy(false);
      return;
    }
    if (await userCanEdit()) {
      setEditorMode(true);
      setOpen(false);
      setErr(null);
    } else {
      setErr("Akun ini belum diberi izin editor.");
    }
    setBusy(false);
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(5,8,15,0.82)", backdropFilter: "blur(12px)",
        zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 92vw)", background: "rgba(11,18,32,0.96)",
          border: "1px solid rgba(168,85,247,0.4)", borderRadius: 6,
          boxShadow: "0 30px 80px -20px #a855f755", padding: "24px 22px",
        }}
      >
        <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.4em", color: "#a855f7" }}>
          MODE EDITOR
        </div>
        <h3 style={{ fontFamily: "Bebas Neue", fontSize: 26, letterSpacing: "0.06em", color: "#e8f4ff", marginTop: 6 }}>
          Buka Akses Editor
        </h3>
        <p style={{ fontFamily: "DM Sans", fontSize: 13, lineHeight: 1.6, color: "#8ba3c0", marginTop: 8 }}>
          {editorMode
            ? "Editor sudah aktif. Tutup modal ini untuk mengubah node dari panel kanan."
            : "Masuk dengan akun Google yang telah diberi izin editor."}
        </p>
        {!editorMode && (
          <>
            {err && <div style={{ marginTop: 8, color: "#ff5c5c", fontFamily: "Space Mono", fontSize: 11 }}>{err}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >Batal</Button>
              <Button onClick={() => void submit()} disabled={busy} className="flex-1">
                {busy ? "Memeriksa…" : "Masuk & buka"}
              </Button>
            </div>
          </>
        )}
        {editorMode && (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Button variant="outline"
              onClick={() => { setEditorMode(false); setOpen(false); }}
              className="flex-1"
            >Matikan</Button>
            <Button
              onClick={() => setOpen(false)}
              className="flex-1"
            >Tutup</Button>
          </div>
        )}
      </div>
    </div>
  );
}