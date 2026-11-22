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

const messaging = firebase.messaging();

function buildOpts(isNew, customBody) {
  return {
    body: customBody || "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! (터치하면 언제든 다시 열립니다)",
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
  let title = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
  let body = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! (터치하면 언제든 다시 열립니다)";
  if (event.data) {
    try {
      const p = event.data.json();
      const t = (p.notification && p.notification.title) || (p.data && p.data.title) || "";
      const b = (p.notification && p.notification.body) || (p.data && p.data.body) || "";
      if (t && !/차량이동/.test(t)) title = t;
      if (b && !/차량이동|주차된/.test(b)) body = b;
    } catch(e) {}
  }
  event.waitUntil(
    self.registration.showNotification(title, buildOpts(true, body))
  );
});

self.addEventListener("notificationclick", function(event) {
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
      await self.registration.showNotification("🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!", buildOpts(false));
    })()
  );
});