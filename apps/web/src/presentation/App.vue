<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useAppI18n } from './i18n'
import { useSettingsStore } from './stores/settings'

const { t, locale } = useAppI18n()
const settingsStore = useSettingsStore()

watchEffect(() => {
  locale.value = settingsStore.settings.locale
  document.documentElement.lang = locale.value
  document.title = t('app.name')
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
