<script setup lang="ts">
import { LOCALES } from '@tuktuk/core'
import { LOCALE_NAMES, useAppI18n } from '../i18n'

const { locale, t } = useAppI18n()
</script>

<template>
  <label>
    {{ t('locale.label') }}
    <select v-model="locale">
      <option v-for="code in LOCALES" :key="code" :value="code">
        {{ LOCALE_NAMES[code] }}
      </option>
    </select>
  </label>
</template>
