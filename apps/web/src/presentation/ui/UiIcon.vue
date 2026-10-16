<script setup lang="ts">
/** Line icons on a 24×24 grid, drawn with the current text color. Decorative: label the control instead. */
export type IconName = 'close' | 'plus' | 'back' | 'settings'

defineProps<{ name: IconName; size?: number }>()
</script>

<template>
  <svg
    class="ui-icon"
    viewBox="0 0 24 24"
    :width="size ?? 24"
    :height="size ?? 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-if="name === 'close'" stroke-width="2.5" d="M6 6l12 12M18 6L6 18" />
    <path v-else-if="name === 'plus'" stroke-width="3" d="M12 5v14M5 12h14" />
    <path v-else-if="name === 'back'" stroke-width="2.5" d="M15 5l-7 7 7 7" />
    <g v-else-if="name === 'settings'" stroke-width="2">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
      />
    </g>
  </svg>
</template>

<style scoped>
.ui-icon {
  flex: none;
}
</style>
