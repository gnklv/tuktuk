import type { Notifier, NudgeMessage } from '@tuktuk/core'

/**
 * `needs-install`: iOS shows notifications only for web apps added to the Home Screen,
 * so in a Safari tab the user first has to install the app.
 */
export type NotificationPermissionState = NotificationPermission | 'unsupported' | 'needs-install'

const TAG = 'tuktuk-nudge'

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS pretends to be a Mac
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/**
 * System notifications. Uses the Service Worker when there is one — the only way that works on
 * iOS and Android; plain `new Notification()` remains as a fallback for dev mode on desktop.
 */
export class BrowserNotifier implements Notifier {
  permission(): NotificationPermissionState {
    if (isIos() && !isStandalone()) return 'needs-install'
    return 'Notification' in window ? Notification.permission : 'unsupported'
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (this.permission() === 'needs-install' || !('Notification' in window)) {
      return this.permission()
    }
    return Notification.requestPermission()
  }

  async show(message: NudgeMessage): Promise<void> {
    if (this.permission() !== 'granted') return
    const options = {
      body: message.body,
      icon: new URL('pwa-192x192.png', document.baseURI).href,
      badge: new URL('pwa-64x64.png', document.baseURI).href,
      tag: TAG, // replaces the previous reminder instead of piling up…
      renotify: true, // …but still alerts every time
    } as NotificationOptions

    try {
      const registration =
        'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
      if (registration) {
        await registration.showNotification(message.title, options)
        return
      }
      const notification = new Notification(message.title, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.warn('[notifier] could not show a notification', error)
    }
  }
}
