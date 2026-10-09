import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import nebulaAsset from "@/assets/milkyway_pano_hd.jpg.asset.json";
import { useDeviceProfile } from "@/hooks/useDeviceProfile";

/**
 * MilkyWaySky — texture-based nebula skybox.
 * Nebula ungu-biru padat + bintang banyak (referensi gambar user).
 * Equirectangular-ish photo di-wrap ke sphere besar dengan BackSide.
 */
export function MilkyWaySky({ opacity = 1 }: { opacity?: number }) {
  const tex = useLoader(THREE.TextureLoader, nebulaAsset.url);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const profile = useDeviceProfile();
  const segments: [number, number] = profile.tier === "mobile" ? [32, 20] : [128, 80];

  useMemo(() => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
  }, [tex]);

  // Drift sangat pelan
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.0012;
    if (matRef.current) matRef.current.opacity = opacity;
  });

  return (
    <group
      ref={groupRef}
      rotation={[0, THREE.MathUtils.degToRad(22), THREE.MathUtils.degToRad(6)]}
    >
      <mesh frustumCulled={false} scale={[-1, 1, 1]}>
        <sphereGeometry args={[1100, segments[0], segments[1]]} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Rim-light dari nebula — warna sesuai foto ungu-biru */}
      {profile.tier === "desktop" && <>
        <pointLight position={[380, 60, 120]} intensity={0.56} color="#b89aff" distance={780} decay={1.8} />
        <pointLight position={[-340, -40, -100]} intensity={0.46} color="#7fa8e8" distance={680} decay={1.8} />
        <pointLight position={[60, 280, -80]} intensity={0.26} color="#e8d4ff" distance={620} decay={2} />
      </>}
      <ambientLight intensity={0.07} color="#a8b8e0" />
    </group>
  );
}
