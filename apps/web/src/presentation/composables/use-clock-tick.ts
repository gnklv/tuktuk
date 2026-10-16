import { onMounted, onUnmounted, watch } from 'vue'
import { useClock } from '../di'
import { useSettingsStore } from '../stores/settings'

const MINUTE_MS = 60_000

/**
 * Calls `tick` at every minute boundary (pressure grows, the day may roll over), when the tab
 * becomes visible again (background timers are throttled or frozen) and when the timezone changes.
 * `tick` must be cheap and idempotent.
 */
export function useClockTick(tick: () => void) {
  const clock = useClock()
  const settingsStore = useSettingsStore()
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    clearTimeout(timer)
    const now = clock.now().getTime()
    // +50 ms so we land just after the boundary, not a hair before it.
    timer = setTimeout(run, MINUTE_MS - (now % MINUTE_MS) + 50)
  }

  function run() {
    tick()
    schedule()
  }

  function onVisible() {
    if (document.visibilityState === 'visible') run()
  }

  watch(() => settingsStore.settings.timeZone, run)

  onMounted(() => {
    schedule()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    window.addEventListener('pageshow', onVisible) // back/forward cache restore
  })

  onUnmounted(() => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onVisible)
    window.removeEventListener('pageshow', onVisible)
  })
}
