import { ref, onMounted } from 'vue'

// ARC-Bench 维护完整排行榜；官网只取 Top N 展示，点进去看全量。
// 端点未定稿前用 VITE_ARCBENCH_API 覆盖，默认走生产站。
const API_BASE = import.meta.env.VITE_ARCBENCH_API || 'http://arc-bench.com'

export const LEADERBOARD_URL = `${API_BASE}/competition`

export interface LeaderboardEntry {
  rank: number
  team: string
  country?: string
  score?: number
}

// 占位数据：ARC-Bench 接口上线前用来撑版面。接口一通就自动被真实数据替换，
// 期间界面上会打「示例数据」角标，避免被当成真实战绩。
const MOCK: LeaderboardEntry[] = [
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

function normalize(raw: any, i: number): LeaderboardEntry {
  return {
    rank: Number(raw.rank ?? i + 1),
    team: String(raw.team ?? raw.team_name ?? raw.name ?? '—'),
    country: raw.country ?? raw.region,
    score: raw.score ?? raw.total_score,
  }
}

export function useLeaderboard(limit = 11) {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(true)
  /** 展示的是占位数据而非 ARC-Bench 实时数据 */
  const isMock = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/api/competition/leaderboard?limit=${limit}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      const rows = Array.isArray(body) ? body : (body.entries ?? body.data ?? [])
      if (!rows.length) throw new Error('empty')
      entries.value = rows.slice(0, limit).map(normalize)
      isMock.value = false
    } catch {
      entries.value = MOCK.slice(0, limit)
      isMock.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { entries, loading, isMock, reload: load, leaderboardUrl: LEADERBOARD_URL }
}
