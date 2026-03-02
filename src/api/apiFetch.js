export async function apiFetch(path, options = {}) {
  const baseUrl = import.meta.env.VITE_NODE_URL; // must be consistent (same host each time)
  const token = localStorage.getItem("token");

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