import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import {
  toLocalDate,
  type DayOverview,
  type LocalDate,
  type NewTaskInput,
  type TaskId,
} from '@tuktuk/core'
import { useClock, useUseCases } from '../di'
import { useSettingsStore } from './settings'

/** View-model of the "Today" screen. Talks to use cases only, never to storage. */
export const useTodayStore = defineStore('today', () => {
  const useCases = useUseCases()
  const clock = useClock()
  const settingsStore = useSettingsStore()

  const today = (): LocalDate => toLocalDate(clock.now(), settingsStore.settings.timeZone)

  /** The day currently shown. Changes only via `load()`, so it never drifts from `overview`. */
  const date = shallowRef<LocalDate>(today())
  const overview = shallowRef<DayOverview | null>(null)

  const total = computed(() => overview.value?.items.length ?? 0)
  const done = computed(() => overview.value?.doneCount ?? 0)
  const allDone = computed(() => total.value > 0 && done.value === total.value)

  async function load() {
    const day = today()
    const result = await useCases.getDayOverview(day)
    date.value = day
    overview.value = result
  }

  /** Reloads only if the calendar day has changed since the last load. */
  async function syncDay() {
    if (today() !== date.value) await load()
  }

  async function addTask(input: NewTaskInput) {
    await useCases.addTask(input, today())
    await load()
  }

  async function archive(taskId: TaskId) {
    await useCases.archiveTask(taskId, today())
    await load()
  }

  async function toggle(taskId: TaskId) {
    // The list is from a day that is already over: show the new day instead of
    // silently ticking off yesterday's task.
    if (today() !== date.value) return load()
    await useCases.toggleCompletion(taskId, date.value)
    await load()
  }

  return { date, overview, total, done, allDone, today, load, syncDay, addTask, archive, toggle }
})
