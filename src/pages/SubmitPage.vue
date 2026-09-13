<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

// 作品提交已全部移到 ARC-Bench，本站不再收取提交。
const arcBenchUrl = 'https://www.arc-bench.com/competition'
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex flex-col items-center py-28 px-4">
    <div class="w-full max-w-xl">
      <router-link to="/" class="inline-flex text-text-tertiary hover:text-text-primary mb-8">← {{ isEn ? 'Back' : '返回' }}</router-link>
      <h1 class="heading-serif text-4xl text-text-primary mb-2">{{ isEn ? 'Submit Your Work' : '提交作品' }}</h1>
      <p class="text-sm text-text-secondary mb-8">
        {{ isEn ? 'Please submit your work on the competition platform.' : '请参赛选手在比赛平台提交作品。' }}
      </p>

      <div class="panel">
        <a :href="arcBenchUrl" target="_blank" rel="noopener noreferrer" class="cta">
          {{ isEn ? 'Open ARC-Bench' : '前往 ARC-BENCH 提交' }} ↗
        </a>
        <p class="url">{{ arcBenchUrl }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel { padding: 1.5rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.cta { display: block; width: 100%; padding: .85rem 1rem; background: var(--color-btn-bg); color: var(--color-btn-text); font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; text-align: center; text-decoration: none; transition: background-color .2s ease; }
.cta:hover { background: var(--color-btn-hover); }
.url { margin-top: .8rem; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .74rem; color: var(--color-text-muted); text-align: center; word-break: break-all; }
</style>
