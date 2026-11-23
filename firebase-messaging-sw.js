// [Service Worker - Time Interval Safe Sticky Notification]
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

const TITLE = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
const BODY = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";
const TARGET_URL = "https://mart-platform.vercel.app/74.html";

function createStickyNotif(reg) {
  return reg.showNotification(TITLE, {
    body: BODY,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: "mart-sale-" + Date.now(), // [핵심] 매번 새로운 태그로 스마트폰 충돌 완전 차단!
    renotify: true,
    data: { url: TARGET_URL }
  });
}

self.addEventListener("push", function(e) {
  e.waitUntil(createStickyNotif(self.registration));
});

self.addEventListener("notificationclick", function(event) {
  event.waitUntil(
    Promise.all([
      // 1. 전단지 열기
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
        for (let client of clientList) {
          if ("focus" in client) {
            client.navigate(TARGET_URL);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(TARGET_URL);
        }
      }),
      // 2. 새로운 고유 태그로 상단바 알림 즉시 재박제!
      createStickyNotif(self.registration)
    ])
  );
});
