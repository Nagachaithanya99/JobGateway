export function toAbsoluteMediaUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api");
  const origin = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}
