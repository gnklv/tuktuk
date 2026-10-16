import { computed, ref } from 'vue'
import { shouldShowYesterdaySummary } from '../../../application/yesterday-summary'
import { useUiPrefs } from '../../di'
import { useTodayStore } from '../../stores/today'

/** Whether to show the "how did yesterday go" card, and dismissing it for today. */
export function useYesterdaySummary() {
  const today = useTodayStore()
  const uiPrefs = useUiPrefs()
  const dismissedOn = ref(uiPrefs.summarySeenOn())

  const visible = computed(() =>
    shouldShowYesterdaySummary(today.streak, dismissedOn.value, today.shownDate),
  )

  function dismiss() {
    uiPrefs.markSummarySeen(today.shownDate)
    dismissedOn.value = today.shownDate
  }

  return { visible, dismiss }
}
