import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import '@/styles/tailwind.css';
import { requestNotificationPermission } from './lib/notifications';

// ─── Render App ──────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ─── Register Service Worker ─────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registrado:', registration.scope);
    } catch (error) {
      console.warn('SW falhou:', error);
    }
  });
}

// ─── Request Notification Permission (after 3s delay) ────────

setTimeout(() => {
  requestNotificationPermission().then((status) => {
    console.log('Notificações:', status);
  });
}, 3000);
