import { useEffect, useMemo, useRef } from "react";
import { buildGraph } from "@/lib/graph/build";
import { useSettings, useUniverse } from "@/lib/store";

/**
 * Graph2D — tampilan graf 2D ala Obsidian.
 * - Simulasi gaya (repulsi Barnes-Hut sederhana + pegas tautan + gravitasi pusat)
 * - Node bisa ditarik, dilepas, atau dipaku (pin) dengan klik kanan
 * - Pan (drag latar), zoom di kursor (wheel non-passive)
 * - Hover menyorot tetangga; opsional "chain drag" menyeret tetangga
 */

interface P {
  id: string;
  x: number; y: number; vx: number; vy: number;
  r: number; color: string; label: string; deg: number; pinned: boolean;
}

const RANK = (k: string) =>
  k === "root" ? 0 : k === "cluster" ? 1 : k === "subhub" ? 2 :
  k === "domain" || k === "letter" ? 3 :
  k === "bab" || k === "school" || k === "bracket" ? 4 : 5;

export function Graph2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useMemo(() => buildGraph(), []);
  const select = useUniverse((s) => s.select);
  const hover = useUniverse((s) => s.hover);
  const selectedId = useUniverse((s) => s.selectedId);
  const settings = useSettings();
  const update = useSettings((s) => s.update);

  // Simpan setting terbaru dalam ref supaya efek utama tidak perlu re-mount.
  const cfg = useRef(settings);
  cfg.current = settings;
  const selRef = useRef(selectedId);
  selRef.current = selectedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ─── hitung jumlah keturunan (hierarki) untuk ukuran node ───
    const descCount = new Map<string, number>();
    {
      const memo = new Map<string, number>();
      const visit = (id: string, seen: Set<string>): number => {
        if (memo.has(id)) return memo.get(id)!;
        const self = graph.byId.get(id);
        if (!self) return 0;
        let total = 0;
        for (const nid of graph.neighbors.get(id) ?? []) {
          const child = graph.byId.get(nid);
          if (!child || seen.has(nid)) continue;
          if (RANK(child.kind) <= RANK(self.kind)) continue;
          seen.add(nid);
          total += 1 + visit(nid, seen);
        }
        memo.set(id, total);
        return total;
      };
      for (const n of graph.nodes) descCount.set(n.id, visit(n.id, new Set([n.id])));
    }

    // ─── bangun partikel ───
    const pinned = cfg.current.g2dPinned || {};
    const nodes: P[] = graph.nodes.map((n, i) => {
      const deg = graph.neighbors.get(n.id)?.length ?? 0;
      const rank = RANK(n.kind);
      const golden = i * 2.399963;
      const rad = 60 + rank * 220 + (i % 37) * 4;
      const pin = pinned[n.id];
      return {
        id: n.id,
        x: pin ? pin.x : Math.cos(golden) * rad,
        y: pin ? pin.y : Math.sin(golden) * rad,
        vx: 0, vy: 0,
        // makin banyak percabangan/keturunan → makin besar bulatannya
        r: Math.min(26, 3.2 * (1 + Math.log2(1 + (descCount.get(n.id) ?? 0)) * 0.62) + (rank === 0 ? 4 : 0)),
        color: n.color || "#8fb8ff",
        label: n.label,
        deg,
        pinned: !!pin,
      };
    });
    const index = new Map(nodes.map((p, i) => [p.id, i]));
    const links = graph.edges
      .map((e) => ({ a: index.get(e.a)!, b: index.get(e.b)!, kind: e.kind }))
      .filter((l) => l.a !== undefined && l.b !== undefined);

    const rankOf: number[] = graph.nodes.map((n) => RANK(n.kind));
    const nbr: number[][] = nodes.map(() => []);
    for (const l of links) { nbr[l.a].push(l.b); nbr[l.b].push(l.a); }

    // ─── kamera ───
    let zoom = 0.55;
    let ox = 0, oy = 0; // offset dunia→layar (px)
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const toWorld = (sx: number, sy: number) => ({
      x: (sx - canvas.clientWidth / 2 - ox) / zoom,
      y: (sy - canvas.clientHeight / 2 - oy) / zoom,
    });

    // ─── interaksi ───
    let hoverIdx = -1;
    let dragIdx = -1;
    let dragChain: number[] = [];
    let panning = false;
    let last = { x: 0, y: 0 };
    let moved = false;

    const pick = (sx: number, sy: number) => {
      const w = toWorld(sx, sy);
      let best = -1, bd = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const d = (nodes[i].x - w.x) ** 2 + (nodes[i].y - w.y) ** 2;
        const rr = (nodes[i].r + 6 / zoom) ** 2;
        if (d < rr && d < bd) { bd = d; best = i; }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      moved = false;
      const rect = canvas.getBoundingClientRect();
      const i = pick(e.clientX - rect.left, e.clientY - rect.top);
      if (i >= 0) {
        dragIdx = i;
        dragChain = cfg.current.g2dChainDrag ? nbr[i] : [];
      } else {
        panning = true;
        last = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) moved = true;
      if (panning) {
        ox += e.clientX - last.x;
        oy += e.clientY - last.y;
        last = { x: e.clientX, y: e.clientY };
        return;
      }
      if (dragIdx >= 0) {
        const w = toWorld(sx, sy);
        const dx = w.x - nodes[dragIdx].x, dy = w.y - nodes[dragIdx].y;
        nodes[dragIdx].x = w.x; nodes[dragIdx].y = w.y;
        nodes[dragIdx].vx = 0; nodes[dragIdx].vy = 0;
        for (const j of dragChain) {
          nodes[j].x += dx * 0.35; nodes[j].y += dy * 0.35;
        }
        return;
      }
      const i = pick(sx, sy);
      if (i !== hoverIdx) {
        hoverIdx = i;
        hover(i >= 0 ? nodes[i].id : null);
        canvas.style.cursor = i >= 0 ? "pointer" : "grab";
      }
    };
    const onUp = (e: PointerEvent) => {
      if (dragIdx >= 0) {
        const p = nodes[dragIdx];
        if (moved) {
          // node yang digeser otomatis dipaku (seperti Obsidian saat ditahan)
          p.pinned = true;
          update({ g2dPinned: { ...(cfg.current.g2dPinned || {}), [p.id]: { x: p.x, y: p.y } } });
        } else {
          select(p.id);
        }
      }
      dragIdx = -1; dragChain = []; panning = false;
      canvas.releasePointerCapture?.(e.pointerId);
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const i = pick(e.clientX - rect.left, e.clientY - rect.top);
      if (i < 0) return;
      const p = nodes[i];
      p.pinned = !p.pinned;
      const next = { ...(cfg.current.g2dPinned || {}) };
      if (p.pinned) next[p.id] = { x: p.x, y: p.y }; else delete next[p.id];
      update({ g2dPinned: next });
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = Math.min(4, Math.max(0.06, zoom * Math.exp(-dy * 0.0015 * cfg.current.zoomSens)));
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left - canvas.clientWidth / 2;
      const py = e.clientY - rect.top - canvas.clientHeight / 2;
      const k = next / zoom;
      ox = px - (px - ox) * k;
      oy = py - (py - oy) * k;
      zoom = next;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("contextmenu", onContext);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ─── simulasi + render ───
    let raf = 0;
    let alpha = 1;
    const tick = () => {
      const c = cfg.current;
      // Jeda total saat tab tidak aktif.
      if (document.hidden) { raf = requestAnimationFrame(tick); return; }
      // gaya
      const repel = c.g2dRepel;
      const spring = c.g2dLinkForce;
      const n = nodes.length;
      // repulsi pada grid spasial supaya O(n) praktis
      const cell = 160;
      const buckets = new Map<string, number[]>();
      for (let i = 0; i < n; i++) {
        const key = `${Math.round(nodes[i].x / cell)},${Math.round(nodes[i].y / cell)}`;
        const arr = buckets.get(key);
        if (arr) arr.push(i); else buckets.set(key, [i]);
      }
      for (let i = 0; i < n; i++) {
        const a = nodes[i];
        const cx = Math.round(a.x / cell), cy = Math.round(a.y / cell);
        for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
          const arr = buckets.get(`${cx + gx},${cy + gy}`);
          if (!arr) continue;
          for (const j of arr) {
            if (j <= i) continue;
            const b = nodes[j];
            let dx = a.x - b.x, dy = a.y - b.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = (i % 7) - 3; dy = (j % 7) - 3; d2 = 9; }
            if (d2 > cell * cell * 4) continue;
            const f = (repel * alpha) / d2;
            const d = Math.sqrt(d2);
            a.vx += (dx / d) * f; a.vy += (dy / d) * f;
            b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
          }
        }
      }
      for (const l of links) {
        const a = nodes[l.a], b = nodes[l.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const rest = 90;
        const f = (d - rest) * spring * alpha * 0.1;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
      for (let i = 0; i < n; i++) {
        const p = nodes[i];
        if (p.pinned || i === dragIdx) { p.vx = 0; p.vy = 0; continue; }
        p.vx -= p.x * 0.0012 * alpha;
        p.vy -= p.y * 0.0012 * alpha;
        p.vx *= 0.86; p.vy *= 0.86;
        p.x += p.vx; p.y += p.vy;
      }
      alpha = Math.max(0.25, alpha * 0.9985);

      // render
      const W = canvas.clientWidth, H = canvas.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#05080f";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2 + ox, H / 2 + oy);
      ctx.scale(zoom, zoom);

      const active = hoverIdx >= 0 && c.g2dHover ? hoverIdx
        : selRef.current ? (index.get(selRef.current) ?? -1) : -1;
      const lit = new Set<number>();
      if (active >= 0) {
        lit.add(active);
        if (c.linkMode === "tree") {
          // turun ke seluruh keturunan…
          const q = [active];
          while (q.length) {
            const cur = q.shift()!;
            for (const j of nbr[cur]) {
              if (lit.has(j) || rankOf[j] <= rankOf[cur]) continue;
              lit.add(j); q.push(j);
            }
          }
          // …lalu naik ke induk sampai pusat
          let cur = active;
          for (let guard = 0; guard < 12; guard++) {
            let best = -1;
            for (const j of nbr[cur]) if (rankOf[j] < rankOf[cur] && (best < 0 || rankOf[j] < rankOf[best])) best = j;
            if (best < 0) break;
            lit.add(best); cur = best;
          }
        } else {
          for (const j of nbr[active]) lit.add(j);
        }
      }

      const lv = c.linkMode;
      ctx.lineWidth = 1 / zoom;
      if (lv !== "stars") for (const l of links) {
        if (lv === "normal" && active < 0) continue;
        if (lv === "tree" && active < 0) continue;
        const on = active < 0 ? true : lit.has(l.a) && lit.has(l.b);
        if ((lv === "normal" || lv === "tree") && !on) continue;
        ctx.globalAlpha = active < 0 ? 0.22 : on ? 0.9 : 0.06;
        ctx.strokeStyle = on && active >= 0 ? nodes[active].color : "#63788f";
        ctx.lineWidth = (on && active >= 0 ? 1.6 : 1) / zoom;
        ctx.beginPath();
        ctx.moveTo(nodes[l.a].x, nodes[l.a].y);
        ctx.lineTo(nodes[l.b].x, nodes[l.b].y);
        ctx.stroke();
      }

      for (let i = 0; i < n; i++) {
        const p = nodes[i];
        const on = active < 0 || lit.has(i);
        ctx.globalAlpha = on ? 1 : 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        if (i === active) {
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 6 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.5 / zoom; ctx.stroke();
        }
        if (p.pinned) {
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 2.5 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.8 / zoom; ctx.stroke();
        }
      }

      if (c.g2dLabels && zoom > 0.45) {
        ctx.globalAlpha = 1;
        ctx.font = `${Math.max(8, 11 / zoom)}px "Space Mono", monospace`;
        ctx.textAlign = "center";
        // Batasi jumlah label yang digambar supaya tetap lancar di graf padat.
        let drawn = 0;
        const LABEL_CAP = 320;
        for (let i = 0; i < n; i++) {
          if (drawn >= LABEL_CAP) break;
          const p = nodes[i];
          if (p.r < 5.5 && zoom < 0.9) continue;
          drawn++;
          const on = active < 0 || lit.has(i);
          ctx.globalAlpha = on ? 0.9 : 0.12;
          ctx.fillStyle = "#dbe7f5";
          ctx.fillText(p.label.slice(0, 26), p.x, p.y - p.r - 5 / zoom);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("contextmenu", onContext);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [graph, select, hover, update]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", touchAction: "none", background: "#05080f" }}
      />
      <div style={{
        position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 24,
        fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.2em",
        color: "rgba(148,163,184,0.55)", textTransform: "uppercase", pointerEvents: "none",
      }}>
        drag node = pindah &amp; paku · klik kanan = lepas paku · drag latar = geser · scroll = zoom
      </div>
    </>
  );
}
