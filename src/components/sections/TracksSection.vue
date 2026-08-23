<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useLeaderboard } from '../../composables/useLeaderboard'

const { t, pick } = useI18n()
const { entries: board, loading: boardLoading, refreshing, error: boardError, updatedAt, reload, leaderboardUrl } = useLeaderboard(20)

const updatedLabel = computed(() => {
  if (!updatedAt.value) return ''
  return updatedAt.value.toLocaleTimeString(pick('en-US', 'zh-CN'), { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

function formatRuntime(seconds: number | null): string {
  if (seconds == null) return '—'
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const remainder = rounded % 60
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`
}

function formatTokens(millions: number | null): string {
  return millions == null ? '—' : `${millions.toFixed(2)}M`
}
</script>

<template>
  <section id="themes" class="bg-bg-primary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div class="reveal lg:sticky lg:top-28 lg:self-start">
          <span class="section-kicker">{{ pick('07 / Leaderboard', '07 / 排行榜') }}</span>
          <h2 class="section-title mt-8">{{ t('tracks.title') }}</h2>
          <p class="mt-8 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{{ t('tracks.intro') }}</p>
          <p class="mt-6 max-w-xl text-sm leading-relaxed text-text-secondary">
            {{ t('tracks.detailsNote') }}
            <a href="http://arc-bench.com" target="_blank" rel="noopener" class="border-b border-accent font-semibold text-text-primary transition-colors hover:text-accent">arc-bench.com ↗</a>
          </p>
        </div>

        <!-- 实时排行榜 · Top 20：与进决赛的名额一致（全量榜单由 ARC-Bench 维护） -->
        <div class="reveal reveal-delay-1">
          <div class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
            <h3 class="flex items-center text-xl font-semibold tracking-[-0.03em] text-text-primary md:text-2xl">
              <span v-if="board.length && !boardError && !boardLoading" class="live-dot" aria-hidden="true"></span>
              {{ t('tracks.boardTitle') }}
            </h3>
            <div class="flex items-center gap-4">
              <button
                type="button"
                @click="reload"
                :disabled="refreshing"
                class="board-refresh font-mono text-xs uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-accent disabled:cursor-not-allowed"
              >
                <span class="board-refresh__icon" :class="{ 'is-spinning': refreshing }" aria-hidden="true">↻</span>
                {{ t('tracks.boardRefresh') }}
              </button>
              <a :href="leaderboardUrl" target="_blank" rel="noopener" class="border-b border-text-muted pb-0.5 font-mono text-xs uppercase tracking-[0.1em] text-text-muted transition-colors hover:border-accent hover:text-accent">
                {{ t('tracks.boardFull') }} ↗
              </a>
            </div>
          </div>

          <p v-if="updatedLabel && !boardLoading" class="mono-label mt-3 text-text-muted">
            {{ t('tracks.boardUpdated') }} {{ updatedLabel }}
          </p>

          <p v-if="boardLoading" class="mono-label mt-6 text-text-muted">{{ t('tracks.boardLoading') }}</p>

          <p v-else-if="boardError && !board.length" class="mt-6 text-sm leading-relaxed text-text-secondary">
            {{ t('tracks.boardUnavailable') }}
          </p>

          <p v-else-if="!board.length" class="mt-6 text-sm leading-relaxed text-text-secondary">{{ t('tracks.boardEmpty') }}</p>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr class="border-b border-border">
                  <th class="mono-label w-12 py-3 text-text-muted">#</th>
                  <th class="mono-label py-3 text-text-muted">{{ t('tracks.boardUser') }}</th>
                  <th class="mono-label py-3 text-text-muted">{{ t('tracks.boardModel') }}</th>
                  <th class="mono-label py-3 text-right text-text-muted">{{ t('tracks.boardPassRate') }}</th>
                  <th class="mono-label py-3 text-right text-text-muted">{{ t('tracks.boardTokens') }}</th>
                  <th class="mono-label py-3 text-right text-text-muted">{{ t('tracks.boardRuntime') }}</th>
                  <th class="mono-label py-3 text-right text-text-muted">{{ t('tracks.boardSubmissions') }}</th>
                </tr>
              </thead>
              <TransitionGroup tag="tbody" name="board">
                <tr
                  v-for="(row, i) in board"
                  :key="`${row.username}:${row.modelName}`"
                  class="board-row border-b border-border-subtle"
                  :class="{ 'board-row--moved': row.delta !== null && row.delta !== 0 }"
                  :style="{ '--row-index': i }"
                >
                  <td class="py-2.5 font-mono text-[11px]" :class="row.rank <= 3 ? 'text-accent' : 'text-text-muted'">{{ String(row.rank).padStart(2, '0') }}</td>
                  <td class="py-2.5 pr-4 text-[13px] font-medium text-text-primary md:text-sm">
                    <span class="board-delta" :class="row.delta && row.delta > 0 ? 'is-up' : row.delta && row.delta < 0 ? 'is-down' : ''">
                      <template v-if="row.delta && row.delta !== 0">{{ row.delta > 0 ? '▲' : '▼' }}{{ Math.abs(row.delta) }}</template>
                    </span>
                    {{ row.username }}
                  </td>
                  <td class="py-2.5 text-[11px] text-text-secondary md:text-xs">{{ row.modelName }}</td>
                  <td class="py-2.5 text-right font-mono text-[13px] text-text-primary">{{ row.avgPassRate != null ? row.avgPassRate.toFixed(1) : '—' }}</td>
                  <td class="py-2.5 text-right font-mono text-[13px] text-text-secondary">{{ formatTokens(row.totalTokenMillions) }}</td>
                  <td class="py-2.5 text-right font-mono text-[13px] text-text-secondary">{{ formatRuntime(row.avgRuntimeSeconds) }}</td>
                  <td class="py-2.5 text-right font-mono text-[13px] text-text-secondary">{{ row.submissionCount }}</td>
                </tr>
              </TransitionGroup>
            </table>
          </div>

          <p class="mt-5 text-sm leading-relaxed text-text-secondary">
            {{ t('tracks.leaderboardNote') }}
            <a :href="leaderboardUrl" target="_blank" rel="noopener" class="border-b border-accent font-semibold text-text-primary transition-colors hover:text-accent">arc-bench.com/competition ↗</a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 「live」灯:一个呼吸的点 + 一圈扩散的环。整站唯一一处持续动画,只给真实时数据用。 */
.live-dot {
  position: relative;
  width: .5rem;
  height: .5rem;
  margin-right: .6rem;
  flex: none;
  border-radius: 9999px;
  background: var(--color-accent);
  animation: live-breathe 2.4s ease-in-out infinite;
}
.live-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1px solid var(--color-accent);
  animation: live-ring 2.4s ease-out infinite;
}
@keyframes live-breathe {
  0%, 100% { opacity: 1; }
  50%      { opacity: .45; }
}
@keyframes live-ring {
  0%   { transform: scale(1);   opacity: .7; }
  70%  { transform: scale(2.8); opacity: 0; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* 换位动画:名次一变,行真的滑过彼此,而不是数字被悄悄改掉。
   TransitionGroup 会自动做 FLIP,这里只负责给它一条够慢、能看清的曲线。 */
.board-move {
  transition: transform .75s cubic-bezier(.2, .7, .2, 1);
}
.board-enter-active {
  transition: opacity .5s ease, transform .5s ease;
  /* 首屏逐行落位,像成绩一条条打出来 */
  transition-delay: calc(var(--row-index, 0) * 45ms);
}
.board-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.board-leave-active {
  transition: opacity .35s ease;
}
.board-leave-to {
  opacity: 0;
}

/* 刚换过位的行短暂泛一下强调色,让「谁动了」在一屏里抓得住。 */
.board-row--moved {
  animation: row-settle 1.6s ease-out;
}
@keyframes row-settle {
  0%   { background-color: color-mix(in srgb, var(--color-accent) 14%, transparent); }
  100% { background-color: transparent; }
}

/* 升降标记:数字左边一个窄槽位,不占也不跳。 */
.board-delta {
  display: inline-block;
  min-width: 2.4rem;
  margin-right: .5rem;
  font-size: .7rem;
  letter-spacing: .02em;
  color: var(--color-text-muted);
  text-align: right;
}
.board-delta.is-up   { color: var(--color-accent); }
.board-delta.is-down { color: var(--color-text-muted); opacity: .75; }

/* 手动刷新:图标转一圈,让"我按了、它在动"这件事有回应。 */
.board-refresh__icon {
  display: inline-block;
  margin-right: .35rem;
}
.board-refresh__icon.is-spinning {
  animation: refresh-spin .8s linear infinite;
}
.board-refresh:disabled {
  opacity: .5;
}
@keyframes refresh-spin {
  to { transform: rotate(360deg); }
}

/* 有人把系统动画关了,就一概别动——这些效果是锦上添花,不是信息本身。 */
@media (prefers-reduced-motion: reduce) {
  .live-dot,
  .live-dot::after,
  .board-row--moved,
  .board-refresh__icon.is-spinning {
    animation: none;
  }
  .board-move,
  .board-enter-active,
  .board-leave-active {
    transition: none;
  }
}
</style>
