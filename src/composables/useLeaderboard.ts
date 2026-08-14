import { ref, onMounted, onUnmounted } from 'vue'

// ARC-Bench 目前只提供 HTTP 接口。生产官网是 HTTPS，因此通过 Supabase
// Edge Function 代理请求，避免浏览器的 mixed-content 和 CORS 限制。
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const EDGE_LEADERBOARD_API = import.meta.env.VITE_ARCBENCH_LEADERBOARD_PROXY
  || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/arcbench-leaderboard` : '')
const STATIC_LEADERBOARD_API = `${import.meta.env.BASE_URL}arcbench-leaderboard.json`
const LEADERBOARD_APIS = [EDGE_LEADERBOARD_API, STATIC_LEADERBOARD_API].filter(Boolean)

export const LEADERBOARD_URL = 'http://arc-bench.com/competition'

/** 比赛期间每分钟刷新一次。 */
const POLL_MS = 60_000

export interface LeaderboardEntry {
  rank: number
  username: string
  modelName: string
  avgPassRate: number | null
  totalTokenMillions: number | null
  avgRuntimeSeconds: number | null
  submissionCount: number
  /** 相对上一次刷新的名次变化：正=上升，负=下降，0=持平，null=首次出现。 */
  delta: number | null
}

type Row = Omit<LeaderboardEntry, 'delta'>

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalize(raw: Record<string, unknown>, index: number): Row {
  return {
    // ARC-Bench 按排名顺序返回数组，目前 payload 没有单独的 rank 字段。
    rank: Number(raw.rank ?? index + 1),
    username: String(raw.username ?? '—'),
    modelName: String(raw.model_name ?? '—'),
    avgPassRate: numberOrNull(raw.avg_pass_rate),
    totalTokenMillions: numberOrNull(raw.total_token_millions),
    avgRuntimeSeconds: numberOrNull(raw.avg_runtime_seconds),
    submissionCount: Number(raw.submission_count ?? 0),
  }
}

export function useLeaderboard(limit = 20) {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(true)
  const refreshing = ref(false)
  const error = ref('')
  const updatedAt = ref<Date | null>(null)

  let previousRanks = new Map<string, number>()
  let timer: number | undefined

  function rowKey(row: Row): string {
    return `${row.username}:${row.modelName}`
  }

  function withDeltas(rows: Row[]): LeaderboardEntry[] {
    const first = previousRanks.size === 0
    const next = new Map<string, number>()
    const marked = rows.map(row => {
      const key = rowKey(row)
      const before = previousRanks.get(key)
      next.set(key, row.rank)
      return { ...row, delta: first || before === undefined ? null : before - row.rank }
    })
    previousRanks = next
    return marked
  }

  async function load() {
    refreshing.value = true
    error.value = ''
    try {
      let loaded = false
      for (const endpoint of LEADERBOARD_APIS) {
        try {
          const url = new URL(endpoint, window.location.origin)
          url.searchParams.set('limit', String(limit))
          const res = await fetch(url, { headers: { Accept: 'application/json' } })
          if (!res.ok) throw new Error(String(res.status))
          const body = await res.json()
          const rows = Array.isArray(body) ? body : (body.entries ?? body.data ?? [])
          entries.value = withDeltas(rows.slice(0, limit).map(normalize))
          updatedAt.value = new Date()
          loaded = true
          break
        } catch {
          // Edge Function 尚未部署或暂时不可用时，继续读取同域构建快照。
        }
      }
      if (!loaded) throw new Error('Leaderboard is unavailable')
    } catch {
      // 保留上一次成功获取的数据，避免短暂网络故障让榜单瞬间清空。
      error.value = 'unavailable'
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
    document.addEventListener('visibilitychange', onVisible)
  })

  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { entries, loading, refreshing, error, updatedAt, reload: load, leaderboardUrl: LEADERBOARD_URL }
}
