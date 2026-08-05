import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Graph } from "@/lib/graph/build";

/**
 * Renderer garis utama (tree edges) sebagai SATU lineSegments dengan shader:
 * - garis lurus, tidak putus-putus
 * - paket cahaya berjalan sepanjang garis (arah induk → anak)
 * - denyut opasitas halus; garis yang tidak aktif sangat redup
 * Jauh lebih ringan daripada satu <line> per edge.
 */
export function FlowEdges({
  graph,
  litSet,
  anyActive,
  showAll,
}: {
  graph: Graph;
  litSet: Set<string>;
  anyActive: boolean;
  showAll: boolean;
}) {
  const edges = useMemo(
    () => graph.edges.filter((e) => (showAll ? true : e.kind !== "link")),
    [graph, showAll]
  );

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const n = edges.length;
    const pos = new Float32Array(n * 6);
    const prog = new Float32Array(n * 2);
    const col = new Float32Array(n * 6);
    const phase = new Float32Array(n * 2);
    edges.forEach((e, i) => {
      const a = graph.byId.get(e.a);
      const b = graph.byId.get(e.b);
      if (!a || !b) return;
      pos.set([a.pos[0], a.pos[1], a.pos[2], b.pos[0], b.pos[1], b.pos[2]], i * 6);
      prog[i * 2] = 0;
      prog[i * 2 + 1] = 1;
      const ca = new THREE.Color(e.color || a.color || "#ffffff");
      const cb = new THREE.Color(e.color || b.color || "#ffffff");
      col.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], i * 6);
      const ph = (i * 0.6180339887) % 1;
      phase[i * 2] = ph;
      phase[i * 2 + 1] = ph;
    });
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("progress", new THREE.BufferAttribute(prog, 1));
    geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geom.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
    geom.setAttribute("lit", new THREE.BufferAttribute(new Float32Array(n * 2), 1));
    return geom;
  }, [edges, graph]);

  // Update atribut `lit` tanpa membangun ulang geometri.
  useMemo(() => {
    const attr = geometry.getAttribute("lit") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    edges.forEach((e, i) => {
      const on = !anyActive ? 0.5 : litSet.has(e.a) && litSet.has(e.b) ? 1 : 0;
      arr[i * 2] = on;
      arr[i * 2 + 1] = on;
    });
    attr.needsUpdate = true;
  }, [geometry, edges, litSet, anyActive]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float progress;
          attribute float phase;
          attribute float lit;
          varying float vProgress;
          varying float vPhase;
          varying float vLit;
          varying vec3 vColor;
          void main() {
            vProgress = progress;
            vPhase = phase;
            vLit = lit;
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying float vProgress;
          varying float vPhase;
          varying float vLit;
          varying vec3 vColor;
          void main() {
            // paket data: kepala terang + ekor memudar, berjalan induk → anak
            float speed = vLit > 0.9 ? 0.55 : 0.24;
            float t = fract(uTime * speed + vPhase);
            float d = vProgress - t;
            float head = smoothstep(0.05, 0.0, abs(d));
            float tail = smoothstep(0.30, 0.0, max(0.0, -d));
            float packet = max(head, tail * 0.55);
            float breathe = 0.88 + 0.12 * sin(uTime * 1.2 + vPhase * 6.2831);
            float base = vLit > 0.9 ? 0.55 : (vLit > 0.1 ? 0.20 : 0.07);
            float glow = vLit > 0.9 ? packet * 1.25 : packet * 0.35;
            vec3 col = vColor * (0.85 + glow * 1.8);
            float alpha = (base * breathe) + glow;
            if (alpha < 0.004) discard;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const matRef = useRef(material);
  useFrame((state) => {
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
