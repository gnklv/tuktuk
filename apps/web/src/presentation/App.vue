<script setup lang="ts">
import { onMounted, watch, watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useAppI18n } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useTodayStore } from './stores/today'
import { useRemindersStore } from './stores/reminders'
import { useClockTick } from './composables/use-clock-tick'

const { t, locale } = useAppI18n()
const settingsStore = useSettingsStore()
const todayStore = useTodayStore()
const reminders = useRemindersStore()

// App-wide, so reminders keep coming on any screen.
onMounted(() => {
  void todayStore.load()
  void reminders.syncPush()
})
useClockTick(async () => {
  await todayStore.tick()
  reminders.refreshPermission()
  await reminders.check()
})
// Tasks or settings changed → the next reminder may be due earlier, later or not at all.
watch([() => todayStore.overview, () => settingsStore.settings], () => {
  void reminders.check()
  // The server's copy too: it reminds while the app is closed.
  reminders.syncSnapshot()
})

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
  /* Standalone on iPhone: content goes under the notch and the home indicator. */
  padding: max(var(--space-5), env(safe-area-inset-top))
    max(var(--space-4), env(safe-area-inset-right)) max(var(--space-5), env(safe-area-inset-bottom))
    max(var(--space-4), env(safe-area-inset-left));
}
</style>
