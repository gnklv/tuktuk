// Composition root: the only place that knows about concrete implementations.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './presentation/App.vue'
import { ClockKey } from './presentation/di'
import { systemClock } from './infrastructure/system-clock'

createApp(App).use(createPinia()).provide(ClockKey, systemClock).mount('#app')
