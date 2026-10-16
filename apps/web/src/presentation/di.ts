import { inject, type InjectionKey } from 'vue'
import type {
  Clock,
  Locale,
  NudgeMessage,
  Settings,
  makeAddTask,
  makeCheckNudge,
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
  checkNudge: ReturnType<typeof makeCheckNudge>
}

export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  /** iOS Safari tab: notifications work only after "Add to Home Screen". */
  | 'needs-install'

/** System notifications as the UI needs them: permission handling and a test message. */
export interface NotificationAccess {
  permission(): NotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>
  show(message: NudgeMessage): Promise<void>
}

export const ClockKey: InjectionKey<Clock> = Symbol('Clock')
export const UseCasesKey: InjectionKey<AppUseCases> = Symbol('UseCases')
/** Settings loaded before mount, so the UI never sees "no settings yet". */
export const InitialSettingsKey: InjectionKey<Settings> = Symbol('InitialSettings')
export type PushStatus = 'unsupported' | 'off' | 'on'

/** Web Push via the server: reminders even when the app is closed. */
export interface PushAccess {
  status(): Promise<PushStatus>
  enable(): Promise<void>
  /** The server sends a push after `delaySeconds` — time to lock the phone. */
  sendTest(locale: Locale, delaySeconds: number): Promise<void>
}

export const PushKey: InjectionKey<PushAccess> = Symbol('Push')
export const NotificationsKey: InjectionKey<NotificationAccess> = Symbol('Notifications')

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
