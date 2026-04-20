/**
 * Listener per le notifiche Push
 */
self.addEventListener('push', (event) => {
  let data = { title: 'BeatMatch', body: 'Guarda le tue statistiche aggiornate! ⚡️' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'BeatMatch', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png', 
    badge: '/favicon.ico',   
    vibrate: [200, 100, 200],
    data: {
      url: '/statistics'      // Pagina da aprire al click
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Gestione del click sulla notifica
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se il sito è già aperto, portalo in primo piano
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti apre una nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});