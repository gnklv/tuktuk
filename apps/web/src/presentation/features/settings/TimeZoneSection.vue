<script setup lang="ts">
import { UiButton } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useEnvironment } from '../../di'
import SettingsSection from './SettingsSection.vue'
import { useSettingsSection } from './use-settings-section'

const { t } = useAppI18n()
const { settings, save, error } = useSettingsSection()
const deviceTimeZone = useEnvironment()().timeZone
</script>

<template>
  <SettingsSection :title="t('settings.timeZone.title')" :error="error">
    <p class="time-zone__value">{{ settings.timeZone }}</p>
    <template v-if="settings.timeZone !== deviceTimeZone">
      <p class="ui-hint">{{ t('settings.timeZone.differs', { device: deviceTimeZone }) }}</p>
      <UiButton variant="secondary" @click="save({ timeZone: deviceTimeZone })">
        {{ t('settings.timeZone.useDevice') }}
      </UiButton>
    </template>
  </SettingsSection>
</template>

<style scoped>
.time-zone__value {
  font-weight: var(--font-weight-bold);
}
</style>
