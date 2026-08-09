<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const prizes = computed(() => t('awards.prizes') as any[])
</script>

<template>
  <section id="awards" class="bg-[#131511] py-24 text-[#f1f0e9] md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker !text-white/45">{{ pick('06 / Awards', '06 / 奖项') }}</span>
          <h2 class="mt-8 text-[clamp(2.75rem,6vw,6rem)] font-semibold leading-none tracking-[-.06em]">{{ t('awards.title') }}</h2>
          <p class="mt-8 max-w-md leading-relaxed text-white/55">{{ t('awards.subtitle') }}</p>
        </div>
        <div class="reveal reveal-delay-1 border-t border-white/25">
          <article v-for="(prize, i) in prizes" :key="prize.name" class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-white/25 py-6 md:grid-cols-[3rem_1fr_auto] md:items-end md:py-8">
            <span class="font-mono text-xs text-[#dca6b9]">0{{ i + 1 }}</span>
            <div>
              <h3 class="text-lg font-medium tracking-[-0.025em] md:text-2xl">{{ prize.name }}</h3>
              <p class="mono-label mt-2 text-white/40">{{ prize.slots }}</p>
            </div>
            <p class="col-start-2 text-4xl font-semibold tracking-[-0.06em] text-[#dca6b9] md:col-start-3 md:text-6xl">{{ prize.amount }}</p>
          </article>
        </div>
      </div>

      <p class="reveal mt-12 border-b border-white/25 pb-5 text-xl font-medium md:text-3xl">{{ t('awards.pool') }}</p>
      <p class="reveal mt-6 max-w-3xl text-sm leading-relaxed text-white/55">
        <span class="mono-label mr-3 text-[#dca6b9]">{{ t('awards.vacancyTitle') }}</span>{{ t('awards.vacancy') }}
      </p>
      <div class="reveal mt-6 grid border-t border-white/25 md:grid-cols-3 md:divide-x md:divide-white/25">
        <div class="py-7 md:px-7 md:first:pl-0"><span class="mono-label text-[#dca6b9]">{{ t('awards.allParticipants') }}</span><p class="mt-3 text-sm leading-relaxed text-white/55">{{ t('awards.certificate') }}</p></div>
        <div class="py-7 md:px-7"><span class="mono-label text-[#dca6b9]">{{ pick('GOSIM Shenzhen', 'GOSIM 深圳') }}</span><p class="mt-3 text-sm leading-relaxed text-white/55">{{ t('awards.gosimSeat') }}</p></div>
        <div class="py-7 md:px-7"><span class="mono-label text-[#dca6b9]">{{ t('awards.apiCredits') }}</span><p class="mt-3 text-sm leading-relaxed text-white/55">{{ t('awards.fromSponsors') }}</p></div>
      </div>
    </div>
  </section>
</template>
