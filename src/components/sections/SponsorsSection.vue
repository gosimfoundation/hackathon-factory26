<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const confirmed = computed(() => t('sponsors.confirmed') as any[])
</script>

<template>
  <section id="sponsors" class="bg-bg-secondary py-20 md:py-28">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('10 / Network', '10 / 合作网络') }}</span>
          <h2 class="mt-8 text-4xl font-semibold tracking-[-0.055em] text-text-primary md:text-6xl">{{ t('sponsors.title') }}</h2>
        </div>
        <div class="reveal reveal-delay-1 border-t border-border">
          <article v-for="(item, i) in confirmed" :key="item.name" class="grid grid-cols-[2.5rem_1fr] border-b border-border py-6 md:grid-cols-[3rem_1fr_auto] md:items-center">
            <span class="font-mono text-xs text-accent">0{{ i + 1 }}</span>
            <h3 class="text-xl font-semibold text-text-primary md:text-2xl">{{ item.name }}</h3>
            <p class="mono-label col-start-2 mt-2 text-text-muted md:col-start-3 md:mt-0">{{ item.role }}</p>
          </article>
          <p class="mono-label mt-6 text-text-muted">{{ t('sponsors.pending') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
