<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'

const { pick } = useI18n()

type Finalist = {
  rank: number
  name: string
  repository?: string
}

// Official final standings from final-with-rank.csv. Repository links are matched by
// rank, team name, and captain email from final-with-github-urls.csv.
const finalists: Finalist[] = [
  { rank: 1, name: 'OpenCollab（zhx）' },
  { rank: 2, name: '我和我们的队友都想去 gosim 参加颁…（VOLO-AI）', repository: 'https://github.com/thunderstone-group/volo-factory-finals' },
  { rank: 3, name: "Limitless'（Limitless'）" },
  { rank: 4, name: 'Orchestro（Orchestro）', repository: 'https://github.com/gaoyu06/arcbench-agent' },
  { rank: 5, name: 'Eto Demerzel（RyanSanchez）' },
  { rank: 6, name: 'haiknow（haiknow）', repository: 'https://github.com/anson-zas/haiknow-arc-hackathon-pub' },
  { rank: 7, name: 'bzt（bzt）', repository: 'https://github.com/qcqcgaga/OAIC2026_final_by_BZT_7th' },
  { rank: 8, name: 'Shallow（Shallow）', repository: 'https://github.com/TheaDust/Shallow' },
  { rank: 9, name: '午夜里，贝奥兰迪驾车登上尻名山，只因范达…（尻名山掌管排水渠过弯的神）', repository: 'https://github.com/inoichi1009207/smoke-agent/' },
  { rank: 10, name: 'gto（gto）', repository: 'https://github.com/Altman-conquer/factory26-hackathon-r17' },
  { rank: 11, name: 'Abram（Abram）', repository: 'https://github.com/Abarm009/Abram' },
  { rank: 12, name: 'fuxing（fuxing）', repository: 'https://github.com/sjok666/arc-bench' },
  { rank: 13, name: 'AIOS（AIOS）', repository: 'https://github.com/amosarc/octos-arc' },
  { rank: 14, name: 'Lan_zhijiang（Lan_zhijiang）', repository: 'https://github.com/xiaoland/gosim-factory26' },
  { rank: 15, name: 'evenni（evenni）' },
  { rank: 16, name: 'Amazing（Amazing）', repository: 'https://github.com/Zzhousx/agentic-software-factory' },
  { rank: 17, name: 'xinyurun（xinyurun）', repository: 'https://github.com/xinyurun215/oaic' },
  { rank: 18, name: 'wqing0093（wqing0093）' },
  { rank: 19, name: 'windy664（windy664）', repository: 'https://github.com/windy664/Torine-hackathon-agent-ts' },
  { rank: 20, name: 'HH（HH）' },
]

function repositoryLabel(repository: string) {
  return repository.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '')
}
</script>

<template>
  <section id="final-results" class="bg-bg-secondary py-24 md:py-36">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('Final result', '决赛结果') }}</span>
          <h2 class="section-title mt-8">{{ pick('Final standings', '决赛成绩排行') }}</h2>
          <p class="mt-8 max-w-lg leading-relaxed text-text-secondary">
            {{ pick(
              'The official final standings for all 20 finalist teams. GitHub repositories are linked where they were supplied by the teams.',
              '20 支决赛队伍的官方成绩排名。队伍已提供的 GitHub 仓库可从榜单直接访问。',
            ) }}
          </p>
        </div>

        <div class="reveal reveal-delay-1">
          <div class="hidden grid-cols-[5rem_minmax(0,1fr)_minmax(15rem,.8fr)] gap-6 border-y border-border py-3 font-mono text-[11px] uppercase tracking-[.14em] text-text-muted md:grid">
            <span>{{ pick('Rank', '排名') }}</span>
            <span>{{ pick('Team', '队伍') }}</span>
            <span>{{ pick('GitHub repository', 'GitHub 仓库') }}</span>
          </div>

          <ol class="border-t border-border md:border-t-0">
            <li
              v-for="team in finalists"
              :key="team.rank"
              class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-border py-5 md:grid-cols-[5rem_minmax(0,1fr)_minmax(15rem,.8fr)] md:items-center md:gap-6 md:py-6"
            >
              <span
                class="font-mono text-sm"
                :class="team.rank <= 3 ? 'font-semibold text-accent' : 'text-text-muted'"
              >
                {{ String(team.rank).padStart(2, '0') }}
              </span>
              <span class="min-w-0 break-words text-base font-semibold tracking-[-0.02em] text-text-primary md:text-lg">
                {{ team.name }}
              </span>
              <a
                v-if="team.repository"
                :href="team.repository"
                target="_blank"
                rel="noopener noreferrer"
                class="col-start-2 inline-flex min-w-0 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent md:col-start-3"
                :aria-label="pick(`Open ${team.name} on GitHub`, `在 GitHub 查看 ${team.name}`)"
              >
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.5 0 12.28c0 5.43 3.44 10.04 8.2 11.67.6.12.82-.27.82-.59 0-.29-.01-1.06-.02-2.08-3.34.74-4.04-1.64-4.04-1.64-.55-1.42-1.34-1.8-1.34-1.8-1.09-.77.09-.75.09-.75 1.2.09 1.84 1.27 1.84 1.27 1.07 1.88 2.81 1.34 3.5 1.02.11-.8.42-1.34.76-1.65-2.67-.31-5.47-1.37-5.47-6.07 0-1.34.47-2.44 1.23-3.3-.12-.31-.53-1.56.12-3.25 0 0 1-.33 3.3 1.26A11.2 11.2 0 0 1 12 5.96c1.02 0 2.04.14 3 .41 2.29-1.59 3.29-1.26 3.29-1.26.66 1.69.25 2.94.12 3.25.77.86 1.23 1.96 1.23 3.3 0 4.72-2.81 5.75-5.48 6.06.43.38.81 1.12.81 2.26 0 1.64-.01 2.96-.01 3.37 0 .33.21.71.82.59A12.27 12.27 0 0 0 24 12.28C24 5.5 18.63 0 12 0Z" />
                </svg>
                <span class="truncate border-b border-border-hover pb-0.5">{{ repositoryLabel(team.repository) }}</span>
                <span aria-hidden="true">↗</span>
              </a>
              <span v-else class="col-start-2 font-mono text-xs uppercase tracking-[.1em] text-text-muted md:col-start-3">
                {{ pick('Not provided', '暂未提供') }}
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>
