<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_QUIET_HOURS } from '@tuktuk/core'
import { UiCheckbox, UiTimeField } from '../../ui'
import { useAppI18n } from '../../i18n'
import SettingsSection from './SettingsSection.vue'
import { timeFromInput, timeToInput } from './time-input'
import { useSettingsSection } from './use-settings-section'

const { t } = useAppI18n()
const { settings, save, error, revision } = useSettingsSection()

/** The current range, or the default one to show while quiet hours are off. */
const range = computed(() => settings.value.quietHours ?? DEFAULT_QUIET_HOURS)

const enabled = computed({
  get: () => settings.value.quietHours !== null,
  set: (on: boolean) => save({ quietHours: on ? DEFAULT_QUIET_HOURS : null }),
})
const start = computed({
  get: () => timeToInput(range.value.start),
  set: (value: string) => save({ quietHours: { ...range.value, start: timeFromInput(value) } }),
})
const end = computed({
  get: () => timeToInput(range.value.end),
  set: (value: string) => save({ quietHours: { ...range.value, end: timeFromInput(value) } }),
})
</script>

<template>
  <SettingsSection
    :title="t('settings.quietHours.title')"
    :hint="t('settings.quietHours.hint')"
    :error="error"
  >
    <UiCheckbox v-model="enabled">{{ t('settings.quietHours.enabled') }}</UiCheckbox>
    <div v-if="enabled" :key="revision" class="quiet-hours__range">
      <UiTimeField v-model="start" :label="t('settings.quietHours.from')" />
      <UiTimeField v-model="end" :label="t('settings.quietHours.to')" />
    </div>
  </SettingsSection>
</template>

<style scoped>
.quiet-hours__range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
}
</style>
