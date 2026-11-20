const CACHE_NAME = 'mart-platform-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// [1] Web Push Notification Listener
self.addEventListener('push', (event) => {
  let data = {
    title: '[우리아파트 제휴마트] 파격 세일 알림!',
    body: '오늘의 파격 세일 및 특가 상품이 도착했습니다! 지금 바로 확인해 보세요.',
    url: '/74.html'
  };

  try {
    if (event.data) {
      const json = event.data.json();
      data = Object.assign(data, json);
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://mart-platform.vercel.app/icon-192.png',
    badge: data.badge || 'https://mart-platform.vercel.app/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/74.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// [2] Notification Click Handler -> Open 74.html
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/74.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url.includes('74.html') && 'focus' in client) {
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
