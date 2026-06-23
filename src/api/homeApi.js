export async function fetchStores(nodeUrl) {
  const response = await fetch(`${nodeUrl}/getStores`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.status}`);
  }
  return response.json();
}

export async function fetchFlyerBookImages(nodeUrl, flyerBookId) {
  const response = await fetch(`${nodeUrl}/getImagesByFlyerBookId?flyerBookId=${flyerBookId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch flyer book images: ${response.status}`);
  }
  return response.json();
}

export async function logoutRequest(nodeUrl) {
  return fetch(`${nodeUrl}/logout`, { credentials: "include" });
}
