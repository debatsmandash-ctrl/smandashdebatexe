export interface NodeOverride {
  label?: string;
  desc?: string;
  deleted?: boolean;
}

export type Overrides = Record<string, NodeOverride>;

const KEY = "smandash_overrides_v1";

let cache: Overrides | null = null;

export function loadOverrides(): Overrides {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = {});
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

export async function syncOverridesFromCloud(): Promise<Overrides> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.from("node_overrides").select("node_id,label,description,deleted");
  if (error) throw error;
  const overrides: Overrides = {};
  for (const row of data ?? []) overrides[row.node_id] = {
    label: row.label ?? undefined,
    desc: row.description ?? undefined,
    deleted: row.deleted,
  };
  saveOverrides(overrides);
  return overrides;
}

export async function userCanEdit(): Promise<boolean> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
  return (data ?? []).some((row) => row.role === "editor" || row.role === "admin");
}

export async function saveCloudOverride(id: string, patch: Partial<NodeOverride>) {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Masuk diperlukan untuk menyimpan.");
  const { error } = await supabase.from("node_overrides").upsert({
    node_id: id,
    label: patch.label ?? null,
    description: patch.desc ?? null,
    deleted: patch.deleted ?? false,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  setOverride(id, patch);
}

export async function clearCloudOverrides() {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase.from("node_overrides").delete().not("node_id", "is", null);
  if (error) throw error;
  clearOverrides();
}

export function saveOverrides(o: Overrides) {
  cache = o;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(o));
  }
}

export function setOverride(id: string, patch: Partial<NodeOverride>) {
  const o = { ...loadOverrides() };
  o[id] = { ...(o[id] || {}), ...patch };
  saveOverrides(o);
}

export function clearOverrides() {
  saveOverrides({});
}

export function exportOverrides(): string {
  return JSON.stringify(loadOverrides(), null, 2);
}
