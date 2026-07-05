import { useMemo } from "react";

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

export function useDeviceProfile(): DeviceProfile {
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
        tier: "mobile", dpr: [1, 1.5], nebulaSteps: 22,
        bloomIntensity: 1.5, bloomRadius: 0.9, chromaticAberration: false,
        starSegments: 14, haloLayers: 1, damping: 0.12, rotateSpeed: 0.75,
        crustShells: 1, crustOctaves: 3,
      };
    }
    // Desktop / high-end (Ultra tier — up to RTX 5090)
    const mem = (navigator as any).deviceMemory ?? 8;
    const hiEnd = mem >= 8 && (navigator.hardwareConcurrency ?? 4) >= 8;
    return {
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
  }, []);
}