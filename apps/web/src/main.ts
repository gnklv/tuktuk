// Composition root: the only place that knows about concrete implementations.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { makeGetSettings } from '@tuktuk/core'
import { nudgeCopy } from '@tuktuk/i18n'
import './presentation/ui'
import App from './presentation/App.vue'
import { createUseCases } from './application/use-cases'
import {
  ClockKey,
  InitialSettingsKey,
  NotificationsKey,
  UiPrefsKey,
  EnvironmentKey,
  UseCasesKey,
} from './presentation/di'
import { createAppI18n } from './presentation/i18n'
import { createAppRouter } from './presentation/router'
import { installNewVersionRecovery } from './presentation/new-version'
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

const useCases = createUseCases({
  clock,
  ids: cryptoIdGenerator,
  environment: env,
  taskRepo,
  completionRepo,
  settingsRepo,
  nudgeLog: new LocalStorageNudgeLogRepository(localStorage),
  notifier,
  localTitles: new IndexedDbReminderTitles(),
  push,
  copy: nudgeCopy,
  random: Math.random,
})

const settings = await makeGetSettings({ settingsRepo })(env)

const router = createAppRouter()
installNewVersionRecovery(router)

createApp(App)
  .provide(ClockKey, clock)
  .provide(UseCasesKey, useCases)
  .provide(InitialSettingsKey, settings)
  .provide(NotificationsKey, notifier)
  .provide(UiPrefsKey, new LocalStorageUiPrefs(localStorage))
  .provide(EnvironmentKey, browserEnvironment)
  .use(createPinia())
  .use(createAppI18n(settings.locale))
  .use(router)
  .mount('#app')
