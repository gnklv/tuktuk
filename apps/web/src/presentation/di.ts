import { inject, type InjectionKey } from 'vue'
import type {
  Clock,
  Settings,
  SettingsEnvironment,
  makeAddTask,
  makeCheckNudge,
  makeGetReminderSnapshot,
  makeGetPendingTitles,
  makeGetStreak,
  makeArchiveTask,
  makeGetDayOverview,
  makeToggleCompletion,
} from '@tuktuk/core'
import type { NotificationAccess, PushAccess, UiPrefs } from '../application/ports'
import type { makeSyncPush, makeSyncReminders } from '../application/reminders'

/** Use cases with all their dependencies already bound in the composition root. */
export interface AppUseCases {
  addTask: ReturnType<typeof makeAddTask>
  archiveTask: ReturnType<typeof makeArchiveTask>
  toggleCompletion: ReturnType<typeof makeToggleCompletion>
  getDayOverview: ReturnType<typeof makeGetDayOverview>
  updateSettings: (patch: Partial<Settings>) => Promise<Settings>
  checkNudge: ReturnType<typeof makeCheckNudge>
  getReminderSnapshot: ReturnType<typeof makeGetReminderSnapshot>
  getPendingTitles: ReturnType<typeof makeGetPendingTitles>
  getStreak: ReturnType<typeof makeGetStreak>
  syncReminders: ReturnType<typeof makeSyncReminders>
  syncPush: ReturnType<typeof makeSyncPush>
}

// Symbol.for: the same key survives hot module reloads of this file in dev.
export const ClockKey: InjectionKey<Clock> = Symbol.for('tuktuk:Clock')
export const UseCasesKey: InjectionKey<AppUseCases> = Symbol.for('tuktuk:UseCases')
/** Settings loaded before mount, so the UI never sees "no settings yet". */
export const InitialSettingsKey: InjectionKey<Settings> = Symbol.for('tuktuk:InitialSettings')
export const PushKey: InjectionKey<PushAccess> = Symbol.for('tuktuk:Push')

/** The device's language and timezone right now (they can change, e.g. when travelling). */
export const EnvironmentKey: InjectionKey<() => SettingsEnvironment> =
  Symbol.for('tuktuk:Environment')
export const UiPrefsKey: InjectionKey<UiPrefs> = Symbol.for('tuktuk:UiPrefs')
export const NotificationsKey: InjectionKey<NotificationAccess> = Symbol.for('tuktuk:Notifications')

function injectStrict<T>(key: InjectionKey<T>): T {
  const value = inject(key)
  if (value === undefined) {
    throw new Error(`Dependency ${String(key.description)} is not provided`)
  }
  return value
}

export const useClock = (): Clock => injectStrict(ClockKey)
export const useUseCases = (): AppUseCases => injectStrict(UseCasesKey)
export const useInitialSettings = (): Settings => injectStrict(InitialSettingsKey)
export const useNotifications = (): NotificationAccess => injectStrict(NotificationsKey)
export const usePush = (): PushAccess => injectStrict(PushKey)
export const useUiPrefs = (): UiPrefs => injectStrict(UiPrefsKey)
export const useEnvironment = (): (() => SettingsEnvironment) => injectStrict(EnvironmentKey)
