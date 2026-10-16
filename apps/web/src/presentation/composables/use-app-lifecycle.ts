import { onMounted, watch } from 'vue'
import { useRemindersStore } from '../stores/reminders'
import { useSettingsStore } from '../stores/settings'
import { useTodayStore } from '../stores/today'
import { useAppHidden } from './use-app-hidden'
import { useClockTick } from './use-clock-tick'

/**
 * What keeps the app alive while it's open, on any screen: the day and its pressure,
 * in-tab reminders and the server's copy of reminders. Used once, in App.vue.
 */
export function useAppLifecycle() {
  const today = useTodayStore()
  const settings = useSettingsStore()
  const reminders = useRemindersStore()

  onMounted(() => {
    void today.load()
    void reminders.syncPush()
  })

  // Every minute and on return to the app: the day may roll over, pressure grows,
  // a reminder may be due. A lost sync goes out too (unchanged snapshots are not resent).
  useClockTick(async () => {
    await today.tick()
    reminders.refreshPermission()
    await reminders.check()
    reminders.syncSnapshot()
  })

  // Tasks or settings changed: the next reminder may be due earlier, later or not at all —
  // both here and on the server, which reminds while the app is closed.
  watch([() => today.overview, () => settings.settings], () => {
    void reminders.check()
    reminders.syncSnapshot()
  })

  // Leaving the app: send pending changes before iOS freezes it.
  useAppHidden(reminders.flushSnapshot)
}
