<script setup lang="ts">
import { UiButton } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useRemindersStore } from '../../stores/reminders'
import SettingsSection from './SettingsSection.vue'

const { t } = useAppI18n()
const reminders = useRemindersStore()
</script>

<template>
  <SettingsSection :title="t('reminders.title')">
    <template v-if="reminders.permission === 'granted'">
      <p class="ui-hint">✅ {{ t('reminders.granted') }}</p>

      <h3 class="reminders__subtitle">{{ t('reminders.push.title') }}</h3>
      <p class="ui-hint">{{ t(`reminders.push.${reminders.pushStatus}`) }}</p>
      <UiButton
        v-if="reminders.pushStatus === 'off'"
        variant="secondary"
        @click="reminders.syncPush"
      >
        {{ t('reminders.push.enable') }}
      </UiButton>
    </template>
    <template v-else-if="reminders.permission === 'default'">
      <p class="ui-hint">{{ t('reminders.banner.text') }}</p>
      <UiButton @click="reminders.requestPermission">{{ t('reminders.enable') }}</UiButton>
    </template>
    <p v-else-if="reminders.permission === 'needs-install'" class="ui-hint">
      📲 {{ t('reminders.install.text') }}
    </p>
    <p v-else-if="reminders.permission === 'denied'" class="ui-hint">
      🔕 {{ t('reminders.denied') }}
    </p>
    <p v-else class="ui-hint">🔕 {{ t('reminders.unsupported') }}</p>
  </SettingsSection>
</template>

<style scoped>
.reminders__subtitle {
  margin-top: var(--space-2);
  font-size: var(--font-size-md);
}
</style>
