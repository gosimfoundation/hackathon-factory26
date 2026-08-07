<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const participants = computed(() => t('who.participants') as any[])
</script>

<template>
  <section class="bg-bg-primary py-24 md:py-32">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('05 / Builders', '05 / 建造者') }}</span>
          <h2 class="section-title mt-8">{{ t('who.title') }} {{ t('who.titleAccent') }}</h2>
          <p class="mt-8 max-w-xl text-base leading-relaxed text-text-secondary">{{ t('who.desc_prefix') }}<strong class="text-text-primary">{{ t('who.desc_bold') }}</strong>{{ t('who.desc_suffix') }}</p>
        </div>
        <div class="reveal reveal-delay-1 border-t border-border">
          <article v-for="(p, i) in participants" :key="p.title" class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-border py-5 md:grid-cols-[3rem_.75fr_1.25fr] md:py-6">
            <span class="font-mono text-xs text-accent">0{{ i + 1 }}</span>
            <h3 class="text-base font-semibold tracking-[-0.02em] text-text-primary md:text-lg">{{ p.title }}</h3>
            <p class="col-start-2 text-sm leading-relaxed text-text-secondary md:col-start-3">{{ p.desc }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
