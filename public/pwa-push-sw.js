// [Google Firebase Cloud Messaging Service Worker - Persistent Energen Mart Web Push]
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

function getEnergenNotification() {
  const title = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
  const body = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! (이 알림은 터치해서 열어봐도 상단에 계속 보관됩니다)";
  const targetUrl = "https://mart-platform.vercel.app/store.html?store=store01";

  const options = {
    body: body,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [400, 150, 400],
    requireInteraction: true,
    renotify: false,
    tag: "energen-persistent-sale",
    data: {
      url: targetUrl,
      keepAlive: true
    }
  };
  return { title, options };
}

self.addEventListener("push", function(event) {
  const { title, options } = getEnergenNotification();
  options.renotify = true;
  event.waitUntil(self.registration.showNotification(title, options));
});

try {
  messaging.onBackgroundMessage(function(payload) {
    const { title, options } = getEnergenNotification();
    options.renotify = true;
    return self.registration.showNotification(title, options);
  });
} catch(e) {}

// 핵심: 알림을 터치해서 열어도 event.notification.close()를 호출하지 않고,
// 안드로이드 OS가 자동 닫기를 시도하더라도 즉시 상단 알림창에 재고정(Re-pin)하여 절대 사라지지 않게 유지!
self.addEventListener("notificationclick", function(event) {
  const { title, options } = getEnergenNotification();
  options.renotify = false; // 다시 고정할 때는 진동 없이 조용히 상단바에 그대로 유지
  const targetUrl = "https://mart-platform.vercel.app/store.html?store=store01";

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
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
    ])
  );
});
