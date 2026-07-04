import { useMemo, useRef } from "react";
import { QuadraticBezierLine } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Graph } from "@/lib/graph/build";
import { useSettings } from "@/lib/store";

/**
 * Render link-edges untuk node yang sedang dipilih/hover.
 * - SEMUA garis SOLID (tidak ada dashed lagi).
 * - Ketebalan mengikuti setting edgeThickness.
 * - Animasi: opacity + width pulse halus untuk memberi rasa "hidup".
 * - Warna: warna node tujuan.
 *
 * Mode tautan:
 *   normal : hanya tetangga langsung dari activeId (behavior lama)
 *   tree   : full-tree BFS dari activeId — SEMUA rantai turunan sampai leaf
 *   all    : SEMUA link edges (dikelola di Universe.tsx, hook ini kembali null)
 */
type LinkEdge = { a: string; b: string; color?: string; kind?: string };

export function HoverEdges({ graph, activeId }: { graph: Graph; activeId: string | null }) {
  const linkMode = useSettings((s) => s.linkMode);
  const edgeThickness = useSettings((s) => s.edgeThickness);

  const linkEdges = useMemo<LinkEdge[]>(() => {
    if (!activeId) return [];
    if (linkMode === "all") {
      // handled elsewhere as static; skip hover
      return [];
    }
    if (linkMode === "tree") {
      // BFS descendant tree via all edges (both link & structural)
      const set = new Set<string>([activeId]);
      const queue = [activeId];
      const adj = graph.neighbors;
      while (queue.length) {
        const cur = queue.shift()!;
        const ns = adj.get(cur);
        if (!ns) continue;
        for (const n of ns) {
          if (set.has(n)) continue;
          // "descendant" heuristic: node farther from root than current via cluster/kind hierarchy
          const child = graph.byId.get(n);
          const parent = graph.byId.get(cur);
          if (!child || !parent) continue;
          const rank = (k: string) => (
            k === "root" ? 0 : k === "cluster" ? 1 : k === "subhub" ? 2 : k === "domain" || k === "letter" ? 3 :
            k === "bab" || k === "school" || k === "bracket" ? 4 : k === "subbab" || k === "team" ? 5 : 6
          );
          if (rank(child.kind) < rank(parent.kind)) continue;
          set.add(n);
          queue.push(n);
        }
      }
      const out: LinkEdge[] = [];
      for (const e of graph.edges) {
        if (set.has(e.a) && set.has(e.b)) out.push(e);
      }
      return out;
    }
    // NORMAL: direct neighbors + true "link"-kind edges
    return graph.edges.filter((e) =>
      (e.a === activeId || e.b === activeId)
    );
  }, [activeId, graph, linkMode]);

  // Frame-driven pulse — mutate ref materials each frame
  const matRefs = useRef<THREE.LineBasicMaterial[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 3.2));
    for (const m of matRefs.current) {
      if (m) m.opacity = 0.55 + 0.4 * pulse;
    }
  });

  if (!activeId || linkMode === "all") return null;

  return (
    <group>
      {linkEdges.map((e, i) => {
        const a = graph.byId.get(e.a);
        const b = graph.byId.get(e.b);
        if (!a || !b) return null;
        const A = new THREE.Vector3(...a.pos);
        const B = new THREE.Vector3(...b.pos);
        const mid = A.clone().add(B).multiplyScalar(0.5);
        const out = mid.clone().normalize().multiplyScalar(mid.length() * 0.18);
        const ctrl = mid.add(out);
        const target = e.a === activeId ? b : a;
        const color = target.color || e.color || "#ffffff";
        return (
          <QuadraticBezierLine
            key={`link-${i}`}
            start={[A.x, A.y, A.z]}
            end={[B.x, B.y, B.z]}
            mid={[ctrl.x, ctrl.y, ctrl.z]}
            color={color}
            lineWidth={edgeThickness}
            transparent
            opacity={0.85}
            dashed={false}
            ref={(el: any) => {
              if (el && el.material) matRefs.current[i] = el.material;
            }}
          />
        );
      })}
    </group>
  );
}
