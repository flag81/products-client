// Service Worker for Web Push Notifications
// Save this file as 'public/firebase-messaging-sw.js' or 'public/service-worker.js' depending on your setup

// If using Firebase Cloud Messaging (FCM):
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBQlOb-shQqfMtR2hgHONjH2bD6L3kPek4",
  authDomain: "meniven-web.firebaseapp.com",
  projectId: "meniven-web",
  storageBucket: "meniven-web.firebasestorage.app",
  messagingSenderId: "89675774010",
  appId: "1:89675774010:web:e13a2ea6d64d036f299d03",
  measurementId: "G-6H3V4DJT16"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage(function(payload) {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Notification', { body, icon });
});

// If you want to support generic Push API as well, add this:
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Notification';
    const options = {
      body: data.body,
      icon: data.icon || '/logo3-1.jpg',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
