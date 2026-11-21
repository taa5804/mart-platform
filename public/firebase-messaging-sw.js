// [Google Firebase Cloud Messaging Service Worker for Wooriapt Car QR]
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyB3nZdmUrj2wsKPQpOV8dlso7iI7fZo0Hc",
  authDomain: "wooriapt-carqr.firebaseapp.com",
  projectId: "wooriapt-carqr",
  storageBucket: "wooriapt-carqr.firebasestorage.app",
  messagingSenderId: "101299637796",
  appId: "1:101299637796:web:cb69372592026b7aa192b1"
});

const messaging = firebase.messaging();

function getNotificationDetails(payload) {
  const title = (payload && payload.notification && payload.notification.title) ||
                (payload && payload.data && payload.data.title) ||
                "🚗 [우리아파트 안심주차] 차량이동 요청";

  const body = (payload && payload.notification && payload.notification.body) ||
               (payload && payload.data && payload.data.body) ||
               "주차된 차량의 이동 요청이 접수되었습니다. 지금 확인해 주세요.";

  const targetUrl = (payload && payload.data && payload.data.url) || "/72.html";

  const options = {
    body: body,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    vibrate: [500, 250, 500, 250, 500],
    requireInteraction: true,
    renotify: true,
    tag: "car-move-" + Date.now(),
    data: {
      url: targetUrl
    }
  };
  return { title, options };
}

// 1. Native ServiceWorker Push Event Listener (100% Guaranteed with event.waitUntil)
self.addEventListener("push", function(event) {
  console.log("[SW] Push event received:", event);
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch(e) {
      payload = { notification: { body: event.data.text() } };
    }
  }
  const { title, options } = getNotificationDetails(payload);
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Firebase onBackgroundMessage fallback
try {
  messaging.onBackgroundMessage(function(payload) {
    console.log("[SW] Firebase onBackgroundMessage:", payload);
    const { title, options } = getNotificationDetails(payload);
    self.registration.showNotification(title, options);
  });
} catch(e) {
  console.warn("onBackgroundMessage error:", e);
}

// 3. Notification Click
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/72.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes("72.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
