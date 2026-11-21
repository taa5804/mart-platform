// [Google Firebase Cloud Messaging Service Worker for Wooriapt Car QR]
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

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Background push received:", payload);
  const title = (payload.notification && payload.notification.title) ||
                (payload.data && payload.data.title) ||
                "🚗 [우리아파트 안심주차] 차량이동 요청";

  const body = (payload.notification && payload.notification.body) ||
               (payload.data && payload.data.body) ||
               "주차된 차량의 이동 요청이 접수되었습니다. 지금 확인해 주세요.";

  const targetUrl = (payload.data && payload.data.url) || "/72.html";

  const options = {
    body: body,
    icon: "https://mart-platform.vercel.app/icon-192.png",
    badge: "https://mart-platform.vercel.app/icon-192.png",
    vibrate: [300, 150, 300, 150, 300],
    data: {
      url: targetUrl
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/72.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes("72.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
