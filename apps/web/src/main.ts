// Composition root: the only place that knows about concrete implementations.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { resolveLocale } from '@tuktuk/core'
import App from './presentation/App.vue'
import { ClockKey } from './presentation/di'
import { createAppI18n } from './presentation/i18n'
import { systemClock } from './infrastructure/system-clock'

// TODO(stage 2.1): read the saved locale from Settings before falling back to the browser.
const locale = resolveLocale(navigator.languages)

createApp(App)
  .use(createPinia())
  .use(createAppI18n(locale))
  .provide(ClockKey, systemClock)
  .mount('#app')
