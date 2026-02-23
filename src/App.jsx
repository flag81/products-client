import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getMessaging, getToken } from "firebase/messaging";
import { messaging } from "./firebase"; // adjust path if needed
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';
import Dashboard from './Dashboard';




const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; // set in .env

async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}


export async function enableWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push not supported in this browser');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(vapidKey),
  });

  // send to server
  await fetch(`${import.meta.env.VITE_NODE_URL}/subscribe-webpush`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
    credentials: 'include',
  });
  alert('Subscribed for web push');
}

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
        </Router>
        </QueryClientProvider>
    );
};

export default App;