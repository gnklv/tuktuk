<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { LOCALES, THEMES, timeOfDay, type Locale, type Settings, type Theme } from '@tuktuk/core'
import { UiButton, UiCard, UiCheckbox, UiIconButton, UiSegmentedControl, UiTimeField } from '../ui'
import { LOCALE_NAMES } from '@tuktuk/i18n'
import { useAppI18n } from '../i18n'
import { errorMessageKey } from '../i18n/errors'
import { useSettingsStore } from '../stores/settings'
import { useRemindersStore } from '../stores/reminders'
import {
  deadlineFromInput,
  deadlineToInput,
  timeFromInput,
  timeToInput,
} from '../features/settings/time-input'

type Section = 'deadline' | 'quietHours' | 'timeZone'

const { t } = useAppI18n()
const store = useSettingsStore()
const reminders = useRemindersStore()

const pushTest = ref<'idle' | 'sending' | 'sent' | 'failed'>('idle')
async function sendServerTest() {
  pushTest.value = 'sending'
  try {
    await reminders.sendServerTest()
    pushTest.value = 'sent'
  } catch (error) {
    console.warn('[push] test failed', error)
    pushTest.value = 'failed'
  }
}

const sendTestReminder = () =>
  reminders.sendTest({
    id: 'test',
    title: t('reminders.test.title'),
    body: t('reminders.test.body'),
  })
const settings = computed(() => store.settings)

const error = ref<{ section: Section; message: string } | null>(null)
/** Bumped after a rejected change so inputs re-render with the saved value. */
const revision = ref(0)

async function save(section: Section, patch: () => Partial<Settings>) {
  try {
    await store.update(patch())
    if (error.value?.section === section) error.value = null
  } catch (e) {
    error.value = { section, message: t(errorMessageKey(e)) }
    revision.value++
  }
}

const deadline = computed({
  get: () => deadlineToInput(settings.value.dayDeadline),
  set: (value: string) => save('deadline', () => ({ dayDeadline: deadlineFromInput(value) })),
})

const quietEnabled = computed({
  get: () => settings.value.quietHours !== null,
  set: (on: boolean) =>
    save('quietHours', () => ({
      quietHours: on ? { start: timeOfDay(23, 30), end: timeOfDay(8) } : null,
    })),
})
const quietStart = computed({
  get: () => timeToInput(settings.value.quietHours?.start ?? timeOfDay(23, 30)),
  set: (value: string) =>
    save('quietHours', () => ({
      quietHours: { start: timeFromInput(value), end: settings.value.quietHours!.end },
    })),
})
const quietEnd = computed({
  get: () => timeToInput(settings.value.quietHours?.end ?? timeOfDay(8)),
  set: (value: string) =>
    save('quietHours', () => ({
      quietHours: { start: settings.value.quietHours!.start, end: timeFromInput(value) },
    })),
})

const locale = computed({
  get: () => settings.value.locale,
  set: (value: Locale) => store.update({ locale: value }),
})
const localeOptions = LOCALES.map((code) => ({ value: code, label: LOCALE_NAMES[code] }))

const theme = computed({
  get: () => settings.value.theme,
  set: (value: Theme) => store.update({ theme: value }),
})
const themeOptions = computed(() =>
  THEMES.map((value) => ({ value, label: t(`settings.theme.${value}`) })),
)

const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const useDeviceTimeZone = () => save('timeZone', () => ({ timeZone: deviceTimeZone }))

const errorFor = (section: Section) =>
  error.value?.section === section ? error.value.message : null
</script>

