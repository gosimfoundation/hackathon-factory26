<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
const { t, pick } = useI18n()
const openIndex = ref<number | null>(0)
const faqs = computed(() => t('faq.items') as any[])
function toggle(i: number) { openIndex.value = openIndex.value === i ? null : i }
</script>

<template>
  <section id="faq" class="bg-bg-primary py-24 md:py-36">
    <div class="mx-auto grid max-w-[1440px] gap-10 px-6 md:px-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20 xl:px-14">
      <div class="reveal">
        <span class="section-kicker">{{ pick('10 / FAQ', '10 / 常见问题') }}</span>
        <h2 class="section-title mt-8">{{ t('faq.title') }}</h2>
      </div>
      <div class="reveal reveal-delay-1 border-t border-border">
        <article v-for="(faq, i) in faqs" :key="i" class="border-b border-border">
          <button @click="toggle(i)" class="grid w-full grid-cols-[2.5rem_1fr_auto] gap-4 py-6 text-left md:grid-cols-[3rem_1fr_auto]">
            <span class="font-mono text-xs text-accent">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="font-semibold leading-snug tracking-[-0.02em] text-text-primary">{{ faq.q }}</span>
            <span class="text-lg text-text-muted transition-transform duration-200" :class="openIndex === i ? 'rotate-45 text-accent' : ''">＋</span>
          </button>
          <div class="grid transition-[grid-template-rows] duration-300" :class="openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
            <div class="overflow-hidden">
              <p class="max-w-3xl pb-7 pl-[4rem] text-sm leading-relaxed text-text-secondary md:pl-[4rem]">{{ faq.a }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
