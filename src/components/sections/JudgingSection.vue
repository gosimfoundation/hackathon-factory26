<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const criteria = computed(() => t('judging.criteria') as any[])
const fairness = computed(() => t('judging.fairness') as any[])
</script>

<template>
  <section id="judging" class="bg-bg-primary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('09 / Qualifier Judging', '09 / 初赛评审') }}</span>
          <h2 class="section-title mt-8">{{ t('judging.title') }} {{ t('judging.titleAccent') }}</h2>
          <p class="mt-8 max-w-lg leading-relaxed text-text-secondary">{{ t('judging.desc') }}</p>
        </div>

        <div class="reveal reveal-delay-1 border-t border-border">
          <article v-for="(criterion, i) in criteria" :key="criterion.name" class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-border py-6 md:grid-cols-[3rem_.7fr_.35fr_1fr] md:gap-6">
            <span class="font-mono text-xs text-accent">0{{ i + 1 }}</span>
            <h3 class="font-semibold tracking-[-0.025em] text-text-primary">{{ criterion.name }}</h3>
            <span class="mono-label text-text-muted">{{ criterion.method }}</span>
            <p class="col-start-2 text-sm leading-relaxed text-text-secondary md:col-start-4">{{ criterion.desc }}</p>
          </article>
        </div>
      </div>

      <div class="mt-16 grid border-y border-border md:grid-cols-4 md:divide-x md:divide-border">
        <article v-for="(item, i) in fairness" :key="item.title" class="reveal p-6 md:p-7" :class="`reveal-delay-${i + 1}`">
          <span class="font-mono text-xs text-accent">F0{{ i + 1 }}</span>
          <h3 class="mt-7 font-semibold text-text-primary">{{ item.title }}</h3>
          <p class="mt-3 text-xs leading-relaxed text-text-secondary">{{ item.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
