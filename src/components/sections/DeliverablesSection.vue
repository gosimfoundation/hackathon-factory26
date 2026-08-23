<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const items = computed(() => t('deliverables.items') as Array<{ name: string; desc: string }>)
</script>

<template>
  <section class="bg-bg-secondary py-24 md:py-32">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <span class="section-kicker">{{ pick('06 / Deliverables', '06 / 参赛交付物') }}</span>
      <div class="mt-8 grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div>
          <h2 class="section-title">{{ t('deliverables.title') }}</h2>
          <p class="mt-6 max-w-md leading-relaxed text-text-secondary">{{ t('deliverables.intro') }}</p>
        </div>
        <div class="border-t border-border">
          <article v-for="(item, i) in items" :key="item.name" class="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-7 md:grid-cols-[3rem_.8fr_1.2fr]">
            <span class="font-mono text-xs text-accent">0{{ i + 1 }}</span>
            <h3 class="text-xl font-semibold text-text-primary md:text-2xl">{{ item.name }}</h3>
            <p class="col-start-2 leading-relaxed text-text-secondary md:col-start-3">{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
