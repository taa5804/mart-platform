/* =========================================================
   firebase-messaging-sw.js
   자동차 QR + 우리가게 공용 푸시 서비스워커
   ========================================================= */

"use strict";

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
  appId: "1:101299637796:web:cb69372592026b7aa192b1"
});

const messaging = firebase.messaging();

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage(function (payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const isVehicle =
    data.type === "vehicle_move_request" ||
    data.request_type === "vehicle_move_request";

  const title =
    notification.title ||
    data.title ||
    (isVehicle ? "차량이동 요청" : "우리가게 알림");

  const body =
    notification.body ||
    data.body ||
    (isVehicle
      ? "차량이동 요청이 도착했습니다."
      : "새로운 알림이 도착했습니다.");

  const targetUrl =
    data.url ||
    data.store_url ||
    data.store_path ||
    (isVehicle ? "/72.html" : "/mart-open.html");

  return self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: isVehicle
      ? "vehicle-move-request"
      : "mart-notification",
    renotify: true,
    requireInteraction: isVehicle,
    data: {
      url: targetUrl
    }
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || "/mart-open.html";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(function (clientList) {
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then(function () {
              return client.focus();
            });
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return null;
      })
  );
});
