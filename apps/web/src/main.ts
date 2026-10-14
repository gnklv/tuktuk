// Composition root: the only place that knows about concrete implementations.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  makeAddTask,
  makeArchiveTask,
  makeGetDayOverview,
  makeGetSettings,
  makeToggleCompletion,
  makeUpdateSettings,
} from '@tuktuk/core'
import './presentation/ui'
import App from './presentation/App.vue'
import { ClockKey, InitialSettingsKey, UseCasesKey, type AppUseCases } from './presentation/di'
import { createAppI18n } from './presentation/i18n'
import { createAppRouter } from './presentation/router'
import { systemClock } from './infrastructure/system-clock'
import { cryptoIdGenerator } from './infrastructure/crypto-id-generator'
import { browserEnvironment } from './infrastructure/browser-environment'
import { LocalStorageTaskRepository } from './infrastructure/storage/local-storage-task-repository'
import { LocalStorageCompletionRepository } from './infrastructure/storage/local-storage-completion-repository'
import { LocalStorageSettingsRepository } from './infrastructure/storage/local-storage-settings-repository'

const clock = systemClock
const env = browserEnvironment()
const taskRepo = new LocalStorageTaskRepository(localStorage)
const completionRepo = new LocalStorageCompletionRepository(localStorage)
const settingsRepo = new LocalStorageSettingsRepository(localStorage)

const updateSettings = makeUpdateSettings({ settingsRepo })
const useCases: AppUseCases = {
  addTask: makeAddTask({ taskRepo, ids: cryptoIdGenerator, clock }),
  archiveTask: makeArchiveTask({ taskRepo }),
  toggleCompletion: makeToggleCompletion({ taskRepo, completionRepo, clock }),
  getDayOverview: makeGetDayOverview({ taskRepo, completionRepo }),
  updateSettings: (patch) => updateSettings(patch, env),
}

const settings = await makeGetSettings({ settingsRepo })(env)

createApp(App)
  .provide(ClockKey, clock)
  .provide(UseCasesKey, useCases)
  .provide(InitialSettingsKey, settings)
  .use(createPinia())
  .use(createAppI18n(settings.locale))
  .use(createAppRouter())
  .mount('#app')
