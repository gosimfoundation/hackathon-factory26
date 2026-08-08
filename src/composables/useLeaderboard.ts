import { ref, onMounted, onUnmounted } from 'vue'

// ARC-Bench 维护完整排行榜；官网只取 Top N 展示，点进去看全量。
// 端点未定稿前用 VITE_ARCBENCH_API 覆盖，默认走生产站。
const API_BASE = import.meta.env.VITE_ARCBENCH_API || 'http://arc-bench.com'

export const LEADERBOARD_URL = `${API_BASE}/competition`

/** 轮询间隔。榜单是比赛期间的看板，一分钟一次够"实时"，也不至于把 ARC-Bench 打爆。 */
const POLL_MS = 60_000

// ⚠️ 预览开关：接口没通的时候，让占位数据每次刷新自己动一动，
// 好让人看清换位动画长什么样。真实接口一通就完全走不到这段逻辑。
// 上线前如果不想让访客看到"假队伍在比赛"，把这里改成 false 即可。
const SIMULATE_WHEN_MOCK = true

export interface LeaderboardEntry {
  rank: number
  team: string
  country?: string
  score?: number
  /** 相对上一次刷新的名次变化：正=上升，负=下降，0=持平，null=首次出现（新进榜或首屏） */
  delta: number | null
}

type Row = Omit<LeaderboardEntry, 'delta'>

// 占位数据：ARC-Bench 接口上线前用来撑版面。接口一通就自动被真实数据替换，
// 期间界面上会打「示例数据」角标，避免被当成真实战绩。
const MOCK: Row[] = [
  { rank: 1, team: 'Harness Foundry', country: 'Singapore', score: 94.2 },
  { rank: 2, team: '需求编译组', country: 'China', score: 91.8 },
  { rank: 3, team: 'Sydney Agents', country: 'Australia', score: 89.5 },
  { rank: 4, team: 'Atelier ARC', country: 'France', score: 87.1 },
  { rank: 5, team: 'Kernel Panic', country: 'United States', score: 85.6 },
  { rank: 6, team: '启程小队', country: 'China', score: 84.0 },
  { rank: 7, team: 'Monsoon Labs', country: 'Singapore', score: 81.3 },
  { rank: 8, team: 'Bitwise Owls', country: 'Australia', score: 79.7 },
  { rank: 9, team: 'Le Compilateur', country: 'France', score: 77.4 },
  { rank: 10, team: 'Redwood Six', country: 'United States', score: 75.2 },
  { rank: 11, team: 'Tokyo Toolsmiths', country: 'Japan', score: 73.9 },
]

function normalize(raw: any, i: number): Row {
  return {
    rank: Number(raw.rank ?? i + 1),
    team: String(raw.team ?? raw.team_name ?? raw.name ?? '—'),
    country: raw.country ?? raw.region,
    score: raw.score ?? raw.total_score,
  }
}

/**
 * 预览用：给每支队伍的分数加一点扰动，按新分数重排后重新编号。
 * 比直接交换名次真实——名次的变化是分数变化的结果，而不是凭空调换。
 */
function simulateRound(rows: Row[]): Row[] {
  return rows
    .map(row => ({ ...row, score: Math.max(0, (row.score ?? 0) + (Math.random() - 0.5) * 3.2) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((row, i) => ({ ...row, rank: i + 1, score: Math.round((row.score ?? 0) * 10) / 10 }))
}

export function useLeaderboard(limit = 11) {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(true)
  /** 刷新进行中（区别于首屏 loading，刷新时表格不清空） */
  const refreshing = ref(false)
  /** 展示的是占位数据而非 ARC-Bench 实时数据 */
  const isMock = ref(false)
  /** 最近一次成功刷新的时刻 */
  const updatedAt = ref<Date | null>(null)

  // 上一轮每支队伍的名次，用来算 delta。按队名索引：名次会变，队名不会。
  let previousRanks = new Map<string, number>()
  let timer: number | undefined

  /** 用上一轮名次给这一轮打上升降标记，然后把这一轮存成下一轮的基准。 */
  function withDeltas(rows: Row[]): LeaderboardEntry[] {
    const first = previousRanks.size === 0
    const next = new Map<string, number>()
    const marked = rows.map(row => {
      const before = previousRanks.get(row.team)
      next.set(row.team, row.rank)
      // 首屏没有基准，一律不标；名次数字变小 = 上升，所以是 before - now。
      return { ...row, delta: first || before === undefined ? null : before - row.rank }
    })
    previousRanks = next
    return marked
  }

  async function load() {
    refreshing.value = true
    try {
      const res = await fetch(`${API_BASE}/api/competition/leaderboard?limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      const rows = Array.isArray(body) ? body : (body.entries ?? body.data ?? [])
      if (!rows.length) throw new Error('empty')
      entries.value = withDeltas(rows.slice(0, limit).map(normalize))
      isMock.value = false
      updatedAt.value = new Date()
    } catch {
      // 接口不可用：退回占位数据。开了预览开关就让它自己动，否则保持静止。
      const base = entries.value.length && isMock.value ? entries.value : MOCK.slice(0, limit)
      const rows = SIMULATE_WHEN_MOCK && entries.value.length && isMock.value
        ? simulateRound(base)
        : MOCK.slice(0, limit)
      entries.value = SIMULATE_WHEN_MOCK ? withDeltas(rows) : rows.map(row => ({ ...row, delta: null }))
      isMock.value = true
      updatedAt.value = new Date()
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  function onVisible() {
    if (document.visibilityState === 'visible') load()
  }

  onMounted(() => {
    load()
    timer = window.setInterval(load, POLL_MS)
    // 切回标签页时立刻补一次，别让用户盯着一屏放了十分钟的旧名次。
    document.addEventListener('visibilitychange', onVisible)
  })

  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { entries, loading, refreshing, isMock, updatedAt, reload: load, leaderboardUrl: LEADERBOARD_URL }
}
