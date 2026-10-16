// Composition root: the only place that knows about concrete implementations.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  makeAddTask,
  makeArchiveTask,
  makeCheckNudge,
  makeGetReminderSnapshot,
  makeGetPendingTitles,
  makeGetStreak,
  makeGetDayOverview,
  makeGetSettings,
  makeToggleCompletion,
  makeUpdateSettings,
} from '@tuktuk/core'
import { nudgeCopy } from '@tuktuk/i18n'
import './presentation/ui'
import App from './presentation/App.vue'
import { makeSyncPush, makeSyncReminders } from './application/reminders'
import {
  ClockKey,
  InitialSettingsKey,
  NotificationsKey,
  PushKey,
  UiPrefsKey,
  EnvironmentKey,
  UseCasesKey,
  type AppUseCases,
} from './presentation/di'
import { createAppI18n } from './presentation/i18n'
import { createAppRouter } from './presentation/router'
import { systemClock } from './infrastructure/system-clock'
import { createDevClock } from './infrastructure/dev-clock'
import { cryptoIdGenerator } from './infrastructure/crypto-id-generator'
import { browserEnvironment } from './infrastructure/browser-environment'
import { BrowserNotifier } from './infrastructure/browser-notifier'
import { WebPushService, browserPushRegistration } from './infrastructure/push/web-push-service'
import { PushServerClient } from './infrastructure/push/push-server-client'
import { DeviceCredentialsStore } from './infrastructure/push/device-credentials-store'
import { IndexedDbReminderTitles } from './infrastructure/indexed-db-reminder-titles'
import { LocalStorageTaskRepository } from './infrastructure/storage/local-storage-task-repository'
import { LocalStorageCompletionRepository } from './infrastructure/storage/local-storage-completion-repository'
import { LocalStorageSettingsRepository } from './infrastructure/storage/local-storage-settings-repository'
import { LocalStorageNudgeLogRepository } from './infrastructure/storage/local-storage-nudge-log-repository'
import { LocalStorageUiPrefs } from './infrastructure/storage/local-storage-ui-prefs'

const clock = import.meta.env.DEV ? createDevClock() : systemClock
const env = browserEnvironment()
const taskRepo = new LocalStorageTaskRepository(localStorage)
const completionRepo = new LocalStorageCompletionRepository(localStorage)
const settingsRepo = new LocalStorageSettingsRepository(localStorage)
const nudgeLog = new LocalStorageNudgeLogRepository(localStorage)
const notifier = new BrowserNotifier()
/** Push server: production by default, a local `wrangler dev` in development. */
const apiUrl: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8787' : 'https://tuktuk.tuktuk-worker.workers.dev')
const push = new WebPushService({
  credentials: new DeviceCredentialsStore(localStorage),
  server: new PushServerClient(apiUrl),
  registration: browserPushRegistration,
})

const updateSettings = makeUpdateSettings({ settingsRepo })
const getPendingTitles = makeGetPendingTitles({ taskRepo, completionRepo })
const getReminderSnapshot = makeGetReminderSnapshot({ taskRepo, completionRepo })
const useCases: AppUseCases = {
  addTask: makeAddTask({ taskRepo, ids: cryptoIdGenerator, clock }),
  archiveTask: makeArchiveTask({ taskRepo }),
  toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
  getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
  updateSettings: (patch) => updateSettings(patch, env),
  getReminderSnapshot,
  getPendingTitles,
  getStreak: makeGetStreak({ taskRepo, completionRepo }),
  syncReminders: makeSyncReminders({
    clock,
    getPendingTitles,
    getReminderSnapshot,
    localTitles: new IndexedDbReminderTitles(),
    push,
  }),
  syncPush: makeSyncPush({ push }),
  checkNudge: makeCheckNudge({
    clock,
    taskRepo,
    completionRepo,
    nudgeLog,
    notifier,
    copy: nudgeCopy,
    random: Math.random,
  }),
}

const settings = await makeGetSettings({ settingsRepo })(env)

createApp(App)
  .provide(ClockKey, clock)
  .provide(UseCasesKey, useCases)
  .provide(InitialSettingsKey, settings)
  .provide(NotificationsKey, notifier)
  .provide(PushKey, push)
  .provide(UiPrefsKey, new LocalStorageUiPrefs(localStorage))
  .provide(EnvironmentKey, browserEnvironment)
  .use(createPinia())
  .use(createAppI18n(settings.locale))
  .use(createAppRouter())
  .mount('#app')
