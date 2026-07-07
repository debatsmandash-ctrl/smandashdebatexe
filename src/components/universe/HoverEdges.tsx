import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Graph } from "@/lib/graph/build";
import { useSettings } from "@/lib/store";

/**
 * Straight-line hover edges dengan animasi "transfer packet".
 * - Main pass di Universe.tsx sudah render tree edges (kind !== "link").
 *   Hover pass hanya menambah link-kind edges + neighbor edges yang belum
 *   ada di main tree (skip untuk hindari duplikasi).
 * - Garis lurus (BufferGeometry 2-vertex), tidak lengkung.
 * - Warna gradient + moving highlight (uv-based shader) → efek data mengalir.
 */
type LinkEdge = { a: string; b: string; color?: string; kind?: string };

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}||${b}` : `${b}||${a}`;
}

export function HoverEdges({ graph, activeId }: { graph: Graph; activeId: string | null }) {
  const linkMode = useSettings((s) => s.linkMode);
  const edgeThickness = useSettings((s) => s.edgeThickness);

  // Set of edges already drawn by main pass (tree edges, kind !== "link").
  const mainEdgeKeys = useMemo(() => {
    const s = new Set<string>();
    for (const e of graph.edges) {
      if (e.kind !== "link") s.add(edgeKey(e.a, e.b));
    }
    return s;
  }, [graph]);

  const linkEdges = useMemo<LinkEdge[]>(() => {
    if (!activeId) return [];
    if (linkMode === "all") return [];

    if (linkMode === "tree") {
      const set = new Set<string>([activeId]);
      const queue = [activeId];
      const adj = graph.neighbors;
      while (queue.length) {
        const cur = queue.shift()!;
        const ns = adj.get(cur);
        if (!ns) continue;
        for (const n of ns) {
          if (set.has(n)) continue;
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
        if (!set.has(e.a) || !set.has(e.b)) continue;
        // Skip if already drawn by main pass
        if (mainEdgeKeys.has(edgeKey(e.a, e.b))) continue;
        out.push(e);
      }
      return out;
    }

    // NORMAL: neighbors + link edges — skip yang sudah ada di main tree.
    return graph.edges
      .filter((e) => e.a === activeId || e.b === activeId)
      .filter((e) => !mainEdgeKeys.has(edgeKey(e.a, e.b)));
  }, [activeId, graph, linkMode, mainEdgeKeys]);

  // Geometry (positions + per-vertex progress attribute so shader can animate flow).
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(linkEdges.length * 2 * 3);
    const prog = new Float32Array(linkEdges.length * 2);
    const cA = new Float32Array(linkEdges.length * 2 * 3);
    const cB = new Float32Array(linkEdges.length * 2 * 3);
    linkEdges.forEach((e, i) => {
      const a = graph.byId.get(e.a);
      const b = graph.byId.get(e.b);
      if (!a || !b) return;
      pos[i * 6 + 0] = a.pos[0]; pos[i * 6 + 1] = a.pos[1]; pos[i * 6 + 2] = a.pos[2];
      pos[i * 6 + 3] = b.pos[0]; pos[i * 6 + 4] = b.pos[1]; pos[i * 6 + 5] = b.pos[2];
      prog[i * 2 + 0] = 0;
      prog[i * 2 + 1] = 1;
      const colA = new THREE.Color(a.color || "#ffffff");
      const colB = new THREE.Color(b.color || "#ffffff");
      cA[i * 6 + 0] = colA.r; cA[i * 6 + 1] = colA.g; cA[i * 6 + 2] = colA.b;
      cA[i * 6 + 3] = colA.r; cA[i * 6 + 4] = colA.g; cA[i * 6 + 5] = colA.b;
      cB[i * 6 + 0] = colB.r; cB[i * 6 + 1] = colB.g; cB[i * 6 + 2] = colB.b;
      cB[i * 6 + 3] = colB.r; cB[i * 6 + 4] = colB.g; cB[i * 6 + 5] = colB.b;
    });
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("progress", new THREE.BufferAttribute(prog, 1));
    geom.setAttribute("colorA", new THREE.BufferAttribute(cA, 3));
    geom.setAttribute("colorB", new THREE.BufferAttribute(cB, 3));
    return geom;
  }, [linkEdges, graph]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float progress;
        attribute vec3 colorA;
        attribute vec3 colorB;
        varying float vProgress;
        varying vec3 vColA;
        varying vec3 vColB;
        void main() {
          vProgress = progress;
          vColA = colorA;
          vColB = colorB;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying float vProgress;
        varying vec3 vColA;
        varying vec3 vColB;
        void main() {
          vec3 base = mix(vColA, vColB, vProgress);
          // moving packet along uv.x (progress) 
          float t = fract(uTime * 0.6);
          float d = abs(vProgress - t);
          float packet = smoothstep(0.18, 0.0, d);
          vec3 col = base + packet * vec3(1.0);
          float alpha = 0.55 + 0.45 * packet;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    return mat;
  }, []);

  const matRef = useRef(material);
  useFrame((state) => {
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  if (!activeId || linkMode === "all" || linkEdges.length === 0) return null;
  void edgeThickness;

  return <lineSegments geometry={geometry} material={material} />;
}
