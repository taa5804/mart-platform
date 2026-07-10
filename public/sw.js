self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={title:'차량 호출',body:'차량 이동 요청이 접수되었습니다.'};try{d={...d,...e.data.json()}}catch(_){}
e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/icon-192.png',badge:'/icon-192.png',data:d.url||'/'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data||'/'))});