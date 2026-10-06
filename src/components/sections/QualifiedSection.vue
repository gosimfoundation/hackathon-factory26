<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
import { assetUrl } from '../../composables/api'
const { pick } = useI18n()

// Qualifier result as published by ARC-Bench (ARC-Bench · 黑客松入围名单.pdf), in the PDF's order.
// The PDF also lists each captain's masked email; the page shows team names only.
const qualifiedTeams = [
  'VOLO-AI', 'Orchestro', 'zhx', "Limitless'", 'Shallow', 'haiknow', '尻名山掌管排水渠过弯的神', 'Amazing',
  'bzt', 'wqing0093', 'RyanSanchez', 'gto', 'EldenKing', 'xinyurun', 'Lan_zhijiang', 'windy664',
  'fuxing', 'Blackmoree', 'evenni', 'AIOS', 'HH', 'electronz', 'Abram',
]
const qualifiedPdf = assetUrl('/resources/factory26-qualified-teams.pdf')
</script>

<template>
  <section id="qualified" class="bg-bg-primary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('Qualifier result', '初赛结果') }}</span>
          <h2 class="section-title mt-8">{{ pick('Qualified teams', '初赛入围名单') }}</h2>
          <p class="mt-8 max-w-lg leading-relaxed text-text-secondary">
            {{ pick(`${qualifiedTeams.length} teams have qualified from the qualifier. Listed in no particular order. Thank you to every team for the work and creativity you brought.`, `以下 ${qualifiedTeams.length} 支队伍已在初赛中入围（排名不分先后）。感谢每一支队伍的投入与创造。`) }}
          </p>
          <a :href="qualifiedPdf" target="_blank" rel="noopener" class="mono-label mt-8 inline-block text-accent hover:underline">{{ pick('Official list (PDF) ↗', '官方名单 PDF ↗') }}</a>
        </div>

        <ul class="reveal reveal-delay-1 qualified-grid border-t border-border">
          <li v-for="team in qualifiedTeams" :key="team" class="flex items-baseline gap-4 border-b border-border py-4">
            <span class="shrink-0 text-accent" aria-hidden="true">●</span>
            <span class="min-w-0 break-words text-lg font-semibold tracking-[-0.02em] text-text-primary">{{ team }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.qualified-grid { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 2.5rem; }
@media (min-width: 768px) { .qualified-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
