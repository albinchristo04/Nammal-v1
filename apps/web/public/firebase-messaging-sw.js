// Firebase Cloud Messaging Service Worker
// Handles background push notifications for Nammal PWA

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase web config is intentionally public — security is enforced via Firebase Security Rules
const firebaseConfig = {
  apiKey: "AIzaSyCRUU59NN01tQ7UhkzvPiJBuBdbg17EcTc",
  authDomain: "nammal-app.firebaseapp.com",
  projectId: "nammal-app",
  storageBucket: "nammal-app.firebasestorage.app",
  messagingSenderId: "7612752823",
  appId: "1:7612752823:web:5acbefbb2f74a309593e32",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (app is in background or closed)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? "Nammal", {
    body: body ?? "You have a new notification",
    icon: icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: payload.data,
    tag: payload.data?.chatId ?? "nammal-notification",
  });
});

// Notification click → open or focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/chat";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
