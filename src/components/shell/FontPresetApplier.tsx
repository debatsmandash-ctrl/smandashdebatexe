import { useEffect } from "react";
import { useSettings } from "@/lib/store";
import { applyFontPreset } from "@/lib/fonts";

/** Applies the selected font preset globally via CSS variables. */
export function FontPresetApplier() {
  const preset = useSettings((s) => s.fontPreset);
  useEffect(() => { applyFontPreset(preset); }, [preset]);
  return null;
}
