import { getApiBaseUrl } from "./api/apiFetch";

const VAPID_KEY_PLACEHOLDER = "REPLACE_VAPID_PUBLIC_KEY";

export async function enablePushNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { status: "unsupported" };
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  // VAPID key must be a real base64url string. If the build was created with
  // a placeholder (or no key at all), fail loudly instead of throwing a
  // cryptic `atob` error later.
  const vapidKey = String(import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim();
  if (!vapidKey || vapidKey === VAPID_KEY_PLACEHOLDER) {
    throw new Error("Web push VAPID public key is not configured (VITE_VAPID_PUBLIC_KEY).");
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidKey);

  // Use the service worker file that exists in the `public` folder.
  // Vite serves files from `public/` at the site root, so register that file.
  const registration = await navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  });
  // Wait until a service worker is active and controlling the page.
  // `navigator.serviceWorker.ready` resolves to a registration with an active worker.
  const activeRegistration = await navigator.serviceWorker.ready;
  if (!activeRegistration || !activeRegistration.active) {
    throw new Error('No active service worker available for push subscription');
  }

  const subscription = await activeRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const res = await fetch(`${getApiBaseUrl()}/subscribe-webpush`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to save push subscription (HTTP ${res.status}).`);
  }

  activeRegistration.showNotification("Njoftimet janë aktivizuar!", {
    body: "Do të merrni oferta të reja.",
    icon: "/bell.png",
  });

  return { status: "granted" };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

