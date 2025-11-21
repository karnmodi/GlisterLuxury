// Service Worker Registration Utility

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[PWA] New service worker available');
                  // You can show a notification to the user here
                }
              });
            }
          });

          resolve(registration);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
          reject(error);
        });
    });
  });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
      console.log('[PWA] Service Worker unregistered');
      return true;
    })
    .catch((error) => {
      console.error('[PWA] Service Worker unregistration failed:', error);
      return false;
    });
}

// Check if app is installed
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for standalone mode (iOS Safari)
  if ((window.navigator as any).standalone) {
    return true;
  }

  // Check for display mode (Android Chrome)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check for fullscreen mode
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }

  return false;
}

// Check if app can be installed
export function canInstallApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for beforeinstallprompt event support (Chrome, Edge, etc.)
  return 'BeforeInstallPromptEvent' in window || 
         (window as any).deferredPrompt !== undefined;
}

