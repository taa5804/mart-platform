// [Service Worker v3 - Bulletproof Permanent Sticky Notification]
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

const TITLE = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
const BODY = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";
const TARGET_URL = "https://mart-platform.vercel.app/74.html";

function getStickyOptions() {
  return {
    body: BODY,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [200, 100, 200],
    requireInteraction: true, // [필수] 사용자 직접 삭제 전까지 상단바 지속 고정
    tag: "mart-sale-sticky",   // 최신 알림 유지
    renotify: false,
    data: { url: TARGET_URL }
  };
}

self.addEventListener("push", function(e) {
  e.waitUntil(self.registration.showNotification(TITLE, getStickyOptions()));
});

// [완전 무결 잠금] 손님이 몇 번(3번, 10번, 100번)을 눌러도 절대 안 꺼지는 핵심 로직
self.addEventListener("notificationclick", function(event) {
  // notification.close() 를 절대 호출하지 않고, 
  // 창 열기와 알림 재표시를 Promise.all 로 동시 락(Lock)을 걸어 브라우저 슬립을 원천 차단!
  event.waitUntil(
    Promise.all([
      // 1. 전단지 페이지 열기/포커스
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
      // 2. 0.001초 만에 상단바 알림을 즉시 재고정 (setTimeout 없이 즉각 실행!)
      self.registration.showNotification(TITLE, getStickyOptions())
    ])
  );
});
