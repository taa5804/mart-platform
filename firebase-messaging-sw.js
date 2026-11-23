// [Google Firebase Cloud Messaging Service Worker - Energen Mart Live Sticky Web Push]
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
  const body = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";
  const targetUrl = "https://mart-platform.vercel.app/74.html";

  const options = {
    body: body,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    image: "https://mart-platform.vercel.app/test-flyer.png",
    vibrate: [300, 150, 300],
    requireInteraction: true, // [필수] 손님이 직접 닫기 전까지 상단바 지속 고정
    renotify: true,
    tag: "mart-sale-sticky", // 최신 알림으로 덮어쓰기
    data: {
      url: targetUrl,
      title: title,
      body: body
    }
  };
  return { title, options };
}

// 밤 9시 30분 자동 소멸 타이머 등록
function scheduleAutoClose() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closeMinutes = 21 * 60 + 30; // 밤 9시 30분 (21:30)
  let diffMs = 0;
  if (currentMinutes < closeMinutes) {
    diffMs = (closeMinutes - currentMinutes) * 60 * 1000;
  }
  if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
    setTimeout(async () => {
      try {
        const notifs = await self.registration.getNotifications({ tag: "mart-sale-sticky" });
        notifs.forEach(n => n.close());
      } catch(e) {}
    }, diffMs);
  }
}

self.addEventListener("push", function(event) {
  let payload = {};
  if (event.data) {
    try { payload = event.data.json(); } catch(e) {}
  }
  const { title, options } = getEnergenNotification(payload);
  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      scheduleAutoClose();
    })
  );
});

try {
  messaging.onBackgroundMessage(function(payload) {
    const { title, options } = getEnergenNotification(payload);
    scheduleAutoClose();
    return self.registration.showNotification(title, options);
  });
} catch(e) {}

// [핵심] 알림 클릭 시 전단지 창을 열면서도 상단바 알림을 절대 지우지 않고 유지(Re-trigger)!
self.addEventListener("notificationclick", function(event) {
  const targetUrl = "https://mart-platform.vercel.app/74.html";
  const title = "🛒 [에너젠마트] 주말 초특가 세일 전단지 도착!";
  const body = "국내산 1등급 생삼겹살 100g 1,290원 · 신선 왕란 1판 4,980원! 터치하여 특가 전단지를 확인하세요.";

  event.waitUntil(
    (async () => {
      // 1. 전단지 페이지 열기
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      let focused = false;
      for (let client of clientList) {
        if ("focus" in client) {
          await client.navigate(targetUrl);
          await client.focus();
          focused = true;
          break;
        }
      }
      if (!focused && clients.openWindow) {
        await clients.openWindow(targetUrl);
      }

      // 2. [가장 중요] 클릭 후에도 상단바에 알림이 계속 살아있도록 즉시 재유지!
      await self.registration.showNotification(title, {
        body: body,
        icon: "https://mart-platform.vercel.app/icon-192.png",
        badge: "https://mart-platform.vercel.app/icon-192.png",
        image: "https://mart-platform.vercel.app/test-flyer.png",
        vibrate: [100, 50, 100],
        requireInteraction: true, // [상단바 고정 유지]
        renotify: false,          // 재클릭 시에는 소리 없이 조용히 상단바에 머묾
        tag: "mart-sale-sticky",
        data: { url: targetUrl }
      });
      scheduleAutoClose();
    })()
  );
});