<template>
  <div class="settings">
    <header class="settings__header">
      <UiIconButton :as="RouterLink" to="/" :label="t('settings.back')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </UiIconButton>
      <h1>{{ t('settings.title') }}</h1>
    </header>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('settings.deadline.title') }}</h2>
      <p class="hint">{{ t('settings.deadline.hint') }}</p>
      <UiTimeField
        :key="`deadline-${revision}`"
        v-model="deadline"
        :label="t('settings.deadline.label')"
      />
      <p v-if="errorFor('deadline')" class="error" role="alert">{{ errorFor('deadline') }}</p>
    </UiCard>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('reminders.title') }}</h2>
      <template v-if="reminders.permission === 'granted'">
        <p class="hint">✅ {{ t('reminders.granted') }}</p>
        <UiButton variant="secondary" @click="sendTestReminder">
          {{ t('reminders.test.button') }}
        </UiButton>

        <h3 class="settings__subtitle">{{ t('reminders.push.title') }}</h3>
        <p class="hint">{{ t(`reminders.push.${reminders.pushStatus}`) }}</p>
        <UiButton
          v-if="reminders.pushStatus === 'off'"
          variant="secondary"
          @click="reminders.syncPush"
        >
          {{ t('reminders.push.enable') }}
        </UiButton>
        <template v-else-if="reminders.pushStatus === 'on'">
          <UiButton variant="secondary" :disabled="pushTest === 'sending'" @click="sendServerTest">
            {{ t('reminders.push.test') }}
          </UiButton>
          <p v-if="pushTest === 'sent'" class="hint" role="status">
            {{ t('reminders.push.testSent') }}
          </p>
          <p v-if="pushTest === 'failed'" class="error" role="alert">
            {{ t('reminders.push.error') }}
          </p>
        </template>
      </template>
      <template v-else-if="reminders.permission === 'default'">
        <p class="hint">{{ t('reminders.banner.text') }}</p>
        <UiButton @click="reminders.requestPermission">{{ t('reminders.enable') }}</UiButton>
      </template>
      <template v-else-if="reminders.permission === 'needs-install'">
        <p class="hint">📲 {{ t('reminders.install.text') }}</p>
      </template>
      <p v-else-if="reminders.permission === 'denied'" class="hint">
        🔕 {{ t('reminders.denied') }}
      </p>
      <p v-else class="hint">🔕 {{ t('reminders.unsupported') }}</p>
    </UiCard>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('settings.quietHours.title') }}</h2>
      <p class="hint">{{ t('settings.quietHours.hint') }}</p>
      <UiCheckbox v-model="quietEnabled">{{ t('settings.quietHours.enabled') }}</UiCheckbox>
      <div v-if="quietEnabled" :key="`quiet-${revision}`" class="settings__row">
        <UiTimeField v-model="quietStart" :label="t('settings.quietHours.from')" />
        <UiTimeField v-model="quietEnd" :label="t('settings.quietHours.to')" />
      </div>
      <p v-if="errorFor('quietHours')" class="error" role="alert">{{ errorFor('quietHours') }}</p>
    </UiCard>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('settings.language') }}</h2>
      <UiSegmentedControl
        v-model="locale"
        :label="t('settings.language')"
        :options="localeOptions"
      />
    </UiCard>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('settings.theme.title') }}</h2>
      <UiSegmentedControl
        v-model="theme"
        :label="t('settings.theme.title')"
        :options="themeOptions"
      />
    </UiCard>

    <UiCard as="section" class="settings__section">
      <h2>{{ t('settings.timeZone.title') }}</h2>
      <p class="settings__value">{{ settings.timeZone }}</p>
      <template v-if="settings.timeZone !== deviceTimeZone">
        <p class="hint">{{ t('settings.timeZone.differs', { device: deviceTimeZone }) }}</p>
        <UiButton variant="secondary" @click="useDeviceTimeZone">
          {{ t('settings.timeZone.useDevice') }}
        </UiButton>
      </template>
      <p v-if="errorFor('timeZone')" class="error" role="alert">{{ errorFor('timeZone') }}</p>
    </UiCard>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

.settings__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: calc(-1 * var(--space-2));
}

.settings__section {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.settings__section h2 {
  font-size: var(--font-size-lg);
}

.settings__section > :deep(.ui-time-field) {
  width: min(100%, 180px);
}

.settings__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  width: 100%;
}

.settings__subtitle {
  margin-top: var(--space-2);
  font-size: var(--font-size-md);
}

.settings__value {
  font-weight: var(--font-weight-bold);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>
