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

const messaging =
  firebase.messaging();


function normalizeTargetUrl(value) {

  const url =
    String(value || "").trim();

  if (!url) {
    return "/mart-open.html";
  }

  /*
    매장 경로가 /74처럼 들어오면
    Vercel의 /74가 아니라
    실제 우리아파트 매장 주소로 이동합니다.
  */
  if (/^\/[0-9]+$/.test(url)) {
    return "https://wooriapt.ai.kr" + url;
  }

  /*
    74처럼 숫자만 들어오는 경우
  */
  if (/^[0-9]+$/.test(url)) {
    return "https://wooriapt.ai.kr/" + url;
  }

  /*
    완전한 주소는 그대로 사용합니다.
  */
  if (
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return url;
  }

  /*
    mart-open.html 등 Vercel 내부 파일 경로
  */
  if (url.startsWith("/")) {
    return url;
  }

  return "/" + url;
}


messaging.onBackgroundMessage(
  function (payload) {

    const notification =
      payload.notification || {};

    const data =
      payload.data || {};

    const title =
      notification.title ||
      data.title ||
      "우리가게 알림";

    const targetUrl =
      normalizeTargetUrl(
        data.url ||
        data.click_action ||
        data.store_url ||
        data.store_path ||
        "/mart-open.html"
      );

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

        url: targetUrl,

        store_code:
          data.store_code || "",

        store_path:
          data.store_path || "",

        store_url:
          data.store_url || ""

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

    const data =
      event.notification.data || {};

    const targetUrl =
      normalizeTargetUrl(
        data.url ||
        data.store_url ||
        data.store_path ||
        "/mart-open.html"
      );

    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then(
        async function (clientList) {

          for (const client of clientList) {

            if (
              "navigate" in client &&
              "focus" in client
            ) {

              await client.navigate(
                targetUrl
              );

              return client.focus();

            }

          }

          if (clients.openWindow) {

            return clients.openWindow(
              targetUrl
            );

          }

          return null;

        }
      )

    );

  }
);
