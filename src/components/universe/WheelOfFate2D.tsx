import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraph } from "@/lib/graph/build";
import { useUniverse } from "@/lib/store";
import type { StarNode } from "@/data/types";

/**
 * WheelOfFate2D — 2D bertema Genshin "Wheel of Fate".
 * - Background gradient ungu deep + grid titik + bintang halus.
 * - Cluster ditata di RING konsentris yang bisa BERPUTAR (drag).
 * - Root di pusat dengan ornamen sigil.
 * - Klik node = select. Drag area kosong = putar wheel.
 */
export function WheelOfFate2D() {
  const graph = useMemo(() => buildGraph(), []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const select = useUniverse((s) => s.select);
  const hover = useUniverse((s) => s.hover);
  const selectedId = useUniverse((s) => s.selectedId);
  const hoveredId = useUniverse((s) => s.hoveredId);
  const setLoaded = useUniverse((s) => s.setLoaded);

  // wheel state (refs untuk animasi tanpa re-render)
  const rotRef = useRef(0);
  const spinRef = useRef(0.0006); // idle auto-rotation
  const dragRef = useRef<{ startAng: number; startRot: number; lastT: number; lastAng: number } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => { setLoaded(true); }, [setLoaded]);

  // bintang background statis
  const bgStars = useMemo(() => {
    const arr: { x: number; y: number; r: number; b: number; tw: number }[] = [];
    for (let i = 0; i < 700; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.2 + Math.pow(Math.random(), 3) * 1.3,
        b: 0.25 + Math.random() * 0.55,
        tw: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  // Bagi cluster jadi 3 ring konsentris.
  const ringNodes = useMemo(() => {
    const clusters = graph.nodes.filter((n) => n.kind === "cluster");
    const subhubs = graph.nodes.filter((n) => n.kind === "subhub");
    const rings: { items: StarNode[]; radius: number }[] = [
      { items: clusters.slice(0, 6), radius: 0.26 },
      { items: clusters.slice(6), radius: 0.42 },
      { items: subhubs.slice(0, 10), radius: 0.58 },
    ];
    return rings;
  }, [graph]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      setSize({ w: rect.width, h: rect.height });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Hit test helper
    const nodePositions = (): { id: string; x: number; y: number; r: number; node: StarNode }[] => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const base = Math.min(w, h) * 0.5;
      const out: { id: string; x: number; y: number; r: number; node: StarNode }[] = [];
      ringNodes.forEach((ring, ri) => {
        const ringR = base * ring.radius;
        ring.items.forEach((node, i) => {
          const baseAng = (i / Math.max(1, ring.items.length)) * Math.PI * 2;
          const dirSign = ri % 2 === 0 ? 1 : -1;
          const ang = baseAng + rotRef.current * dirSign;
          const x = cx + Math.cos(ang) * ringR;
          const y = cy + Math.sin(ang) * ringR;
          const r = (node.kind === "cluster" ? 22 : 16) * dpr;
          out.push({ id: node.id, x, y, r, node });
        });
      });
      return out;
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const t = performance.now() / 1000;

      // Background deep purple
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, "#1a1546");
      grad.addColorStop(0.5, "#13103a");
      grad.addColorStop(1, "#06051a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid titik di pojok kiri & kanan (motif Genshin)
      ctx.fillStyle = "rgba(180,170,255,0.28)";
      for (let gy = 0; gy < 12; gy++) {
        for (let gx = 0; gx < 8; gx++) {
          const px = 24 * dpr + gx * 12 * dpr;
          const py = 60 * dpr + gy * 12 * dpr;
          ctx.beginPath(); ctx.arc(px, py, 0.9 * dpr, 0, Math.PI * 2); ctx.fill();
          // kanan-bawah
          const px2 = w - 24 * dpr - gx * 12 * dpr;
          const py2 = h - 60 * dpr - gy * 12 * dpr;
          ctx.beginPath(); ctx.arc(px2, py2, 0.9 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Bintang halus
      for (const s of bgStars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + s.tw);
        ctx.fillStyle = `rgba(220,210,255,${s.b * tw * 0.7})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Idle spin
      if (!dragRef.current) rotRef.current += spinRef.current;

      const cx = w / 2, cy = h / 2;
      const base = Math.min(w, h) * 0.5;

      // ── Ornamen ring konsentris (silver lines + ticks) ──
      ctx.save();
      ctx.translate(cx, cy);
      const ringRadii = [0.16, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66];
      ringRadii.forEach((rad, idx) => {
        ctx.strokeStyle = `rgba(220,215,255,${0.12 + (idx % 2) * 0.06})`;
        ctx.lineWidth = (idx === 1 || idx === 3 || idx === 5) ? 1.4 * dpr : 0.6 * dpr;
        ctx.beginPath();
        ctx.arc(0, 0, base * rad, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Tick "11 directions" di ring terluar
      ctx.strokeStyle = "rgba(220,215,255,0.5)";
      ctx.lineWidth = 1.2 * dpr;
      for (let i = 0; i < 11; i++) {
        const ang = (i / 11) * Math.PI * 2 - Math.PI / 2 + rotRef.current * 0.5;
        const r1 = base * 0.64;
        const r2 = base * 0.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
        ctx.stroke();
      }

      // Sigil pusat — bunga 4 daun
      const sigR = base * 0.09;
      ctx.strokeStyle = "rgba(230,225,255,0.7)";
      ctx.lineWidth = 1.4 * dpr;
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2 + rotRef.current * 1.5;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * sigR * 0.55, Math.sin(ang) * sigR * 0.55, sigR * 0.6, sigR * 0.3, ang, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Bola tengah
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sigR * 0.6);
      coreGrad.addColorStop(0, "rgba(255,255,255,0.95)");
      coreGrad.addColorStop(0.5, "rgba(200,190,255,0.5)");
      coreGrad.addColorStop(1, "rgba(120,100,200,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sigR * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Node ring ──
      const positions = nodePositions();
      // Garis tipis penghubung dari pusat
      ctx.strokeStyle = "rgba(220,215,255,0.18)";
      ctx.lineWidth = 0.6 * dpr;
      for (const p of positions) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Node
      for (const p of positions) {
        const isSel = p.id === selectedId;
        const isHov = p.id === hoveredId;
        const r = p.r * (isSel || isHov ? 1.25 : 1);
        // Halo
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
        halo.addColorStop(0, `${p.node.color}aa`);
        halo.addColorStop(0.6, `${p.node.color}33`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
        // Border ring perak
        ctx.strokeStyle = isSel ? "#fff" : "rgba(230,225,255,0.85)";
        ctx.lineWidth = (isSel ? 2.2 : 1.3) * dpr;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        // Isi
        ctx.fillStyle = `${p.node.color}cc`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.78, 0, Math.PI * 2); ctx.fill();
        // Label
        ctx.font = `${(p.node.kind === "cluster" ? 11 : 10) * dpr}px DM Sans, sans-serif`;
        ctx.fillStyle = "rgba(240,235,255,0.92)";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(10,8,30,0.95)";
        ctx.shadowBlur = 6 * dpr;
        ctx.fillText(p.node.label, p.x, p.y + r + 14 * dpr);
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    // ── Interaksi ──
    const angleAt = (sx: number, sy: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (sx - rect.left) * dpr - canvas.width / 2;
      const y = (sy - rect.top) * dpr - canvas.height / 2;
      return Math.atan2(y, x);
    };
    const hitTest = (sx: number, sy: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = (sx - rect.left) * dpr;
      const py = (sy - rect.top) * dpr;
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const base = Math.min(w, h) * 0.5;
      let best: { id: string; d: number } | null = null;
      ringNodes.forEach((ring, ri) => {
        const ringR = base * ring.radius;
        ring.items.forEach((node, i) => {
          const baseAng = (i / Math.max(1, ring.items.length)) * Math.PI * 2;
          const dirSign = ri % 2 === 0 ? 1 : -1;
          const ang = baseAng + rotRef.current * dirSign;
          const nx = cx + Math.cos(ang) * ringR;
          const ny = cy + Math.sin(ang) * ringR;
          const r = (node.kind === "cluster" ? 22 : 16) * dpr;
          const d = Math.hypot(nx - px, ny - py);
          if (d < r + 6 * dpr && (!best || d < best.d)) best = { id: node.id, d };
        });
      });
      return (best as { id: string; d: number } | null)?.id ?? null;
    };

    const onDown = (e: PointerEvent) => {
      const id = hitTest(e.clientX, e.clientY);
      if (id) { select(id); return; }
      const a = angleAt(e.clientX, e.clientY);
      dragRef.current = { startAng: a, startRot: rotRef.current, lastT: performance.now(), lastAng: a };
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const a = angleAt(e.clientX, e.clientY);
        const delta = a - dragRef.current.startAng;
        rotRef.current = dragRef.current.startRot + delta;
        const now = performance.now();
        const dt = Math.max(1, now - dragRef.current.lastT);
        spinRef.current = (a - dragRef.current.lastAng) / dt * 16;
        dragRef.current.lastT = now;
        dragRef.current.lastAng = a;
        return;
      }
      const id = hitTest(e.clientX, e.clientY);
      hover(id);
      canvas.style.cursor = id ? "pointer" : "grab";
    };
    const onUp = () => {
      if (dragRef.current) {
        // simpan momentum, tapi cap & decay
        const v = spinRef.current;
        spinRef.current = Math.max(-0.04, Math.min(0.04, v));
        // decay perlahan kembali ke idle
        const decay = () => {
          spinRef.current *= 0.96;
          if (Math.abs(spinRef.current) > 0.0008) {
            requestAnimationFrame(decay);
          } else {
            spinRef.current = 0.0006;
          }
        };
        requestAnimationFrame(decay);
      }
      dragRef.current = null;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [ringNodes, bgStars, selectedId, hoveredId, select, hover]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: "#06051a", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ cursor: "grab", display: "block" }} />
      {/* HUD top-left */}
      <div style={{
        position: "absolute", top: 16, left: 18,
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontStyle: "italic",
        fontSize: 18,
        color: "#e8e2ff",
        textShadow: "0 1px 12px rgba(120,100,220,0.8)",
        maxWidth: size.w * 0.4,
        pointerEvents: "none",
      }}>
        The wheel of fate points in eleven directions.
        <div style={{
          marginTop: 10,
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "Space Mono, monospace",
          fontSize: 10, letterSpacing: "0.3em",
          color: "#c8c0ff",
          padding: "5px 14px",
          background: "rgba(20,15,60,0.55)",
          border: "1px solid rgba(200,190,255,0.35)",
          borderRadius: 99,
          backdropFilter: "blur(6px)",
          pointerEvents: "auto",
        }}>
          ✦ WHEEL OF FATE ✦
        </div>
      </div>
      {/* Hint bottom-center */}
      <div style={{
        position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
        fontFamily: "Space Mono, monospace",
        fontSize: 9, letterSpacing: "0.28em",
        color: "rgba(200,190,255,0.55)",
        pointerEvents: "none",
      }}>
        DRAG TO SPIN · CLICK NODE TO OPEN
      </div>
    </div>
  );
}
