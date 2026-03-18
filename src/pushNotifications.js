export async function enablePushNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Ju duhet të lejoni njoftimet për të marrë oferta!');
    return;
  }

  // Use the service worker file that exists in the `public` folder.
  // Vite serves files from `public/` at the site root, so register that file.
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  // Wait until a service worker is active and controlling the page.
  // `navigator.serviceWorker.ready` resolves to a registration with an active worker.
  const activeRegistration = await navigator.serviceWorker.ready;
  if (!activeRegistration || !activeRegistration.active) {
    throw new Error('No active service worker available for push subscription');
  }
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(vapidKey),
  };
  const subscription = await activeRegistration.pushManager.subscribe(subscribeOptions);

  await fetch(`${import.meta.env.VITE_NODE_URL}/subscribe-webpush`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
    credentials: 'include',
  });

  activeRegistration.showNotification('Njoftimet janë aktivizuar!', {
    body: 'Do të merrni oferta të reja.',
    icon: '/bell.png',
  });
}

async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

