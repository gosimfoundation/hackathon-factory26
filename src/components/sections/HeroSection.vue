<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '../../composables/useCountdown'
import { useI18n } from '../../composables/useI18n'
import { assetUrl } from '../../composables/api'

const { t } = useI18n()
const locationLines = computed(() => t('hero.location') as string[])
const { days, hours, minutes, seconds, isLive, isOver } = useCountdown(
  '2026-09-01T00:00:00+08:00',
  '2026-10-18T00:00:00+08:00',
)

const timeUnits = [
  { key: 'hero.days', value: days },
  { key: 'hero.hours', value: hours },
  { key: 'hero.mins', value: minutes },
  { key: 'hero.secs', value: seconds },
]

type PipelineStep = { label: string; date: string }
const pipeline = computed(() => t('hero.pipeline') as PipelineStep[])
</script>

<template>
  <section class="hero-section relative min-h-[760px] h-[100svh] overflow-hidden bg-[#0b0d0c] text-white">
    <video autoplay loop muted playsinline preload="metadata" :poster="assetUrl('/videos/shenzhen-hero-sz1-poster.jpg')" class="absolute inset-0 h-full w-full object-cover">
      <source :src="assetUrl('/videos/shenzhen-hero-sz1.mp4')" type="video/mp4" />
    </video>
    <div class="hero-color-wash absolute inset-0"></div>
    <div class="absolute inset-0 bg-black/50"></div>

    <div class="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col px-6 md:px-10 xl:px-14">
      <div class="flex flex-1 items-center pt-24 pb-10">
        <div class="w-full max-w-6xl">
          <div class="mb-7 flex items-center gap-4 font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-white/72 md:text-sm">
            <span class="h-2 w-2 bg-[#c788a1]"></span>
            <span>{{ t('hero.eyebrow') }}</span>
          </div>

          <h1 class="max-w-[14ch] text-balance text-[clamp(3rem,6.5vw,6.75rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-white">
            {{ t('hero.system') }}
          </h1>

          <div class="mt-9 grid max-w-5xl gap-8 border-t border-white/35 pt-6 md:grid-cols-[1.15fr_.85fr] md:items-end">
            <div>
              <p class="max-w-2xl text-base font-medium leading-[1.7] text-white/90 md:text-lg">{{ t('hero.eventTitle') }}</p>
              <div class="mt-3 font-mono text-xs uppercase leading-[1.7] tracking-[0.08em] text-white/72 md:text-sm">
                <p v-for="line in locationLines" :key="line" class="mt-1 first:mt-0">{{ line }}</p>
              </div>
              <p class="mt-3 flex max-w-2xl items-start gap-2 text-xs leading-[1.7] text-white/78 md:text-sm">
                <span class="mt-[0.65em] h-1.5 w-1.5 shrink-0 bg-[#c788a1]"></span>
                <span>{{ t('hero.sponsorNotice') }}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 md:justify-end">
              <a href="#teams" class="bg-[#c788a1] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#111310] transition-colors hover:bg-white">
                {{ t('nav.applyNow') }} <span class="ml-3">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="grid border-t border-white/30 pb-6 pt-5 md:grid-cols-[1fr_auto] md:items-end md:gap-8">
        <div class="hidden min-w-0 grid-cols-4 gap-6 md:grid xl:gap-10">
          <div v-for="(step, i) in pipeline" :key="step.label" class="relative min-w-0">
            <span class="block text-sm font-semibold uppercase leading-snug tracking-[0.08em] text-white/88">{{ step.label }}</span>
            <span class="mt-1 block whitespace-nowrap font-mono text-xs leading-snug tracking-[0.04em] text-white/68">{{ step.date }}</span>
            <span v-if="i < pipeline.length - 1" class="absolute -right-4 top-1/2 -translate-y-1/2 text-[#c788a1] xl:-right-6">→</span>
          </div>
        </div>

        <div v-if="isLive" class="mono-label text-[#dca6b9]">{{ t('hero.live') }}</div>
        <div v-else-if="!isOver" class="flex items-end gap-3 md:justify-end">
          <span class="hidden pb-1 pr-2 font-mono text-xs uppercase tracking-[0.1em] text-white/64 lg:block">{{ t('hero.countdownLabel') }}</span>
          <div v-for="unit in timeUnits" :key="unit.key" class="min-w-11 border-l border-white/30 pl-3 md:min-w-14">
            <span class="block font-mono text-xl font-medium tabular-nums text-white md:text-2xl">{{ String(unit.value.value).padStart(2, '0') }}</span>
            <span class="block font-mono text-xs uppercase tracking-[0.08em] text-white/64">{{ t(unit.key) }}</span>
          </div>
        </div>
        <div v-else class="mono-label text-white/60">{{ t('hero.concluded') }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-color-wash {
  background: #4b1f3c;
  mix-blend-mode: color;
  opacity: .82;
}

@media (max-width: 767px) {
  video { object-position: 58% center; }
}
</style>
