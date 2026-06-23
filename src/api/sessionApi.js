export async function initializeSession(apiFetch) {
  // Backend currently expects GET /initialize
  const res = await apiFetch("/initialize", { method: "GET" });
  const data = await res.json();

  // Persist token if backend returns one
  if (data?.token) localStorage.setItem("token", data.token);
  return data;
}

export async function fetchSession(apiFetch) {
  const response = await apiFetch("/check-session", { method: "GET" });
  return response.json();
}
