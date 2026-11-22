// [Google Firebase Cloud Messaging Service Worker - Always-Pinned Energen Mart Web Push]
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

function buildOpts(isNew) {
  return {
    body: "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! (터치하면 언제든 다시 열립니다)",
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

self.addEventListener("push", function(event) {
  event.waitUntil(
    self.registration.showNotification("🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!", buildOpts(true))
  );
});

self.addEventListener("notificationclick", function(event) {
  const targetUrl = "https://mart-platform.vercel.app/74.html";
  event.waitUntil(
    (async function() {
      // 1. 매장 화면 열기
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
      // 2. 안드로이드 OS가 클릭된 알림을 닫은 직후(500ms 뒤) 새 고유 태그로 상단바에 즉시 복원!
      await new Promise(r => setTimeout(r, 500));
      await self.registration.showNotification("🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!", buildOpts(false));
    })()
  );
});
