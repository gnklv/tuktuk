import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import {
  computePressure,
  toLocalDate,
  type DayOverview,
  type LocalDate,
  type NewTaskInput,
  type StreakOverview,
  type TaskId,
} from '@tuktuk/core'
import { useClock, useUseCases } from '../di'
import { useSettingsStore } from './settings'

/** View-model of the "Today" screen. Talks to use cases only, never to storage. */
export const useTodayStore = defineStore('today', () => {
  const useCases = useUseCases()
  const clock = useClock()
  const settingsStore = useSettingsStore()

  /** Reactive "now", refreshed by `tick()`. */
  const now = shallowRef(clock.now())
  /** The calendar date right now, in the user's timezone. */
  const currentDate = (): LocalDate => toLocalDate(clock.now(), settingsStore.settings.timeZone)

  /** The day on screen. Changes only via `load()`, so it never drifts from `overview`. */
  const shownDate = shallowRef<LocalDate>(currentDate())
  const overview = shallowRef<DayOverview | null>(null)
  const streak = shallowRef<StreakOverview | null>(null)

  const total = computed(() => overview.value?.items.length ?? 0)
  const done = computed(() => overview.value?.doneCount ?? 0)
  const allDone = computed(() => total.value > 0 && done.value === total.value)

  const pressure = computed(() =>
    computePressure({
      now: now.value,
      settings: settingsStore.settings,
      pending: total.value - done.value,
      total: total.value,
    }),
  )

  async function load() {
    now.value = clock.now()
    const day = currentDate()
    const [result, streakResult] = await Promise.all([
      useCases.getDayOverview(day),
      useCases.getStreak(day),
    ])
    shownDate.value = day
    overview.value = result
    streak.value = streakResult
  }

  /** Reloads only if the calendar day has changed since the last load. */
  async function syncDay() {
    if (currentDate() !== shownDate.value) await load()
  }

  /** Called every minute and when the tab wakes up. */
  async function tick() {
    now.value = clock.now()
    await syncDay()
  }

  async function addTask(input: NewTaskInput) {
    await useCases.addTask(input, currentDate())
    await load()
  }

  async function archive(taskId: TaskId) {
    await useCases.archiveTask(taskId, currentDate())
    await load()
  }

  async function toggle(taskId: TaskId) {
    // The list is from a day that is already over: show the new day instead of
    // silently ticking off yesterday's task.
    if (currentDate() !== shownDate.value) return load()
    await useCases.toggleCompletion(taskId, shownDate.value)
    await load()
  }

  return {
    shownDate,
    overview,
    streak,
    total,
    done,
    allDone,
    pressure,
    currentDate,
    load,
    syncDay,
    tick,
    addTask,
    archive,
    toggle,
  }
})
