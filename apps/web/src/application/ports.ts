// Ports of the web app's application layer: what it needs from the browser and the push server.
// Infrastructure implements them; presentation and composition root depend only on these types.
import type { LocalDate, Locale, NudgeMessage, PendingTitles, ReminderSnapshot } from '@tuktuk/core'

export type NotificationPermissionState =
  | NotificationPermission
  | 'unsupported'
  /** iOS Safari tab: notifications work only after "Add to Home Screen". */
  | 'needs-install'

/** System notifications: permission handling and showing a message. */
export interface NotificationAccess {
  permission(): NotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>
  show(message: NudgeMessage): Promise<void>
}

export type PushStatus = 'unsupported' | 'off' | 'on'

/** Web Push via the server: reminders even when the app is closed. */
export interface PushAccess {
  status(): Promise<PushStatus>
  enable(): Promise<void>
  /** The server sends a push after `delaySeconds` — time to lock the phone. */
  sendTest(locale: Locale, delaySeconds: number): Promise<void>
  /** Tells the server what it needs to schedule reminders: settings and counts, no titles. */
  syncSnapshot(snapshot: ReminderSnapshot): Promise<void>
}

/** Pending titles kept on the device, where push texts are composed. Never sent anywhere. */
export interface LocalTitlesStore {
  save(titles: PendingTitles): Promise<void>
}

/** Small per-device UI memory that isn't part of the domain. */
export interface UiPrefs {
  /** The day whose "yesterday" summary was last dismissed. */
  summarySeenOn(): LocalDate | null
  markSummarySeen(date: LocalDate): void
}

/** What the Service Worker reads to word a reminder: local titles and the last message. */
export interface PushTitlesSource {
  forDate(date: LocalDate): Promise<readonly string[]>
  lastMessageId(): Promise<string | null>
  setLastMessageId(id: string): Promise<void>
}
