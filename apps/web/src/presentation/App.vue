<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAppI18n } from './i18n'
import { useClock } from './di'
import LocaleSwitcher from './components/LocaleSwitcher.vue'

const { t, d, locale } = useAppI18n()
const now = useClock().now()

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.name')
})
</script>

<template>
  <main>
    <h1>{{ t('app.name') }} 🐦</h1>
    <p>{{ t('today.date', { date: d(now, 'dayLong') }) }}</p>
    <LocaleSwitcher />
  </main>
</template>
