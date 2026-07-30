/* =========================================================
   firebase-vehicle-sw.js
   자동차 QR 전용 Firebase 푸시 서비스워커
   ========================================================= */

"use strict";


importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


firebase.initializeApp({
  apiKey:
    "AIzaSyB3nZdmUrj2wsKPQpOV8dLso7i17fZo0Hc",

  authDomain:
    "wooriapt-carqr.firebaseapp.com",

  projectId:
    "wooriapt-carqr",

  storageBucket:
    "wooriapt-carqr.firebasestorage.app",

  messagingSenderId:
    "101299637796",

  appId:
    "1:101299637796:web:cb69372592026b7aa192b1"
});


const messaging =
  firebase.messaging();


self.addEventListener(
  "install",
  function () {
    self.skipWaiting();
  }
);


self.addEventListener(
  "activate",
  function (event) {
    event.waitUntil(
      self.clients.claim()
    );
  }
);


messaging.onBackgroundMessage(
  function (payload) {
    const notification =
      payload.notification || {};

    const data =
      payload.data || {};

    const title =
      notification.title ||
      data.title ||
      "차량이동 요청";

    const body =
      notification.body ||
      data.body ||
      "차량이동 요청이 도착했습니다.";

    const targetUrl =
      data.url ||
      (
        "/72.html?qr=" +
        encodeURIComponent(
          data.qr_code || ""
        )
      );

    const options = {
      body: body,

      icon:
        "/icon-192.png",

      badge:
        "/icon-192.png",

      tag:
        "vehicle-move-request",

      renotify:
        true,

      requireInteraction:
        true,

      data: {
        url:
          targetUrl
      }
    };

    return self.registration
      .showNotification(
        title,
        options
      );
  }
);


self.addEventListener(
  "notificationclick",
  function (event) {
    event.notification.close();

    const notificationData =
      event.notification.data || {};

    const targetUrl =
      notificationData.url ||
      "/72.html";

    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",

          includeUncontrolled:
            true
        })
        .then(
          function (clientList) {
            for (
              const client of clientList
            ) {
              if (
                "navigate" in client &&
                "focus" in client
              ) {
                return client
                  .navigate(targetUrl)
                  .then(
                    function () {
                      return client.focus();
                    }
                  );
              }
            }

            if (
              self.clients.openWindow
            ) {
              return self.clients
                .openWindow(
                  targetUrl
                );
            }

            return null;
          }
        )
    );
  }
);
