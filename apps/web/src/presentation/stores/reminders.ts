import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { NudgeMessage } from '@tuktuk/core'
import { useNotifications, usePush, useUseCases, type PushStatus } from '../di'
import { useSettingsStore } from './settings'

/** The user is looking at the app — a system notification would be noise. */
const userIsLooking = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()

/** In-tab reminder scheduler: `check()` is called every minute and whenever the day changes. */
export const useRemindersStore = defineStore('reminders', () => {
  const useCases = useUseCases()
  const notifications = useNotifications()
  const push = usePush()
  const settingsStore = useSettingsStore()

  const permission = shallowRef(notifications.permission())
  const nextAt = shallowRef<Date | null>(null)
  let checking: Promise<void> | null = null

  /** Idempotent and serialized: overlapping calls share one run, so nothing is sent twice. */
  function check(): Promise<void> {
    checking ??= useCases
      .checkNudge({ settings: settingsStore.settings, userIsLooking: userIsLooking() })
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

  const pushStatus = shallowRef<PushStatus>('off')

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
    } catch (error) {
      console.warn('[push] could not enable push', error)
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
    sendTest,
    sendServerTest,
  }
})
