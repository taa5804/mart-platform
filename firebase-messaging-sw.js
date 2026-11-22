// [Google Firebase Cloud Messaging Service Worker - Energen Mart Live Web Push]
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

function getEnergenNotification(payload) {
  const title = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
  const body = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 지금 터치하여 에너젠마트 특가 상품을 주문하세요.";
  const targetUrl = "https://mart-platform.vercel.app/74.html";

  const options = {
    body: body,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [400, 150, 400, 150, 400],
    requireInteraction: true,
    renotify: true,
    tag: "energen-mart-push-" + Date.now(),
    data: {
      url: targetUrl
    }
  };
  return { title, options };
}

self.addEventListener("push", function(event) {
  let payload = {};
  if (event.data) {
    try { payload = event.data.json(); } catch(e) {}
  }
  const { title, options } = getEnergenNotification(payload);
  event.waitUntil(self.registration.showNotification(title, options));
});

try {
  messaging.onBackgroundMessage(function(payload) {
    const { title, options } = getEnergenNotification(payload);
    return self.registration.showNotification(title, options);
  });
} catch(e) {}

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const targetUrl = "https://mart-platform.vercel.app/74.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
