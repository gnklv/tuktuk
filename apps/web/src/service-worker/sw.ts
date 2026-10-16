/// <reference lib="webworker" />
// Service Worker: offline cache, Web Push and notification clicks.
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'
import { DEFAULT_LOCALE, parsePushPayload } from '@tuktuk/core'
import { messages } from '@tuktuk/i18n'

declare const self: ServiceWorkerGlobalScope

// The build injects the list of app files here; they are cached for offline use.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: every navigation (e.g. /tuktuk/settings) is served by index.html, online or offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// New versions take over right away; the app has no state worth keeping an old version for.
void self.skipWaiting()
clientsClaim()

const asset = (path: string) => new URL(path, self.registration.scope).href

/**
 * A push from the server. The payload carries no task titles — the text is composed here,
 * on the device. Every push must show a notification: iOS revokes push access otherwise.
 */
self.addEventListener('push', (event) => {
  let data: unknown = null
  try {
    data = event.data?.json()
  } catch {
    // not JSON — falls through to the generic notification
  }
  const payload = parsePushPayload(data)
  const dict = messages[payload?.locale ?? DEFAULT_LOCALE]

  const { title, body } =
    payload?.type === 'test'
      ? { title: dict.reminders.push.testTitle, body: dict.reminders.push.testBody }
      : { title: dict.app.name, body: '' }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: asset('pwa-192x192.png'),
      badge: asset('pwa-64x64.png'),
      tag: 'tuktuk-nudge',
      renotify: true,
    } as NotificationOptions),
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
