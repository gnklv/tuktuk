import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { NudgeMessage } from '@tuktuk/core'
import type { PushStatus } from '../../application/ports'
import { tabDelivery } from '../../application/reminders'
import { useNotifications, usePush, useUseCases } from '../di'
import { useSettingsStore } from './settings'

/** The user is looking at the app — a system notification would be noise. */
const userIsLooking = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()

/** Waits a moment so a burst of changes (ticking off three tasks) becomes one request. */
const SNAPSHOT_DEBOUNCE_MS = 1000

/**
 * Reminders as the UI sees them: permission and push status, the next reminder time, and
 * the timing of syncs. The rules live in the application layer (`application/reminders.ts`).
 */
export const useRemindersStore = defineStore('reminders', () => {
  const useCases = useUseCases()
  const notifications = useNotifications()
  const push = usePush()
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
        delivery: tabDelivery(pushStatus.value, userIsLooking()),
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

  /** The user can change the permission in browser settings at any time. */
  function refreshPermission() {
    permission.value = notifications.permission()
  }

  async function syncPush() {
    try {
      pushStatus.value = await useCases.syncPush(permission.value)
      syncSnapshot()
    } catch (error) {
      console.warn('[push] could not enable push', error)
    }
  }

  let snapshotTimer: ReturnType<typeof setTimeout> | undefined

  /** Schedules a sync of the server's copy of reminders. Cheap to call often. */
  function syncSnapshot() {
    if (pushStatus.value !== 'on') return
    clearTimeout(snapshotTimer)
    snapshotTimer = setTimeout(() => void sendSnapshot(), SNAPSHOT_DEBOUNCE_MS)
  }

  /**
   * Sends a scheduled sync right away. Called when the app goes to the background: iOS freezes
   * the PWA before a debounce timer fires, and the server would keep stale counts.
   */
  function flushSnapshot() {
    if (snapshotTimer !== undefined) void sendSnapshot()
  }

  async function sendSnapshot() {
    clearTimeout(snapshotTimer)
    snapshotTimer = undefined
    try {
      await useCases.syncReminders(settingsStore.settings)
    } catch (error) {
      console.warn('[push] could not sync the snapshot', error)
    }
  }

  const sendTest = (message: NudgeMessage) => notifications.show(message)

  /** Asks the server to send a push — checks the whole chain end to end. */
  const sendServerTest = (delaySeconds: number) =>
    push.sendTest(settingsStore.settings.locale, delaySeconds)

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
