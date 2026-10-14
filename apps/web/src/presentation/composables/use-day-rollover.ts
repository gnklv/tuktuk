import { onMounted, onUnmounted, watch } from 'vue'
import { msUntilNextLocalDay } from '@tuktuk/core'
import { useClock } from '../di'
import { useSettingsStore } from '../stores/settings'

/** Small margin so the timer fires just *after* midnight, not a hair before. */
const MIDNIGHT_MARGIN_MS = 1000

/**
 * Calls `check` whenever the day might have changed: at local midnight, when the tab
 * becomes visible again (background timers are throttled) and when the timezone changes.
 * `check` must be idempotent — it decides itself whether anything changed.
 */
export function useDayRollover(check: () => void) {
  const clock = useClock()
  const settingsStore = useSettingsStore()
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    clearTimeout(timer)
    const delay = msUntilNextLocalDay(clock.now(), settingsStore.settings.timeZone)
    timer = setTimeout(() => {
      check()
      schedule()
    }, delay + MIDNIGHT_MARGIN_MS)
  }

  function recheck() {
    if (document.visibilityState !== 'visible') return
    check()
    schedule()
  }

  watch(() => settingsStore.settings.timeZone, recheck)

  onMounted(() => {
    schedule()
    document.addEventListener('visibilitychange', recheck)
    window.addEventListener('focus', recheck)
    window.addEventListener('pageshow', recheck) // back/forward cache restore
  })

  onUnmounted(() => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', recheck)
    window.removeEventListener('focus', recheck)
    window.removeEventListener('pageshow', recheck)
  })
}
