import {
  toLocalDate,
  type Clock,
  type NudgeDelivery,
  type Settings,
  type makeGetPendingTitles,
  type makeGetReminderSnapshot,
} from '@tuktuk/core'
import type { LocalTitlesStore, NotificationPermissionState, PushAccess, PushStatus } from './ports'

/**
 * Brings the server's copy of reminders up to date: titles stay on the device (for the
 * Service Worker), settings and counts go to the server. Unchanged snapshots are not resent.
 */
export function makeSyncReminders(deps: {
  clock: Clock
  getPendingTitles: ReturnType<typeof makeGetPendingTitles>
  getReminderSnapshot: ReturnType<typeof makeGetReminderSnapshot>
  localTitles: LocalTitlesStore
  push: PushAccess
}) {
  let lastSent = ''
  return async (settings: Settings): Promise<'sent' | 'unchanged'> => {
    const today = toLocalDate(deps.clock.now(), settings.timeZone)
    // Titles first: by the time the server pushes, the device must know what to say.
    await deps.localTitles.save(await deps.getPendingTitles(today))
    const snapshot = await deps.getReminderSnapshot(settings, today)
    const serialized = JSON.stringify(snapshot)
    if (serialized === lastSent) return 'unchanged'
    await deps.push.syncSnapshot(snapshot)
    lastSent = serialized
    return 'sent'
  }
}

/**
 * Makes sure push is on whenever notifications are allowed. Called on start too:
 * browsers may drop subscriptions, and this quietly restores them.
 */
export function makeSyncPush(deps: { push: PushAccess }) {
  return async (permission: NotificationPermissionState): Promise<PushStatus> => {
    const status = await deps.push.status()
    if (permission !== 'granted' || status !== 'off') return status
    await deps.push.enable()
    return 'on'
  }
}

/**
 * Who shows reminders while the app is open. With push on, the server delivers them, and the
 * tab only keeps its schedule for the UI; a notification over the open app would be noise too.
 */
export const tabDelivery = (pushStatus: PushStatus, userIsLooking: boolean): NudgeDelivery =>
  pushStatus === 'on' || userIsLooking ? 'silent' : 'notify'
