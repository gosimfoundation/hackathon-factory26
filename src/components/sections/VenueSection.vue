<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const stats = computed(() => t('venue.stats') as Array<{ value: string; label: string }>)
</script>

<template>
  <section class="bg-bg-secondary py-24 md:py-32">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <span class="section-kicker reveal">{{ pick('02 / Field', '02 / 赛场') }}</span>
      <div class="mt-8 grid border border-border lg:grid-cols-2">
        <article class="reveal bg-[#131511] p-8 text-[#f1f0e9] md:p-12 lg:p-16">
          <span class="mono-label text-[#dca6b9]">{{ t('venue.label') }}</span>
          <h2 class="mt-8 text-6xl font-semibold tracking-[-0.07em] md:text-8xl">{{ t('venue.title') }}</h2>
          <p class="mt-1 text-3xl font-medium tracking-[-0.04em] text-white/45 md:text-5xl">{{ t('venue.subtitle') }}</p>
          <p class="mt-10 max-w-xl leading-relaxed text-white/65">{{ t('venue.desc') }}</p>
        </article>
        <article class="reveal reveal-delay-1 flex flex-col justify-between border-t border-border p-8 md:p-12 lg:border-l lg:border-t-0 lg:p-16">
          <div>
            <span class="mono-label text-accent">{{ pick('10.16—10.17 / SHENZHEN', '10.16—10.17 / 深圳') }}</span>
            <h3 class="mt-8 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-text-primary md:text-5xl">{{ t('venue.finaleTitle') }}</h3>
          </div>
          <p class="mt-12 max-w-xl leading-relaxed text-text-secondary">{{ t('venue.finaleDesc') }}</p>
        </article>
      </div>
      <div class="grid grid-cols-2 border-x border-b border-border md:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="border-r border-t border-border p-5 last:border-r-0 md:border-t-0 md:p-7">
          <div class="text-2xl font-semibold tracking-[-0.04em] text-text-primary md:text-4xl">{{ stat.value }}</div>
          <div class="mono-label mt-2 text-text-muted">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
