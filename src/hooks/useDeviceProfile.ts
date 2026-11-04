import { useMemo } from "react";
import type { QualityPreset } from "@/lib/store";

export type DeviceTier = "desktop" | "mobile";

export interface DeviceProfile {
  tier: DeviceTier;
  dpr: [number, number];
  nebulaSteps: number;
  bloomIntensity: number;
  bloomRadius: number;
  chromaticAberration: boolean;
  starSegments: number;
  haloLayers: 1 | 2;
  damping: number;
  rotateSpeed: number;
  crustShells: number;
  crustOctaves: number;
}

/**
 * useDeviceProfile — profil kemampuan render.
 * `quality` (preset yang dipilih user) menaikkan/menurunkan angka di atas
 * ceiling perangkat: preset "cinematic" hanya berlaku di desktop; mobile
 * selalu terkunci low (mobile safety ceiling).
 */
export function useDeviceProfile(quality?: QualityPreset): DeviceProfile {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        tier: "desktop", dpr: [2, 3.5], nebulaSteps: 128,
        bloomIntensity: 2.4, bloomRadius: 1.2, chromaticAberration: true,
        starSegments: 48, haloLayers: 2, damping: 0.08, rotateSpeed: 0.35,
        crustShells: 3, crustOctaves: 7,
      };
    }
    const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
    if (isMobile) {
      return {
        tier: "mobile", dpr: [1, 1], nebulaSteps: 12,
        bloomIntensity: 1.5, bloomRadius: 0.9, chromaticAberration: false,
        starSegments: 8, haloLayers: 1, damping: 0.12, rotateSpeed: 0.75,
        crustShells: 1, crustOctaves: 2,
      };
    }
    // Desktop / high-end
    const mem = (navigator as any).deviceMemory ?? 8;
    const hiEnd = mem >= 8 && (navigator.hardwareConcurrency ?? 4) >= 8;
    const base: DeviceProfile = {
      tier: "desktop",
      dpr: hiEnd ? [2, 3.5] : [1.5, 2.5],
      nebulaSteps: hiEnd ? 128 : 64,
      bloomIntensity: hiEnd ? 2.4 : 1.7,
      bloomRadius: hiEnd ? 1.2 : 1.05,
      chromaticAberration: true,
      starSegments: hiEnd ? 48 : 28,
      haloLayers: 2,
      damping: 0.08,
      rotateSpeed: hiEnd ? 0.35 : 0.5,
      crustShells: hiEnd ? 3 : 2,
      crustOctaves: hiEnd ? 7 : 5,
    };
    // Preset CINEMATIC — kelas laptop gaming: DPR tinggi, segmen bintang 64,
    // oktaf crust 8, bloom ekstra. Hanya di desktop.
    if (quality === "cinematic") {
      return {
        ...base,
        dpr: [Math.max(1.75, base.dpr[0]), 3],
        nebulaSteps: 96,
        bloomIntensity: Math.max(2.8, base.bloomIntensity),
        bloomRadius: 1.35,
        starSegments: 64,
        crustShells: Math.max(3, base.crustShells),
        crustOctaves: 8,
      };
    }
    // Preset rendah menurunkan angka meski di desktop kuat
    if (quality === "medium" || quality === "low") {
      return {
        ...base,
        dpr: [1, 1.5],
        nebulaSteps: quality === "low" ? 12 : 24,
        bloomIntensity: 1.2,
        chromaticAberration: false,
        starSegments: 16,
        crustShells: 1,
        crustOctaves: quality === "low" ? 3 : 4,
      };
    }
    if (quality === "high") {
      return { ...base, starSegments: Math.min(base.starSegments, 32), crustOctaves: Math.min(base.crustOctaves, 6) };
    }
    return base;
  }, [quality]);
}
