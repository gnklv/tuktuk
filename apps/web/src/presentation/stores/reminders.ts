import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { toLocalDate, type NudgeMessage } from '@tuktuk/core'
import { useClock, useNotifications, usePush, useUseCases, type PushStatus } from '../di'
import { useSettingsStore } from './settings'

/** The user is looking at the app — a system notification would be noise. */
const userIsLooking = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()

/** In-tab reminder scheduler: `check()` is called every minute and whenever the day changes. */
export const useRemindersStore = defineStore('reminders', () => {
  const useCases = useUseCases()
  const notifications = useNotifications()
  const push = usePush()
  const clock = useClock()
  const settingsStore = useSettingsStore()

  const permission = shallowRef(notifications.permission())
  const pushStatus = shallowRef<PushStatus>('off')
  const nextAt = shallowRef<Date | null>(null)
  let checking: Promise<void> | null = null

  /** Idempotent and serialized: overlapping calls share one run, so nothing is sent twice. */
  function check(): Promise<void> {
    checking ??= useCases
      .checkNudge({
        settings: settingsStore.settings,
        // With push on, the server sends the reminders: the tab only keeps its schedule
        // (for the "next reminder" hint) and must not notify a second time.
        userIsLooking: pushStatus.value === 'on' || userIsLooking(),
      })
      .then((result) => {
        nextAt.value = result.nextAt
      })
      .finally(() => {
        checking = null
      })
    return checking
  }

  async function requestPermission() {
    permission.value = await notifications.requestPermission()
    await syncPush()
  }

  /**
   * With notification permission, make sure the server has this device's push subscription.
   * Runs on start too: subscriptions can expire or be dropped by the browser.
   */
  async function syncPush() {
    try {
      pushStatus.value = await push.status()
      if (permission.value === 'granted' && pushStatus.value === 'off') {
        await push.enable()
        pushStatus.value = 'on'
      }
      if (pushStatus.value === 'on') syncSnapshot()
    } catch (error) {
      console.warn('[push] could not enable push', error)
    }
  }

  /** Waits a moment so a burst of changes (ticking off three tasks) becomes one request. */
  const SNAPSHOT_DEBOUNCE_MS = 1000
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined
  let lastSentSnapshot = ''

  /** Keeps the server's copy of settings and counts up to date. Cheap to call often. */
  function syncSnapshot() {
    if (pushStatus.value !== 'on') return
    clearTimeout(snapshotTimer)
    snapshotTimer = setTimeout(() => void sendSnapshot(), SNAPSHOT_DEBOUNCE_MS)
  }

  /**
   * Sends a pending sync right away. Called when the app goes to the background: iOS freezes
   * the PWA before a debounce timer fires, and the server would keep stale counts.
   */
  function flushSnapshot() {
    if (snapshotTimer === undefined) return
    void sendSnapshot()
  }

  async function sendSnapshot() {
    clearTimeout(snapshotTimer)
    snapshotTimer = undefined
    try {
      const { settings } = settingsStore
      const today = toLocalDate(clock.now(), settings.timeZone)
      // Titles first: by the time the server pushes, the device must know what to say.
      await push.saveLocalTitles(await useCases.getPendingTitles(today))
      const snapshot = await useCases.getReminderSnapshot(settings, today)
      const serialized = JSON.stringify(snapshot)
      if (serialized === lastSentSnapshot) return
      await push.syncSnapshot(snapshot)
      lastSentSnapshot = serialized
    } catch (error) {
      console.warn('[push] could not sync the snapshot', error)
    }
  }

  /** Asks the server to send a push — checks the whole chain end to end. */
  async function sendServerTest(delaySeconds: number) {
    await push.sendTest(settingsStore.settings.locale, delaySeconds)
  }

  /** The user can change the permission in browser settings at any time. */
  function refreshPermission() {
    permission.value = notifications.permission()
  }

  const sendTest = (message: NudgeMessage) => notifications.show(message)

  return {
    permission,
    pushStatus,
    nextAt,
    check,
    requestPermission,
    refreshPermission,
    syncPush,
    syncSnapshot,
    flushSnapshot,
    sendTest,
    sendServerTest,
  }
})
