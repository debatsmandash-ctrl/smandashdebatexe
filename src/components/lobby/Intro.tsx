import { useEffect, useState } from "react";
import logo from "@/assets/smandash-logo.png";

/**
 * Cinematic Intro — 3.5s brand reveal, skippable via click/tap/Esc/Enter.
 * Fades out to reveal lobby.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("hold"), 900);
    const t2 = window.setTimeout(() => setPhase("out"), 2700);
    const t3 = window.setTimeout(() => { setVisible(false); onDone(); }, 3400);
    const skip = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && !["Escape", "Enter", " "].includes(e.key)) return;
      setPhase("out");
      window.setTimeout(() => { setVisible(false); onDone(); }, 350);
    };
    window.addEventListener("keydown", skip as any);
    window.addEventListener("click", skip as any);
    return () => {
      window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3);
      window.removeEventListener("keydown", skip as any);
      window.removeEventListener("click", skip as any);
    };
  }, [onDone]);

  if (!visible) return null;

  const opacity = phase === "out" ? 0 : 1;
  const logoScale = phase === "in" ? 0.7 : phase === "hold" ? 1 : 1.08;
  const logoOpacity = phase === "in" ? 0 : 1;
  const textOpacity = phase === "in" ? 0 : phase === "hold" ? 1 : 0.7;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "linear-gradient(180deg, #05070d 0%, #0A0E1A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        opacity, transition: "opacity 700ms ease-out",
        fontFamily: "'Inter', system-ui, sans-serif", color: "#E5E7EB",
      }}
    >
      {/* radial accent */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.18) 0%, transparent 55%)",
      }} />
      {/* particles */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0.5px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.35) 0.5px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.3) 0.5px, transparent 1px), radial-gradient(circle at 65% 20%, rgba(255,255,255,0.35) 0.5px, transparent 1px)",
        backgroundSize: "200px 200px, 260px 260px, 220px 220px, 180px 180px",
        opacity: 0.5,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        transition: "opacity 900ms ease-out, transform 1600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <img src={logo} alt="" style={{ width: 96, height: 96, borderRadius: 20, boxShadow: "0 20px 60px rgba(59,130,246,0.35)" }} />
      </div>

      <div style={{
        marginTop: 32, textAlign: "center",
        opacity: textOpacity, transition: "opacity 900ms ease-out",
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "#F9FAFB" }}>
          Debate Coach Toolkit
        </div>
        <div style={{ marginTop: 10, fontSize: 12, letterSpacing: "0.24em", color: "#3B82F6", textTransform: "uppercase" }}>
          SMANDASH × Rojaaks · v1.1
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 32, fontSize: 11, letterSpacing: "0.24em", color: "#4B5563",
        textTransform: "uppercase",
      }}>
        Tap anywhere to skip
      </div>
    </div>
  );
}
