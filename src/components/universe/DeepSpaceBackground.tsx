import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * DeepSpaceBackground — latar semesta prosedural (menggantikan skybox foto
 * pada kualitas medium ke atas):
 *  • Nebula shader fbm di sphere BackSide — ungu-biru-amber, intensitas rendah,
 *    drift sangat pelan. Resolusi (jumlah oktaf) mengikuti preset kualitas.
 *  • Galaksi jauh: sprite spiral prosedural di radius sangat jauh.
 *  • Blackhole dekoratif: cincin akresi bercahaya di satu sisi jauh,
 *    tetap di luar area peta agar tidak mengganggu orientasi.
 *  • Debu bintang parallax ekstra pada kualitas high ke atas.
 */

// ─── Nebula shader ──────────────────────────────────────────────────────────
const NEBULA_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function nebulaFragment(octaves: number): string {
  return /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    varying vec3 vDir;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z);
    }
    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < ${octaves}; i++) {
        v += a * noise(p);
        p = p * 2.03 + vec3(11.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 d = vDir;
      float t = uTime * 0.006;

      // Dua lapis fbm: awan lebar + filamen halus
      float n1 = fbm(d * 2.6 + vec3(t, t * 0.6, -t * 0.4));
      float n2 = fbm(d * 6.2 - vec3(t * 0.5, -t * 0.3, t));

      // Pita nebula utama (jarang — biar langit tetap gelap & bercahaya tipis)
      float band = smoothstep(0.42, 0.95, n1);
      float fil = smoothstep(0.55, 1.05, n2) * band;

      vec3 purple = vec3(0.28, 0.12, 0.42);
      vec3 blue   = vec3(0.10, 0.18, 0.38);
      vec3 amber  = vec3(0.42, 0.22, 0.08);

      vec3 col = vec3(0.012, 0.018, 0.045);            // dasar deep space
      col += purple * band * 0.34;
      col += blue * smoothstep(0.5, 1.0, n2) * band * 0.20;
      col += amber * fil * 0.16;
      // bintik bintang kecil berkilau lewat noise bertingkat
      float stars = smoothstep(0.985, 1.0, hash(floor(d * 480.0)));
      col += vec3(stars) * 0.35;

      // Intensitas rendah — nebula sebagai aksen, bukan dominasi
      col *= uOpacity;
      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

// ─── Tekstur galaksi spiral prosedural ──────────────────────────────────────
function makeGalaxyTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2;
  ctx.globalCompositeOperation = "lighter";
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 200; i++) {
      const t = i / 200;
      const ang = arm * Math.PI + t * 3.4;
      const r = t * size * 0.44;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r * 0.42;
      const a = (1 - t) * 0.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
      g.addColorStop(0, `rgba(215,225,255,${a})`);
      g.addColorStop(1, "rgba(215,225,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.16);
  core.addColorStop(0, "rgba(255,238,206,0.9)");
  core.addColorStop(0.45, "rgba(255,222,176,0.3)");
  core.addColorStop(1, "rgba(255,222,176,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Glow radial (dipakai blackhole & debu) ─────────────────────────────────
function makeGlowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Distant galaxies — plane sprites sangat jauh ───────────────────────────
function DistantGalaxies({ tex }: { tex: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number]; scale: number; tilt: number }[] = [];
    let seed = 7717;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 9; i++) {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 880 + rand() * 160;
      list.push({
        pos: [r * s * Math.cos(t), r * s * Math.sin(t), r * u],
        rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
        scale: 60 + rand() * 90,
        tilt: rand() * Math.PI,
      });
    }
    return list;
  }, []);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.0012;
  });

  return (
    <group ref={group}>
      {items.map((g, i) => (
        <mesh key={i} position={g.pos} rotation={g.rot} scale={[g.scale, g.scale * 0.62, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0.34}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Blackhole dekoratif — cincin akresi bercahaya ──────────────────────────
function DecorativeBlackhole({ glowTex }: { glowTex: THREE.Texture }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.08;
  });
  return (
    <group position={[760, -280, 620]} rotation={[THREE.MathUtils.degToRad(24), 0, THREE.MathUtils.degToRad(-14)]}>
      {/* lingkaran hitam (event horizon) */}
      <mesh>
        <sphereGeometry args={[13, 24, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* cincin akresi */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[17, 36, 64]} />
        <meshBasicMaterial
          color="#ffab5e"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* glow gravitasi */}
      <sprite scale={[150, 150, 1]}>
        <spriteMaterial map={glowTex} color="#ff9a4d" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

// ─── Debu bintang parallax ekstra (high/cinematic) ──────────────────────────
function DustLayer({ count }: { count: number }) {
  const geom = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 500 + Math.random() * 700;
      positions[i * 3 + 0] = r * s * Math.cos(t);
      positions[i * 3 + 1] = r * s * Math.sin(t);
      positions[i * 3 + 2] = r * u;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geom}>
      <pointsMaterial size={0.55} sizeAttenuation transparent opacity={0.4} color="#cfe0ff" depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function DeepSpaceBackground({
  opacity = 1,
  steps = 4,
  dust = false,
}: {
  opacity?: number;
  steps?: number;
  dust?: boolean;
}) {
  const galaxyTex = useMemo(() => makeGalaxyTexture(), []);
  const glowTex = useMemo(() => makeGlowTexture("rgba(255,220,180,0.85)", "rgba(255,150,80,0.25)"), []);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const fragment = useMemo(() => nebulaFragment(Math.max(2, Math.min(6, Math.round(steps)))), [steps]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity } },
        vertexShader: NEBULA_VERT,
        fragmentShader: fragment,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [fragment]
  );

  // uOpacity diupdate tanpa rebuild material (slider live)
  useMemo(() => {
    if (matRef.current) matRef.current.uniforms.uOpacity.value = opacity;
  }, [opacity]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1150, 48, 32]} />
        <primitive object={material} attach="material" ref={matRef} />
      </mesh>
      <DistantGalaxies tex={galaxyTex} />
      <DecorativeBlackhole glowTex={glowTex} />
      {dust && <DustLayer count={1400} />}
    </>
  );
}
