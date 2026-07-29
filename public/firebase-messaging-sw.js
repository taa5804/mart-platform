importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB3nZdmUrj2wsKPQpOV8dlso7iI7fZo0Hc",
  authDomain: "wooriapt-carqr.firebaseapp.com",
  projectId: "wooriapt-carqr",
  storageBucket: "wooriapt-carqr.firebasestorage.app",
  messagingSenderId: "101299637796",
  appId: "1:101299637796:web:cb69372592026b7aa192b1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notification =
    payload.notification || {};

  const data =
    payload.data || {};

  const title =
    notification.title ||
    data.title ||
    "우리가게 알림";

  const options = {
    body:
      notification.body ||
      data.body ||
      "새로운 특가·행사 알림이 도착했습니다.",

    icon:
      data.icon ||
      "/icon-192.png",

    badge:
      data.badge ||
      "/icon-192.png",

    tag:
      data.tag ||
      "woorigage-notification",

    renotify: true,

    requireInteraction: false,

    data: {
      url:
        data.url ||
        data.click_action ||
        "/mart-open.html",

      store_code:
        data.store_code ||
        "",

      store_path:
        data.store_path ||
        ""
    }
  };

  return self.registration.showNotification(
    title,
    options
  );
});

self.addEventListener(
  "notificationclick",
  function (event) {
    event.notification.close();

    const data =
      event.notification.data || {};

    const targetUrl =
      data.url ||
      "/mart-open.html";

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then(function (clientList) {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);

            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(
            targetUrl
          );
        }

        return null;
      })
    );
  }
);
