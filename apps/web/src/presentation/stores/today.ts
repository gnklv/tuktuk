import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { toLocalDate, type DayOverview, type TaskId } from '@tuktuk/core'
import { useClock, useUseCases } from '../di'
import { useSettingsStore } from './settings'

/** View-model of the "Today" screen. Talks to use cases only, never to storage. */
export const useTodayStore = defineStore('today', () => {
  const useCases = useUseCases()
  const clock = useClock()
  const settingsStore = useSettingsStore()

  const overview = shallowRef<DayOverview | null>(null)

  const today = () => toLocalDate(clock.now(), settingsStore.settings.timeZone)

  const total = computed(() => overview.value?.items.length ?? 0)
  const done = computed(() => overview.value?.doneCount ?? 0)
  const allDone = computed(() => total.value > 0 && done.value === total.value)

  async function load() {
    overview.value = await useCases.getDayOverview(today())
  }

  async function addTask(title: string) {
    await useCases.addTask({ title, schedule: { kind: 'once', date: today() } })
    await load()
  }

  async function toggle(taskId: TaskId) {
    await useCases.toggleCompletion(taskId, overview.value?.date ?? today())
    await load()
  }

  return { overview, total, done, allDone, load, addTask, toggle }
})
