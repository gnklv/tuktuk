/// <reference lib="webworker" />
// Service Worker: offline cache, Web Push and notification clicks.
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'
import { messages, nudgeCopy } from '@tuktuk/i18n'
import { makeComposePush } from '../application/compose-push'
import { IndexedDbReminderTitles } from '../infrastructure/indexed-db-reminder-titles'

declare const self: ServiceWorkerGlobalScope

// The build injects the list of app files here; they are cached for offline use.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: every navigation (e.g. /tuktuk/settings) is served by index.html, online or offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// New versions take over right away; the app has no state worth keeping an old version for.
void self.skipWaiting()
clientsClaim()

// Composition root of the Service Worker.
const composePush = makeComposePush({
  titles: new IndexedDbReminderTitles(),
  copy: nudgeCopy,
  texts: (locale) => {
    const dict = messages[locale]
    return {
      appName: dict.app.name,
      fallback: (mood) => dict.mascot[mood],
    }
  },
  random: Math.random,
})

const asset = (path: string) => new URL(path, self.registration.scope).href

/** A push from the server: the text is composed on the device (see compose-push.ts). */
self.addEventListener('push', (event) => {
  let data: unknown = null
  try {
    data = event.data?.json()
  } catch {
    // not JSON — falls through to the generic notification
  }
  event.waitUntil(
    composePush(data).then(({ title, body }) =>
      self.registration.showNotification(title, {
        body,
        icon: asset('pwa-192x192.png'),
        badge: asset('pwa-64x64.png'),
        tag: 'tuktuk-nudge',
        renotify: true,
      } as NotificationOptions),
    ),
  )
})

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
