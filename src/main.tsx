import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const ACTIVE_CACHE_NAME = 'narrenkreis-bruchsal-v6';

// Register PWA Service Worker with aggressive cache-busting update handling
if ('serviceWorker' in navigator) {
  // Purge any outdated caches on app start
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== ACTIVE_CACHE_NAME) {
          console.log('[PWA] Purging outdated cache:', key);
          caches.delete(key);
        }
      });
    }).catch(() => {});
  }

  const hadController = Boolean(navigator.serviceWorker.controller);

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Force an immediate network check for a newer SW whenever the app opens
        registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Neue Version der App installiert, aktiviere Update...');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Also check for updates when returning to the installed PWA from background
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration notice:', err);
      });
  });

  // Reload once a newly activated Service Worker replaces the previous controller
  let isRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !isRefreshing) {
      isRefreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
