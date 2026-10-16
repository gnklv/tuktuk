<script setup lang="ts">
import { ref } from 'vue'
import { UiButton } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useRemindersStore } from '../../stores/reminders'
import SettingsSection from './SettingsSection.vue'

const { t } = useAppI18n()
const reminders = useRemindersStore()

const sendTestReminder = () =>
  reminders.sendTest({
    id: 'test',
    title: t('reminders.test.title'),
    body: t('reminders.test.body'),
  })

/** Long enough to lock the phone: a push to an app in the foreground proves little. */
const PUSH_TEST_DELAY_SECONDS = 10
const pushTest = ref<'idle' | 'sending' | 'sent' | 'failed'>('idle')

async function sendServerTest() {
  pushTest.value = 'sending'
  try {
    await reminders.sendServerTest(PUSH_TEST_DELAY_SECONDS)
    pushTest.value = 'sent'
  } catch (error) {
    console.warn('[push] test failed', error)
    pushTest.value = 'failed'
  }
}
</script>

<template>
  <SettingsSection :title="t('reminders.title')">
    <template v-if="reminders.permission === 'granted'">
      <p class="ui-hint">✅ {{ t('reminders.granted') }}</p>
      <UiButton variant="secondary" @click="sendTestReminder">
        {{ t('reminders.test.button') }}
      </UiButton>

      <h3 class="reminders__subtitle">{{ t('reminders.push.title') }}</h3>
      <p class="ui-hint">{{ t(`reminders.push.${reminders.pushStatus}`) }}</p>
      <UiButton
        v-if="reminders.pushStatus === 'off'"
        variant="secondary"
        @click="reminders.syncPush"
      >
        {{ t('reminders.push.enable') }}
      </UiButton>
      <template v-else-if="reminders.pushStatus === 'on'">
        <UiButton variant="secondary" :disabled="pushTest === 'sending'" @click="sendServerTest">
          {{ t('reminders.push.test', { seconds: PUSH_TEST_DELAY_SECONDS }) }}
        </UiButton>
        <p v-if="pushTest === 'sent'" class="ui-hint" role="status">
          {{ t('reminders.push.testSent', { seconds: PUSH_TEST_DELAY_SECONDS }) }}
        </p>
        <p v-if="pushTest === 'failed'" class="ui-error" role="alert">
          {{ t('reminders.push.error') }}
        </p>
      </template>
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
