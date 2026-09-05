<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '../../composables/useCountdown'
import { useI18n } from '../../composables/useI18n'
import { useAuth } from '../../composables/useAuth'
import { assetUrl } from '../../composables/api'

const { t, pick } = useI18n()
const { isLoggedIn, promptAuth } = useAuth()
const locationLines = computed(() => t('hero.location') as string[])
type HeroPartner = { id: string; name: string; shortName?: string; role: string; logo?: string; url?: string }
const heroPartners = computed(() => t('sponsors.confirmed') as HeroPartner[])
const { days, hours, minutes, seconds, isLive, isOver } = useCountdown(
  '2026-09-07T00:00:00+08:00',
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

function handleRegistrationAccess() {
  if (!isLoggedIn.value) {
    promptAuth('login')
    return
  }
  document.querySelector('#teams')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section class="hero-section relative min-h-[760px] h-[100svh] overflow-hidden bg-[#0b0d0c] text-white">
    <svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true" focusable="false">
      <filter id="hero-cophi-knockout" color-interpolation-filters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1
                  0 0 0 0 1
                  0 0 0 0 1
                 -0.2126 -0.7152 -0.0722 0 1"
        />
      </filter>
    </svg>
    <video autoplay loop muted playsinline preload="auto" :poster="assetUrl('/videos/shenzhen-hero-sz1-poster.jpg')" class="absolute inset-0 h-full w-full object-cover">
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
              <p class="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-[#dca6b9]">
                {{ t('awards.poolLabel') }} · {{ t('awards.poolStatus') }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 md:justify-end">
              <button type="button" @click="handleRegistrationAccess" class="bg-[#c788a1] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#111310] transition-colors hover:bg-white">
                {{ pick('Register / Sign In', '报名/登录') }} <span class="ml-3">↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-start gap-3 pb-4 md:flex-row md:items-center md:gap-x-5 md:gap-y-3" :aria-label="pick('Partners', '合作伙伴')">
        <span class="shrink-0 font-mono text-xs uppercase tracking-[0.1em] text-white/64">
          {{ pick('Partners', '合作伙伴') }}
        </span>
        <div class="grid w-full min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <component
            v-for="partner in heroPartners"
            :key="partner.id"
            :is="partner.url ? 'a' : 'div'"
            :href="partner.url || undefined"
            :target="partner.url ? '_blank' : undefined"
            :rel="partner.url ? 'noopener noreferrer' : undefined"
            :aria-label="partner.name"
            class="hero-partner group flex h-11 min-w-0 items-center justify-center gap-2 px-3 py-2 md:h-12"
          >
            <img
              v-if="partner.logo"
              :src="assetUrl(partner.logo)"
              :alt="partner.name"
              :class="['hero-partner-logo max-h-8 max-w-full object-contain', { 'hero-partner-logo--cophi': partner.id === 'cophi' }]"
            />
            <span v-if="partner.id === 'qiwoo'" class="hero-partner-wordmark text-xs font-semibold leading-tight">{{ partner.name }}</span>
            <span v-else-if="partner.id === 'cophi'" class="hero-partner-wordmark text-xs font-semibold">CoPhi</span>
            <span v-else-if="!partner.logo" class="hero-partner-wordmark text-center text-xs font-semibold leading-tight">{{ partner.shortName || partner.name }}</span>
          </component>
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

.hero-partner {
  background: transparent;
  transition: background-color .2s ease;
}

.hero-partner-logo {
  filter: grayscale(1) brightness(0) invert(1);
  opacity: .82;
  transition: filter .2s ease, opacity .2s ease;
}

.hero-partner-logo--cophi {
  filter: url('#hero-cophi-knockout');
}

.hero-partner-wordmark {
  color: rgba(255, 255, 255, .82);
  transition: color .2s ease;
}

.hero-partner:hover,
.hero-partner:focus-visible {
  background: #fff;
  outline: none;
}

.hero-partner:hover .hero-partner-logo,
.hero-partner:focus-visible .hero-partner-logo {
  filter: none;
  mix-blend-mode: normal;
  opacity: 1;
}

.hero-partner:hover .hero-partner-wordmark,
.hero-partner:focus-visible .hero-partner-wordmark {
  color: #0f172a;
}

@media (max-width: 767px) {
  video { object-position: 58% center; }
}
</style>
