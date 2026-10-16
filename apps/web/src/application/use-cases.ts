import {
  makeAddTask,
  makeArchiveTask,
  makeCheckNudge,
  makeGetDayOverview,
  makeGetPendingTitles,
  makeGetReminderSnapshot,
  makeGetStreak,
  makeToggleCompletion,
  makeUpdateSettings,
  type Clock,
  type CompletionRepository,
  type IdGenerator,
  type Notifier,
  type NudgeCopy,
  type NudgeLogRepository,
  type Settings,
  type SettingsEnvironment,
  type SettingsRepository,
  type TaskRepository,
} from '@tuktuk/core'
import type { LocalTitlesStore, PushAccess } from './ports'
import { makeSyncPush, makeSyncReminders } from './reminders'

/** Everything the web app's use cases depend on: adapters in the app, in-memory fakes in tests. */
export interface UseCaseDeps {
  clock: Clock
  ids: IdGenerator
  /** Defaults for settings that were never saved. */
  environment: SettingsEnvironment
  taskRepo: TaskRepository
  completionRepo: CompletionRepository
  settingsRepo: SettingsRepository
  nudgeLog: NudgeLogRepository
  notifier: Notifier
  localTitles: LocalTitlesStore
  push: PushAccess
  copy: NudgeCopy
  random: () => number
}

/** The web app's use cases, wired once. Presentation gets this object injected. */
export function createUseCases(deps: UseCaseDeps) {
  const { clock, taskRepo, completionRepo, settingsRepo, push } = deps
  const updateSettings = makeUpdateSettings({ settingsRepo })
  const getPendingTitles = makeGetPendingTitles({ taskRepo, completionRepo })
  const getReminderSnapshot = makeGetReminderSnapshot({ taskRepo, completionRepo })

  return {
    addTask: makeAddTask({ taskRepo, ids: deps.ids, clock }),
    archiveTask: makeArchiveTask({ taskRepo }),
    toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
    getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
    getStreak: makeGetStreak({ taskRepo, completionRepo }),
    updateSettings: (patch: Partial<Settings>) => updateSettings(patch, deps.environment),
    getReminderSnapshot,
    getPendingTitles,
    checkNudge: makeCheckNudge({
      clock,
      taskRepo,
      completionRepo,
      nudgeLog: deps.nudgeLog,
      notifier: deps.notifier,
      copy: deps.copy,
      random: deps.random,
    }),
    syncReminders: makeSyncReminders({
      clock,
      getPendingTitles,
      getReminderSnapshot,
      localTitles: deps.localTitles,
      push,
    }),
    syncPush: makeSyncPush({ push }),
  }
}

export type AppUseCases = ReturnType<typeof createUseCases>
