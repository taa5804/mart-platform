// [Service Worker v2 - Force Sticky Notification]
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

const TITLE = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
const BODY = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";
const TARGET_URL = "https://mart-platform.vercel.app/74.html";

function showSticky(reg) {
  return reg.showNotification(TITLE, {
    body: BODY,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: "mart-sale-sticky",
    data: { url: TARGET_URL }
  });
}

self.addEventListener("push", function(e) {
  e.waitUntil(showSticky(self.registration));
});

// [핵심] 사용자가 알림을 톡 눌렀을 때: 전단지 창 열고, 상단바에 알림을 즉시 다시 박아버림!
self.addEventListener("notificationclick", function(event) {
  event.waitUntil(
    (async () => {
      // 1. 전단지 열기
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      let opened = false;
      for (let client of clientList) {
        if ("focus" in client) {
          await client.navigate(TARGET_URL);
          await client.focus();
          opened = true;
          break;
        }
      }
      if (!opened && clients.openWindow) {
        await clients.openWindow(TARGET_URL);
      }

      // 2. 안드로이드 OS가 알림을 지우는 찰나(0.3초 뒤)에 상단바에 다시 알림을 올려놓음!
      setTimeout(async () => {
        await showSticky(self.registration);
      }, 300);
    })()
  );
});
