import { inject, type InjectionKey } from 'vue'
import type {
  Clock,
  Settings,
  makeAddTask,
  makeArchiveTask,
  makeGetDayOverview,
  makeToggleCompletion,
} from '@tuktuk/core'

/** Use cases with all their dependencies already bound in the composition root. */
export interface AppUseCases {
  addTask: ReturnType<typeof makeAddTask>
  archiveTask: ReturnType<typeof makeArchiveTask>
  toggleCompletion: ReturnType<typeof makeToggleCompletion>
  getDayOverview: ReturnType<typeof makeGetDayOverview>
  updateSettings: (patch: Partial<Settings>) => Promise<Settings>
}

export const ClockKey: InjectionKey<Clock> = Symbol('Clock')
export const UseCasesKey: InjectionKey<AppUseCases> = Symbol('UseCases')
/** Settings loaded before mount, so the UI never sees "no settings yet". */
export const InitialSettingsKey: InjectionKey<Settings> = Symbol('InitialSettings')

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
