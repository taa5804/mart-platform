// [Energen Mart Exclusive Interceptor Service Worker - Line 1 stopImmediatePropagation]
function buildEnergenOpts(isNew) {
  return {
    body: "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! (터치해서 열어봐도 상단에 계속 보관됩니다)",
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: isNew ? [400, 150, 400] : undefined,
    requireInteraction: true,
    renotify: isNew,
    tag: "energen-pin-" + Date.now(),
    data: { url: "https://mart-platform.vercel.app/74.html" }
  };
}

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

// LINE 1 PUSH INTERCEPTOR: Blocks Firebase SDK's default "차량이동 요청" handler via stopImmediatePropagation()
self.addEventListener("push", function(event) {
  if (event.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
  event.waitUntil(
    self.registration.showNotification("🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!", buildEnergenOpts(true))
  );
}, true);

self.addEventListener("notificationclick", function(event) {
  if (event.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
  const targetUrl = "https://mart-platform.vercel.app/74.html";
  event.waitUntil(
    (async function() {
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      let opened = false;
      for (let client of clientList) {
        if ("focus" in client) {
          await client.navigate(targetUrl);
          await client.focus();
          opened = true;
          break;
        }
      }
      if (!opened && clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
      await new Promise(r => setTimeout(r, 500));
      await self.registration.showNotification("🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!", buildEnergenOpts(false));
    })()
  );
}, true);

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB3nZdmUrj2wsKPQpOV8dlso7iI7fZo0Hc",
  authDomain: "wooriapt-carqr.firebaseapp.com",
  projectId: "wooriapt-carqr",
  storageBucket: "wooriapt-carqr.firebasestorage.app",
  messagingSenderId: "101299637796",
  appId: "1:101299637796:web:cb69372592026b7aa192b1"
});

const messaging = firebase.messaging();