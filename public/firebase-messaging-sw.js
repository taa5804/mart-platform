importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBZVOIuNzaQg0WgxIocJ--LfeR03mJe0E0",
  authDomain: "wooriapt-carqr.firebaseapp.com",
  projectId: "wooriapt-carqr",
  storageBucket: "wooriapt-carqr.firebasestorage.app",
  messagingSenderId: "101299637796",
  appId: "1:101299637796:web:cb69372592026b7aa192b1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification =
    payload.notification || {};

  const data =
    payload.data || {};

  const notificationTitle =
    notification.title ||
    data.title ||
    "우리마트 알림";

  const notificationOptions = {
    body:
      notification.body ||
      data.body ||
      "새로운 행사와 특가 소식이 도착했습니다.",

    icon:
      data.icon ||
      "/icons/icon-192.png",

    badge:
      data.badge ||
      "/icons/icon-192.png",

    data: {
      url:
        data.url ||
        "/"
    },

    vibrate: [
      200,
      100,
      200
    ],

    requireInteraction: true
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "/";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "focus" in client
            ) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }

          if (
            clients.openWindow
          ) {
            return clients.openWindow(
              targetUrl
            );
          }
        })
    );
  }
);
