const normalizeBaseUrl = (rawValue) => {
  const value = String(rawValue || "").trim();
  return value ? value.replace(/\/+$/, "") : "";
};

export function getApiBaseUrl() {
  const localUrl = normalizeBaseUrl(import.meta.env.VITE_NODE_URL_LOCAL || import.meta.env.VITE_NODE_URL1);
  const lanUrl = normalizeBaseUrl(import.meta.env.VITE_NODE_URL_LAN);
  const defaultUrl = normalizeBaseUrl(import.meta.env.VITE_NODE_URL);

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if (isLocalHost && localUrl) return localUrl;
    if (!isLocalHost && lanUrl) return lanUrl;
  }

  return defaultUrl || localUrl || lanUrl || "http://localhost:3000";
}

export async function apiFetch(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include", // allow cookies if server sets them
  });

  return res;
}