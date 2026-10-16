import { inject, type InjectionKey } from 'vue'
import type {
  Clock,
  Locale,
  PendingTitles,
  ReminderSnapshot,
  NudgeMessage,
  Settings,
  makeAddTask,
  makeCheckNudge,
  makeGetReminderSnapshot,
  makeGetPendingTitles,
  makeGetStreak,
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
  getReminderSnapshot: ReturnType<typeof makeGetReminderSnapshot>
  getPendingTitles: ReturnType<typeof makeGetPendingTitles>
  getStreak: ReturnType<typeof makeGetStreak>
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

// Symbol.for: the same key survives hot module reloads of this file in dev.
export const ClockKey: InjectionKey<Clock> = Symbol.for('tuktuk:Clock')
export const UseCasesKey: InjectionKey<AppUseCases> = Symbol.for('tuktuk:UseCases')
/** Settings loaded before mount, so the UI never sees "no settings yet". */
export const InitialSettingsKey: InjectionKey<Settings> = Symbol.for('tuktuk:InitialSettings')
export type PushStatus = 'unsupported' | 'off' | 'on'

/** Web Push via the server: reminders even when the app is closed. */
export interface PushAccess {
  status(): Promise<PushStatus>
  enable(): Promise<void>
  /** The server sends a push after `delaySeconds` — time to lock the phone. */
  sendTest(locale: Locale, delaySeconds: number): Promise<void>
  /** Tells the server what it needs to schedule reminders: settings and counts, no titles. */
  syncSnapshot(snapshot: ReminderSnapshot): Promise<void>
  /** Keeps pending titles on the device, where push texts are composed. Never sent anywhere. */
  saveLocalTitles(titles: PendingTitles): Promise<void>
}

export const PushKey: InjectionKey<PushAccess> = Symbol.for('tuktuk:Push')

/** Small per-device UI memory that isn't part of the domain. */
export interface UiPrefs {
  /** The day whose "yesterday" summary was last dismissed. */
  summarySeenOn(): string | null
  markSummarySeen(date: string): void
}

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
