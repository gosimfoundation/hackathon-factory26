<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
import { useLeaderboard } from '../../composables/useLeaderboard'

const { t, pick } = useI18n()
const { entries: board, loading: boardLoading, isMock, leaderboardUrl } = useLeaderboard(11)
</script>

<template>
  <section id="themes" class="bg-bg-primary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div class="reveal lg:sticky lg:top-28 lg:self-start">
          <span class="section-kicker">{{ pick('03 / Platform', '03 / 比赛平台') }}</span>
          <h2 class="section-title mt-8">{{ t('tracks.title') }}</h2>
          <p class="mt-8 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{{ t('tracks.intro') }}</p>
          <p class="mt-6 max-w-xl text-sm leading-relaxed text-text-secondary">
            {{ t('tracks.detailsNote') }}
            <a href="http://arc-bench.com" target="_blank" rel="noopener" class="border-b border-accent font-semibold text-text-primary transition-colors hover:text-accent">arc-bench.com ↗</a>
          </p>
        </div>

        <!-- 实时排行榜 · Top 11：与晋级现场的名额一致（全量榜单由 ARC-Bench 维护） -->
        <div class="reveal reveal-delay-1">
          <div class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
            <h3 class="text-xl font-semibold tracking-[-0.03em] text-text-primary md:text-2xl">
              {{ t('tracks.boardTitle') }}
              <span v-if="isMock" class="ml-3 border border-border px-2 py-0.5 align-middle font-mono text-xs uppercase tracking-[0.1em] text-text-muted">{{ t('tracks.boardMock') }}</span>
            </h3>
            <a :href="leaderboardUrl" target="_blank" rel="noopener" class="border-b border-text-muted pb-0.5 font-mono text-xs uppercase tracking-[0.1em] text-text-muted transition-colors hover:border-accent hover:text-accent">
              {{ t('tracks.boardFull') }} ↗
            </a>
          </div>

          <p v-if="boardLoading" class="mono-label mt-6 text-text-muted">{{ t('tracks.boardLoading') }}</p>

          <table v-else class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-border">
                <th class="mono-label w-12 py-3 text-text-muted">#</th>
                <th class="mono-label py-3 text-text-muted">{{ t('tracks.boardTeam') }}</th>
                <th class="mono-label py-3 text-text-muted">{{ t('tracks.boardCountry') }}</th>
                <th class="mono-label py-3 text-right text-text-muted">{{ t('tracks.boardScore') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in board" :key="row.rank" class="border-b border-border-subtle">
                <td class="py-3.5 font-mono text-xs" :class="row.rank <= 3 ? 'text-accent' : 'text-text-muted'">{{ String(row.rank).padStart(2, '0') }}</td>
                <td class="py-3.5 pr-4 text-sm font-medium text-text-primary md:text-base">{{ row.team }}</td>
                <td class="py-3.5 text-xs text-text-secondary md:text-sm">{{ row.country || '—' }}</td>
                <td class="py-3.5 text-right font-mono text-sm text-text-primary">{{ row.score != null ? row.score.toFixed(1) : '—' }}</td>
              </tr>
            </tbody>
          </table>

          <p class="mt-5 text-sm leading-relaxed text-text-secondary">
            {{ t('tracks.leaderboardNote') }}
            <a :href="leaderboardUrl" target="_blank" rel="noopener" class="border-b border-accent font-semibold text-text-primary transition-colors hover:text-accent">arc-bench.com/competition ↗</a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
