<script setup lang="ts">
import { UiToast } from '../../ui'
import { useToastsStore } from '../../stores/toasts'

const toasts = useToastsStore()
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="toast">
      <UiToast
        v-for="toast in toasts.toasts"
        :key="toast.id"
        :message="toast.message"
        :tone="toast.tone"
        @click="toasts.dismiss(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  /* Above the add form in the thumb zone, clear of the home indicator. */
  bottom: calc(120px + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 10;
  display: grid;
  gap: var(--space-2);
  width: min(448px, calc(100% - 2 * var(--space-4)));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast-host > * {
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
