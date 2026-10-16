import { inject, type InjectionKey } from 'vue'
import type { Clock, Settings, SettingsEnvironment } from '@tuktuk/core'
import type { NotificationAccess, UiPrefs } from '../application/ports'
import type { AppUseCases } from '../application/use-cases'

export type { AppUseCases }

// Symbol.for: the same key survives hot module reloads of this file in dev.
export const ClockKey: InjectionKey<Clock> = Symbol.for('tuktuk:Clock')
export const UseCasesKey: InjectionKey<AppUseCases> = Symbol.for('tuktuk:UseCases')
/** Settings loaded before mount, so the UI never sees "no settings yet". */
export const InitialSettingsKey: InjectionKey<Settings> = Symbol.for('tuktuk:InitialSettings')

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
export const useUiPrefs = (): UiPrefs => injectStrict(UiPrefsKey)
export const useEnvironment = (): (() => SettingsEnvironment) => injectStrict(EnvironmentKey)
