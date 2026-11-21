const CACHE_NAME = 'mart-platform-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// [1] Web Push Notification Listener
self.addEventListener('push', (event) => {
  let title = '🚗 [우리아파트 안심주차] 차량이동 요청';
  let body = '주차된 차량의 이동 요청이 접수되었습니다. 지금 확인해 주세요.';
  let targetUrl = '/72.html';

  if (event.data) {
    try {
      const json = event.data.json();
      if (json.notification) {
        title = json.notification.title || title;
        body = json.notification.body || body;
      }
      if (json.data) {
        title = json.data.title || title;
        body = json.data.body || body;
        if (json.data.url) targetUrl = json.data.url;
      }
      if (json.title) title = json.title;
      if (json.body) body = json.body;
      if (json.url) targetUrl = json.url;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  // 알림 내용에 '마트/세일/특가'가 있으면 74.html, '차량/주차'가 있으면 무조건 72.html
  if (/마트|세일|특가|전단|할인/i.test(title + ' ' + body)) {
    targetUrl = '/74.html';
  } else {
    targetUrl = '/72.html';
  }

  const options = {
    body: body,
    icon: 'https://mart-platform.vercel.app/icon-192.png',
    badge: 'https://mart-platform.vercel.app/icon-192.png',
    vibrate: [500, 250, 500, 250, 500],
    requireInteraction: true,
    renotify: true,
    tag: 'car-push-' + Date.now(),
    data: {
      url: targetUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// [2] Notification Click Handler -> 차량이동은 72.html, 마트알림은 74.html
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = '/72.html';
  const notifData = event.notification.data || {};
  const notifTitle = event.notification.title || '';
  const notifBody = event.notification.body || '';

  if (notifData.url) {
    targetUrl = notifData.url;
  } else if (/마트|세일|특가|전단|할인/i.test(notifTitle + ' ' + notifBody)) {
    targetUrl = '/74.html';
  } else {
    targetUrl = '/72.html';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Pass-through network
});
