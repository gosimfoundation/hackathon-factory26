<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
</script>

<template>
  <section id="challenge" class="scroll-mt-16 bg-bg-primary py-20 md:py-28">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <span class="section-kicker">{{ pick('01 / Challenge', '01 / 比赛任务') }}</span>
      <div class="mt-8 grid gap-6 border-t border-border pt-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <h2 class="text-3xl font-semibold tracking-[-0.05em] text-text-primary md:text-5xl">{{ t('taskIntro.title') }}</h2>
        <p class="max-w-4xl text-2xl font-medium leading-relaxed tracking-[-0.025em] text-text-secondary md:text-4xl">{{ t('taskIntro.text') }}</p>
      </div>
    </div>
  </section>
</template>
