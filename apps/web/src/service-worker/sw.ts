/// <reference lib="webworker" />
// Service Worker: offline cache and notification clicks. Web Push handling comes in stage 6.
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// The build injects the list of app files here; they are cached for offline use.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: every navigation (e.g. /tuktuk/settings) is served by index.html, online or offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// New versions take over right away; the app has no state worth keeping an old version for.
void self.skipWaiting()
clientsClaim()

// Tapping a reminder opens the app (or focuses it if it's already open).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows[0]
      if (existing) return existing.focus()
      return self.clients.openWindow(self.registration.scope)
    })(),
  )
})
