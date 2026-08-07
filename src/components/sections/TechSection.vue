<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const models = computed(() => t('tech.models') as string[])
</script>

<template>
  <section class="bg-bg-secondary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('04 / Open Models', '04 / 开源模型') }}</span>
          <h2 class="section-title mt-8">{{ t('tech.title') }} {{ t('tech.titleAccent') }}</h2>
        </div>
        <p class="reveal reveal-delay-1 max-w-3xl self-end text-base leading-relaxed text-text-secondary md:text-lg">
          {{ t('tech.desc_prefix') }}<strong class="font-semibold text-text-primary">{{ t('tech.desc_bold') }}</strong>{{ t('tech.desc_suffix') }}
        </p>
      </div>

      <div class="reveal mt-16 grid grid-cols-2 border-l border-t border-border md:grid-cols-4">
        <div v-for="(model, i) in models" :key="model" class="border-b border-r border-border p-5 md:p-7">
          <span class="mono-label text-accent">M0{{ i + 1 }}</span>
          <div class="mt-8 text-lg font-semibold tracking-[-0.03em] text-text-primary md:text-2xl">{{ model }}</div>
        </div>
      </div>

      <p class="reveal mt-10 text-lg font-semibold text-text-primary md:text-2xl">{{ t('tech.openArena') }}</p>
    </div>
  </section>
</template>
