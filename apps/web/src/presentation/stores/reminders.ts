import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { NudgeMessage } from '@tuktuk/core'
import { useNotifications, useUseCases } from '../di'
import { useSettingsStore } from './settings'

/** The user is looking at the app — a system notification would be noise. */
const userIsLooking = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()

/** In-tab reminder scheduler: `check()` is called every minute and whenever the day changes. */
export const useRemindersStore = defineStore('reminders', () => {
  const useCases = useUseCases()
  const notifications = useNotifications()
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
  }

  /** The user can change the permission in browser settings at any time. */
  function refreshPermission() {
    permission.value = notifications.permission()
  }

  const sendTest = (message: NudgeMessage) => notifications.show(message)

  return { permission, nextAt, check, requestPermission, refreshPermission, sendTest }
})
