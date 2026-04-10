importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDGw_hhwEkIK2V-bMgnuZXk2ipsXJxIiXo",
  authDomain: "mypiece-app.firebaseapp.com",
  projectId: "mypiece-app",
  storageBucket: "mypiece-app.firebasestorage.app",
  messagingSenderId: "6713222351",
  appId: "1:6713222351:web:7edfa167f06191904cc3ba",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'MyPiece', {
    body: body || '',
    icon: icon || '/icon.png',
    badge: '/icon.png',
    data: payload.data,
  });
});
