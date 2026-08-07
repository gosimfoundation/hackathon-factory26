<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../composables/useI18n'

const { t, pick } = useI18n()
const open = ref(true)

function dismiss() {
  open.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="dismiss" />

      <div class="relative w-full max-w-md border border-border bg-bg-primary p-8 md:p-10">
        <div class="mono-label text-accent">{{ pick('Notice', '提示') }}</div>
        <h2 class="mt-6 text-2xl font-semibold tracking-[-0.04em] text-text-primary md:text-3xl">
          {{ t('construction.title') }}
        </h2>
        <p class="mt-4 text-sm leading-relaxed text-text-secondary">{{ t('construction.desc') }}</p>
        <button
          @click="dismiss"
          class="mt-8 w-full bg-btn-bg px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-btn-text transition-colors hover:bg-btn-hover"
        >
          {{ t('construction.dismiss') }}
        </button>
      </div>
    </div>
  </Transition>
</template>
