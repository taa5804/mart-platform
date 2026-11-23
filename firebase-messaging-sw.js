// [Service Worker - Dual Shield Permanent Sticky Notification]
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

const TITLE = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
const BODY = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";
const TARGET_URL = "https://mart-platform.vercel.app/74.html";

function showStickyNow(reg) {
  return reg.showNotification(TITLE, {
    body: BODY,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: "mart-sale-" + Date.now(), // 매번 새로운 고유 태그로 10번 연속 눌러도 충돌 제로!
    renotify: true,
    data: { url: TARGET_URL }
  });
}

// 3분 뒤 자동 부활 타이머
function scheduleReviveIn3Min(reg) {
  setTimeout(async () => {
    try {
      await showStickyNow(reg);
    } catch(e) {}
  }, 3 * 60 * 1000); // 3분 뒤 자동 부활
}

self.addEventListener("push", function(e) {
  e.waitUntil(
    showStickyNow(self.registration).then(() => {
      scheduleReviveIn3Min(self.registration);
    })
  );
});

// 알림 터치 시: 전단지 열기 + 즉시 상단바 재박제(연속 10번 유지) + 3분 뒤 자동부활 예약!
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
      // 2. 10번 연속 눌러도 안 꺼지도록 0.001초 만에 즉시 상단바 재박제!
      showStickyNow(self.registration),
      // 3. 만에 하나 꺼지더라도 3분 뒤에 저절로 다시 뿅 살아나는 백업 타이머!
      new Promise((resolve) => {
        scheduleReviveIn3Min(self.registration);
        resolve();
      })
    ])
  );
});
