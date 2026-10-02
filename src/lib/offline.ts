/** App-shell offline is enabled only on the published origin, never in editor/preview. */
export async function registerOfflineApp() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = location.hostname;
  const blocked = !import.meta.env.PROD || window.self !== window.top ||
    host.startsWith("id-preview--") || host.startsWith("preview--") ||
    host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(location.search).get("sw") === "off";
  if (blocked) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((registration) => registration.active?.scriptURL.endsWith("/sw.js") || registration.installing?.scriptURL.endsWith("/sw.js") || registration.waiting?.scriptURL.endsWith("/sw.js")).map((registration) => registration.unregister()));
    return;
  }
  await navigator.serviceWorker.register("/sw.js");
}