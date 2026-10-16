<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useAppI18n } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useTodayStore } from './stores/today'

const { t, locale } = useAppI18n()
const settingsStore = useSettingsStore()
const todayStore = useTodayStore()

watchEffect(() => {
  locale.value = settingsStore.settings.locale
  document.documentElement.lang = locale.value
  document.title = t('app.name')
})

// The whole UI "heats up" towards the deadline: tokens.css derives colors from --pressure.
watchEffect(() => {
  document.documentElement.style.setProperty('--pressure', String(todayStore.pressure.value))
})

watchEffect(() => {
  const { theme } = settingsStore.settings
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
})
</script>

<template>
  <main class="layout">
    <RouterView />
  </main>
</template>

<style scoped>
.layout {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}
</style>
