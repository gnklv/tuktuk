<script setup lang="ts">
import { UiButton, UiCard } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useRemindersStore } from '../../stores/reminders'

/**
 * Without notifications the whole idea doesn't work. Install and enable prompts are shown always
 * (on iOS, Safari and the installed app have separate storage, so Safari has no tasks at all);
 * "blocked" and "unsupported" only matter when there is something to remind about.
 */
const { hasPending } = defineProps<{ hasPending: boolean }>()
const { t } = useAppI18n()
const reminders = useRemindersStore()
</script>

<template>
  <UiCard
    v-if="
      reminders.permission === 'default' ||
      reminders.permission === 'needs-install' ||
      (hasPending && reminders.permission !== 'granted')
    "
    class="banner"
  >
    <template v-if="reminders.permission === 'default'">
      <p class="banner__title">🔔 {{ t('reminders.banner.title') }}</p>
      <p class="banner__text">{{ t('reminders.banner.text') }}</p>
      <UiButton block @click="reminders.requestPermission">{{ t('reminders.enable') }}</UiButton>
    </template>
    <template v-else-if="reminders.permission === 'needs-install'">
      <p class="banner__title">📲 {{ t('reminders.install.title') }}</p>
      <p class="banner__text">{{ t('reminders.install.text') }}</p>
    </template>
    <p v-else-if="reminders.permission === 'denied'" class="banner__text">
      🔕 {{ t('reminders.denied') }}
    </p>
    <p v-else class="banner__text">🔕 {{ t('reminders.unsupported') }}</p>
  </UiCard>
</template>

<style scoped>
.banner {
  display: grid;
  gap: var(--space-2);
}

.banner__title {
  font-weight: var(--font-weight-black);
}

.banner__text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
