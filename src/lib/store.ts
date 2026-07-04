import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FontPreset } from "@/lib/fonts";

export type QualityPreset = "low" | "medium" | "high" | "ultra";
export type FpsCap = 0 | 30 | 60 | 120;

export type MobileLayout = "sheet" | "pills";
export type PlayMode = "shuffle" | "sequential";

/**
 * Link visibility modes:
 * - normal : hover/klik = tampilkan tautan node itu; lain redup (default)
 * - tree   : klik domain/hub = highlight seluruh rantai turunan sampai leaf
 * - all    : semua garis dan label ditampilkan (perf-heavy)
 */
export type LinkMode = "normal" | "tree" | "all";


export interface Settings {
  quality: QualityPreset;
  fpsCap: FpsCap;
  showFps: boolean;
  bloomIntensity: number;
  nebulaOpacity: number;
  starSize: number;
  showHoverEdges: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  damping: number;
  audioMuted: boolean;
  audioVolume: number;
  reducedMotion: boolean;
  highContrastLabels: boolean;
  mobileLayout: MobileLayout;
  enabledTracks: Record<string, boolean>;
  playMode: PlayMode;

  // NEW: link/hover visibility modes
  linkMode: LinkMode;
  treeHoverEnabled: boolean;          // aktifkan hover-on-tree juga
  edgeThickness: number;              // 1..4 solid line width

  // NEW: font preset
  fontPreset: FontPreset;

  // NEW: lobby / intro gate
  lobbySeen: boolean;

  // Offset draggable panel (desktop). { x, y } pixel relatif posisi default.
  sidebarOffset: { x: number; y: number };
  sidePanelOffset: { x: number; y: number };
}

const isMobileEnv = typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth < 900);

export const DEFAULT_SETTINGS: Settings = {
  quality: isMobileEnv ? "low" : "ultra",
  fpsCap: 60,
  showFps: false,
  bloomIntensity: isMobileEnv ? 0.4 : 0.7,
  nebulaOpacity: isMobileEnv ? 0.55 : 0.95,
  starSize: 1.0,
  showHoverEdges: true,
  autoRotate: !isMobileEnv,
  autoRotateSpeed: 0.25,
  damping: 0.1,
  audioMuted: true,
  audioVolume: 0.35,
  reducedMotion: false,
  highContrastLabels: false,
  mobileLayout: "sheet",
  enabledTracks: {},
  playMode: "shuffle",
  linkMode: "normal",
  treeHoverEnabled: true,
  edgeThickness: 1.8,
  fontPreset: "default",
  lobbySeen: false,
  sidebarOffset: { x: 0, y: 0 },
  sidePanelOffset: { x: 0, y: 0 },
};

interface UniverseState {
  selectedId: string | null;
  hoveredId: string | null;
  focusClusterKey: string | null;
  searchOpen: boolean;
  settingsOpen: boolean;
  assistantOpen: boolean;
  loaded: boolean;
  editorMode: boolean;
  editorUnlockOpen: boolean;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  focusCluster: (k: string | null) => void;
  setSearchOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setAssistantOpen: (v: boolean) => void;
  setLoaded: (v: boolean) => void;
  setEditorMode: (v: boolean) => void;
  setEditorUnlockOpen: (v: boolean) => void;
}

export const useUniverse = create<UniverseState>((set) => ({
  selectedId: null,
  hoveredId: null,
  focusClusterKey: null,
  searchOpen: false,
  settingsOpen: false,
  assistantOpen: false,
  loaded: false,
  editorMode: typeof window !== "undefined" && sessionStorage.getItem("editor_unlocked") === "1",
  editorUnlockOpen: false,
  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),
  focusCluster: (k) => set({ focusClusterKey: k, selectedId: k ? `cluster:${k}` : null }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setAssistantOpen: (v) => set({ assistantOpen: v }),
  setLoaded: (v) => set({ loaded: v }),
  setEditorMode: (v) => { if (typeof window !== "undefined") { if (v) sessionStorage.setItem("editor_unlocked","1"); else sessionStorage.removeItem("editor_unlocked"); } set({ editorMode: v }); },
  setEditorUnlockOpen: (v) => set({ editorUnlockOpen: v }),
}));

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch as Settings),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "smandash-settings-v3",
      // merge persisted state onto defaults so new fields exist for old clients
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    }
  )
);
