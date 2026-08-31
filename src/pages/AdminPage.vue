<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useI18n } from '../composables/useI18n'
import { assetUrl, publicSiteUrl } from '../composables/api'

const { pick, roleLabel, trackLabel } = useI18n()

function userAvatar(p: any): string {
  if (p.avatar) return p.avatar
  if (p.github_id) return `https://avatars.githubusercontent.com/${p.github_id.replace(/^@/, '')}`
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || '?')}&background=333&color=fff&size=64`
}

const authed = ref(sessionStorage.getItem('admin_authed') === '1')
const passInput = ref('')
const passError = ref('')

async function sha256hex(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function tryAuth() {
  passError.value = ''
  const inputHash = await sha256hex(passInput.value)
  const { data } = await supabase.from('admin_config').select('value').eq('key', 'admin_pass_hash').single()
  if (data && data.value === inputHash) {
    sessionStorage.setItem('admin_authed', '1')
    authed.value = true
    loadData(); loadAnnouncement(); loadSubmissions(); loadCodes()
  } else {
    passError.value = pick('Wrong password', '密码错误')
  }
}

// Data
const profiles = ref<any[]>([])
const teams = ref<any[]>([])
const loading = ref(false)
const tab = ref<'users' | 'teams'>('users')
const search = ref('')

const hoveredDay = ref(-1)

// Edit modal
const editingUser = ref<any>(null)
const editFields = ref({ name: '', email: '', wechat: '', role: '', bio: '', github_id: '', country: '', city: '', organization: '', age_range: '', referral_source: '', discord: '', twitter: '', telegram: '', admin_notes: '' })

// QR modal
const qrUser = ref<any>(null)
const qrDataUrl = ref('')

async function showQr(user: any) {
  qrUser.value = user
  qrDataUrl.value = await QRCode.toDataURL(publicSiteUrl(`/profile/${user.id}`), {
    width: 280, margin: 1, color: { dark: '#000000', light: '#ffffff' },
  })
}

// Team view modal
const viewingTeam = ref<any>(null)

// Announcements
const announcementText = ref('')
const announcementSaving = ref(false)
const announcementHistory = ref<any[]>([])
async function loadAnnouncement() {
  const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20)
  announcementHistory.value = data || []
  const active = (data || []).find((a: any) => a.active)
  announcementText.value = active?.content || ''
}
async function pushAnnouncement() {
  const content = announcementText.value.trim()
  if (!content) return
  announcementSaving.value = true
  await supabase.from('announcements').update({ active: false }).eq('active', true)
  await supabase.from('announcements').insert({ content, active: true })
  announcementSaving.value = false
  await loadAnnouncement()
}
async function clearAnnouncement() {
  await supabase.from('announcements').update({ active: false }).eq('active', true)
  announcementText.value = ''
  await loadAnnouncement()
}
async function reactivateAnnouncement(id: string) {
  await supabase.from('announcements').update({ active: false }).eq('active', true)
  await supabase.from('announcements').update({ active: true }).eq('id', id)
  await loadAnnouncement()
}

// Submissions
const submissions = ref<any[]>([])
async function loadSubmissions() {
  const { data } = await supabase.from('submissions').select('*')
  submissions.value = data || []
}

// Passwords are stored as hashes in admin_config table — no hardcoded values
const passwords = {
  admin: pick('(see admin_config table)', '（请查看 admin_config 表）'),
  export: pick('(see admin_config table)', '（请查看 admin_config 表）'),
  checkin: pick('(see admin_config table)', '（请查看 admin_config 表）'),
}

function codeStatusLabel(status: string): string {
  const labels: Record<string, string> = { available: '可用', assigned: '已分配', used: '已使用' }
  return pick(status, labels[status] || status)
}

async function loadData() {
  loading.value = true
  const [{ data: p }, { data: t }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('teams').select('*').order('created_at', { ascending: false }),
  ])
  profiles.value = p || []
  teams.value = t || []
  loading.value = false
}

// Stats
const totalUsers = computed(() => profiles.value.length)
const totalTeams = computed(() => teams.value.length)
const checkedIn = computed(() => profiles.value.filter(p => p.checked_in).length)
const approved = computed(() => profiles.value.filter(p => p.approved).length)
const confirmedYes = computed(() => profiles.value.filter(p => p.confirmed_attendance === 'yes').length)
const confirmedNo = computed(() => profiles.value.filter(p => p.confirmed_attendance === 'no').length)
const confirmedPending = computed(() => profiles.value.filter(p => !p.confirmed_attendance).length)
const noTeam = computed(() => profiles.value.filter(p => !p.team_id).length)
const inTeam = computed(() => profiles.value.filter(p => p.team_id).length)
const lookingForTeam = computed(() => profiles.value.filter(p => p.looking_for_team && !p.team_id).length)
const fullTeams = computed(() => teams.value.filter(t => {
  const members = profiles.value.filter(p => p.team_id === t.id).length
  return t.max_size != null && members >= t.max_size
}).length)
const openTeams = computed(() => totalTeams.value - fullTeams.value)
const modelStats = computed(() => {
  const stats: Record<string, number> = {}
  teams.value.forEach(t => { if (t.model) stats[t.model] = (stats[t.model] || 0) + 1 })
  return stats
})
const roleStats = computed(() => {
  const stats: Record<string, number> = {}
  profiles.value.forEach(p => { const r = p.role || 'Unset'; stats[r] = (stats[r] || 0) + 1 })
  return Object.entries(stats).sort((a, b) => b[1] - a[1])
})
const recentSignups = computed(() => {
  const now = Date.now()
  return profiles.value.filter(p => now - new Date(p.created_at).getTime() < 24 * 60 * 60 * 1000).length
})

// Field completion rates
const fieldRates = computed(() => {
  const total = profiles.value.length || 1
  const fields = [
    { label: pick('Email', '邮箱'), key: 'email' },
    { label: pick('WeChat', '微信'), key: 'wechat' },
    { label: pick('Role', '角色'), key: 'role' },
    { label: pick('Country', '国家'), key: 'country' },
    { label: pick('City', '城市'), key: 'city' },
    { label: pick('Organization', '单位'), key: 'organization' },
    { label: pick('Age', '年龄段'), key: 'age_range' },
    { label: 'GitHub', key: 'github_id' },
    { label: pick('Bio', '个人简介'), key: 'bio' },
    { label: 'Discord', key: 'discord' },
    { label: 'Twitter', key: 'twitter' },
    { label: 'Telegram', key: 'telegram' },
    { label: 'LinkedIn', key: 'linkedin' },
  ]
  return fields.map(f => ({
    label: f.label,
    count: profiles.value.filter(p => p[f.key] && p[f.key].trim()).length,
    pct: Math.round(profiles.value.filter(p => p[f.key] && p[f.key].trim()).length / total * 100),
  }))
})

// Daily signups for chart (last 30 days)
const dailySignups = computed(() => {
  const days: Record<string, number> = {}
  profiles.value.forEach(p => {
    const d = (p.created_at || '').slice(0, 10)
    if (d) days[d] = (days[d] || 0) + 1
  })
  const sorted = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]))
  // Cumulative
  let cum = 0
  return sorted.map(([date, count]) => ({ date, count, cumulative: cum += count }))
})

// Chart dimensions: each day gets 50px width, min 400px
const chartPad = 20
const chartH = 180
const chartWidth = computed(() => Math.max(600, dailySignups.value.length * 80 + chartPad * 2))

const chartPoints = computed(() => {
  const data = dailySignups.value
  if (data.length < 2) return ''
  const maxCum = data[data.length - 1].cumulative
  const w = chartWidth.value
  return data.map((d, i) => {
    const x = chartPad + (i / (data.length - 1)) * (w - chartPad * 2)
    const y = chartH - chartPad - (d.cumulative / maxCum) * (chartH - chartPad * 2)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
})
const chartBarData = computed(() => {
  const data = dailySignups.value
  if (!data.length) return []
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const w = chartWidth.value
  const barW = Math.max(8, (w - chartPad * 2) / data.length * 0.7)
  return data.map((d, i) => ({
    x: chartPad + (i / Math.max(data.length - 1, 1)) * (w - chartPad * 2) - barW / 2,
    height: (d.count / maxCount) * (chartH - chartPad * 2 - 20),
    y: chartH - chartPad - 16 - (d.count / maxCount) * (chartH - chartPad * 2 - 20),
    barW,
    date: d.date.slice(5),
    count: d.count,
  }))
})

// Filtered users
const filteredUsers = computed(() => {
  if (!search.value.trim()) return profiles.value
  const q = search.value.toLowerCase()
  return profiles.value.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.email || '').toLowerCase().includes(q) ||
    (p.wechat || '').toLowerCase().includes(q) ||
    (p.country || '').toLowerCase().includes(q) ||
    (p.city || '').toLowerCase().includes(q) ||
    (p.organization || '').toLowerCase().includes(q) ||
    (p.referral_source || '').toLowerCase().includes(q)
  )
})

function getTeamName(teamId: string | null) {
  if (!teamId) return '—'
  return teams.value.find(t => t.id === teamId)?.name || '—'
}

function getTeamMembers(teamId: string) {
  return profiles.value.filter(p => p.team_id === teamId)
}

function getLeaderName(teamId: string) {
  const team = teams.value.find(t => t.id === teamId)
  if (!team) return '—'
  const leader = profiles.value.find(p => p.id === team.leader_id)
  return leader?.name || '—'
}

// Actions
async function toggleCheckIn(user: any) {
  const newVal = !user.checked_in
  await supabase.from('profiles').update({ checked_in: newVal }).eq('id', user.id)
  user.checked_in = newVal
}

async function toggleApproved(user: any) {
  const newVal = !user.approved
  await supabase.from('profiles').update({ approved: newVal }).eq('id', user.id)
  user.approved = newVal
}

const showExportMenu = ref(false)

function downloadBackup(format: string) {
  showExportMenu.value = false
  const date = new Date().toISOString().slice(0, 10)
  if (format === 'json') {
    const data = { profiles: profiles.value, teams: teams.value, exported_at: new Date().toISOString() }
    downloadFile(JSON.stringify(data, null, 2), `hackathon-backup-${date}.json`, 'application/json')
  } else if (format === 'csv') {
    const teamMap = Object.fromEntries(teams.value.map((t: any) => [t.id, t]))
    const header = ['Name','Email','WeChat','Role','GitHub','Country','City','Organization / School','Age Range','Where do you hear from us?','Team','Model','Discord','Telegram','Checked In','Approved','Registered']
    const rows = profiles.value.map((p: any) => {
      const t = teamMap[p.team_id] || {}
      return [p.name, p.email||'', p.wechat||'', p.role||'', p.github_id||'', p.country||'', p.city||'', p.organization||'', p.age_range||'', p.referral_source||'', t.name||'', t.model||'', p.discord||'', p.telegram||'', p.checked_in?'Yes':'No', p.approved?'Yes':'No', (p.created_at||'').slice(0,10)]
    })
    const csv = [header, ...rows].map(r => r.map((c: string) => `"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    downloadFile(csv, `hackathon-roster-${date}.csv`, 'text/csv')
  } else if (format === 'pdf') {
    exportPDF(date)
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(date: string) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('Hackathon — Participant Roster', 14, 15)
  doc.setFontSize(9)
  doc.setTextColor(128)
  doc.text(`${profiles.value.length} participants · ${teams.value.length} teams · Exported ${date}`, 14, 22)

  const teamMap = Object.fromEntries(teams.value.map((t: any) => [t.id, t]))
  const head = [['#', 'Name', 'Email', 'WeChat', 'Role', 'GitHub', 'Country', 'City', 'Organization', 'Age', 'Team', 'Model', 'Checked In', 'Approved', 'Registered']]
  const body = profiles.value.map((p: any, i: number) => {
    const t = teamMap[p.team_id] || {}
    return [i+1, p.name||'', p.email||'—', p.wechat||'—', p.role||'—', p.github_id||'—', p.country||'—', p.city||'—', p.organization||'—', p.age_range||'—', t.name||'—', t.model||'—', p.checked_in?'Yes':'No', p.approved?'Yes':'No', (p.created_at||'').slice(0,10)]
  })
  autoTable(doc, { head, body, startY: 28, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [26, 26, 46] } })
  doc.save(`hackathon-roster-${date}.pdf`)
}

function openEdit(user: any) {
  editingUser.value = user
  editFields.value = {
    name: user.name || '',
    email: user.email || '',
    wechat: user.wechat || '',
    role: user.role || '',
    bio: user.bio || '',
    github_id: user.github_id || '',
    country: user.country || '',
    city: user.city || '',
    organization: user.organization || '',
    age_range: user.age_range || '',
    referral_source: user.referral_source || '',
    discord: user.discord || '',
    twitter: user.twitter || '',
    telegram: user.telegram || '',
    admin_notes: user.admin_notes || '',
  }
}

async function saveEdit() {
  if (!editingUser.value) return
  await supabase.from('profiles').update(editFields.value).eq('id', editingUser.value.id)
  Object.assign(editingUser.value, editFields.value)
  editingUser.value = null
}

// Redeem codes
const redeemCodes = ref<any[]>([])
const importModel = ref('MiniMax')
const importText = ref('')

async function loadCodes() {
  const { data, error } = await supabase.from('redeem_codes').select('*').order('created_at')
  if (error) console.error('[loadCodes]', error)
  redeemCodes.value = data || []
  console.log('[loadCodes]', redeemCodes.value.length, 'codes loaded')
}

const codeStats = computed(() => {
  const s: Record<string, { total: number; available: number; assigned: number; used: number }> = {}
  for (const c of redeemCodes.value) {
    if (!s[c.model]) s[c.model] = { total: 0, available: 0, assigned: 0, used: 0 }
    s[c.model].total++
    s[c.model][c.status as 'available' | 'assigned' | 'used']++
  }
  return s
})

async function importCodes() {
  const codes = importText.value.split('\n').map((c: string) => c.trim()).filter(Boolean)
  if (!codes.length) return
  const rows = codes.map(code => ({ code, model: importModel.value }))
  await supabase.from('redeem_codes').insert(rows)
  importText.value = ''
  await loadCodes()
}

async function autoAssignCodes() {
  const checkedInUsers = profiles.value.filter((p: any) => p.checked_in && p.team_id)
  for (const p of checkedInUsers) {
    const team = teams.value.find((t: any) => t.id === p.team_id)
    if (!team || !['Kimi', 'GLM', 'MiniMax', 'DeepSeek'].includes(team.model)) continue
    const alreadyHas = redeemCodes.value.find((c: any) => c.assigned_to === p.id && c.status === 'assigned')
    if (alreadyHas) continue
    const available = redeemCodes.value.find((c: any) => c.model === team.model && c.status === 'available')
    if (!available) continue
    await supabase.from('redeem_codes').update({ status: 'assigned', assigned_to: p.id, assigned_at: new Date().toISOString() }).eq('id', available.id)
  }
  await loadCodes()
}

async function manualAssign(userId: string, model: string) {
  const available = redeemCodes.value.find((c: any) => c.model === model && c.status === 'available')
  if (!available) { alert(pick('No available codes for ', '没有可用兑换码：') + model); return }
  await supabase.from('redeem_codes').update({ status: 'assigned', assigned_to: userId, assigned_at: new Date().toISOString() }).eq('id', available.id)
  await loadCodes()
}

async function replaceCode(userId: string, oldCodeId: string, model: string) {
  await supabase.from('redeem_codes').update({ status: 'used', assigned_to: null, assigned_at: null }).eq('id', oldCodeId)
  const available = redeemCodes.value.find((c: any) => c.model === model && c.status === 'available')
  if (!available) { alert(pick('No available codes for ', '没有可用兑换码：') + model); await loadCodes(); return }
  await supabase.from('redeem_codes').update({ status: 'assigned', assigned_to: userId, assigned_at: new Date().toISOString() }).eq('id', available.id)
  await loadCodes()
}

function getUserCode(userId: string) {
  return redeemCodes.value.find((c: any) => c.assigned_to === userId && c.status === 'assigned')
}

// kickUser removed — use Supabase Dashboard for deletions

async function dissolveTeam(team: any) {
  if (!confirm(pick(`Dissolve team "${team.name}"? Members will become teamless.`, `确定解散队伍“${team.name}”吗？所有成员将变为无队伍状态。`))) return
  // Clear team_id for all members
  const members = profiles.value.filter(p => p.team_id === team.id)
  for (const m of members) {
    await supabase.from('profiles').update({ team_id: null }).eq('id', m.id)
    m.team_id = null
  }
  await supabase.from('teams').delete().eq('id', team.id)
  teams.value = teams.value.filter(t => t.id !== team.id)
}

onMounted(() => { if (authed.value) { loadData(); loadAnnouncement(); loadSubmissions(); loadCodes() } })
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-200 pt-20 pb-16">
    <!-- Auth gate -->
    <div v-if="!authed" class="max-w-sm mx-auto px-6 pt-20">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">{{ pick('Admin Access', '管理员入口') }}</h1>
      <form @submit.prevent="tryAuth" class="space-y-4">
        <input v-model="passInput" type="password" :placeholder="pick('Enter admin password', '输入管理员密码')" autofocus
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none" />
        <p v-if="passError" class="text-red-400 text-sm">{{ passError }}</p>
        <button type="submit" class="w-full py-3 bg-amber-600 text-black font-semibold hover:bg-amber-500 transition-colors">{{ pick('Enter', '进入') }}</button>
      </form>
    </div>

    <!-- Admin panel -->
    <div v-else class="max-w-7xl mx-auto px-6">
      <div class="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-900 border border-gray-800">
        <span class="text-xs text-gray-500">{{ pick('Links:', '链接：') }}</span>
        <router-link to="/admin" class="text-xs px-2 py-1 bg-gray-800 text-amber-400 border border-gray-700">{{ pick('Admin', '管理后台') }}</router-link>
        <router-link to="/export" class="text-xs px-2 py-1 bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors">{{ pick('Export', '导出') }}</router-link>
        <router-link to="/checkin" class="text-xs px-2 py-1 bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors">{{ pick('Check-in', '签到') }}</router-link>
        <router-link to="/projects" class="text-xs px-2 py-1 bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors">{{ pick('Projects', '项目') }}</router-link>
        <span class="text-gray-700 mx-1">|</span>
        <span class="text-[10px] text-gray-600">admin: <span class="text-gray-400 font-mono select-all">{{ passwords.admin }}</span></span>
        <span class="text-[10px] text-gray-600">export: <span class="text-gray-400 font-mono select-all">{{ passwords.export }}</span></span>
        <span class="text-[10px] text-gray-600">checkin: <span class="text-gray-400 font-mono select-all">{{ passwords.checkin }}</span></span>
      </div>
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-white">{{ pick('Hackathon Admin', '黑客松管理后台') }}</h1>
        <div class="flex gap-2">
          <div class="relative">
            <button @click="showExportMenu = !showExportMenu" class="px-4 py-2 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors">{{ pick('Export', '导出') }} ▾</button>
            <div v-if="showExportMenu" class="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 shadow-lg z-10">
              <button @click="downloadBackup('json')" class="w-full px-4 py-2 text-sm text-left hover:bg-gray-700">JSON</button>
              <button @click="downloadBackup('csv')" class="w-full px-4 py-2 text-sm text-left hover:bg-gray-700">CSV</button>
              <button @click="downloadBackup('pdf')" class="w-full px-4 py-2 text-sm text-left hover:bg-gray-700">PDF</button>
            </div>
          </div>
          <button @click="loadData" :disabled="loading" class="px-4 py-2 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors">
            {{ loading ? pick('Loading...', '加载中……') : pick('Refresh', '刷新') }}
          </button>
        </div>
      </div>

      <!-- Stats Row 1: Key Numbers -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-3xl font-bold text-white">{{ totalUsers }}</p>
          <p class="text-xs text-gray-500 uppercase">{{ pick('Registered', '已注册') }}</p>
          <p class="text-[10px] text-gray-600 mt-1">+{{ recentSignups }} {{ pick('in last 24h', '过去 24 小时') }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-3xl font-bold text-white">{{ totalTeams }}</p>
          <p class="text-xs text-gray-500 uppercase">{{ pick('Teams', '队伍') }}</p>
          <p class="text-[10px] text-gray-600 mt-1">{{ fullTeams }} {{ pick('full', '已满') }} · {{ openTeams }} {{ pick('open', '开放') }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-3xl font-bold text-green-400">{{ checkedIn }}</p>
          <p class="text-xs text-gray-500 uppercase">{{ pick('Checked In', '已签到') }}</p>
          <p class="text-[10px] text-gray-600 mt-1">{{ totalUsers > 0 ? Math.round(checkedIn / totalUsers * 100) : 0 }}% {{ pick('of registered', '注册用户') }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-3xl font-bold text-blue-400">{{ approved }}</p>
          <p class="text-xs text-gray-500 uppercase">{{ pick('Approved', '已批准') }}</p>
          <p class="text-[10px] text-gray-600 mt-1">{{ totalUsers - approved }} {{ pick('pending', '待处理') }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-3xl font-bold text-emerald-400">{{ confirmedYes }}</p>
          <p class="text-xs text-gray-500 uppercase">{{ pick('Demo Day RSVP Yes', '确认参加 Demo Day') }}</p>
          <p class="text-[10px] text-gray-600 mt-1">{{ confirmedNo }} {{ pick('no', '不参加') }} · {{ confirmedPending }} {{ pick('pending', '待确认') }}</p>
        </div>
      </div>

      <!-- Announcement Editor -->
      <div class="mb-8 p-4 bg-gray-900 border border-amber-500/30">
        <p class="text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold">{{ pick('Live Announcement Banner', '实时公告横幅') }}</p>
        <div class="flex gap-2 mb-3">
          <input v-model="announcementText" type="text" :placeholder="pick('Type new announcement...', '输入新公告……')"
            class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
          <button @click="pushAnnouncement" :disabled="announcementSaving || !announcementText.trim()"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-sm font-bold uppercase tracking-widest disabled:opacity-50">
            {{ announcementSaving ? '...' : pick('Push', '发布') }}
          </button>
          <button @click="clearAnnouncement"
            class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm border border-gray-700">
            {{ pick('Clear', '清除') }}
          </button>
        </div>
        <div v-if="announcementHistory.length" class="space-y-1">
          <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{{ pick('History (click to reactivate)', '历史公告（点击重新启用）') }}</p>
          <button v-for="a in announcementHistory" :key="a.id" @click="reactivateAnnouncement(a.id)"
            class="w-full text-left px-3 py-1.5 text-xs rounded transition-colors flex items-center justify-between gap-2"
            :class="a.active ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'">
            <span class="truncate">{{ a.content }}</span>
            <span class="text-[10px] text-gray-600 shrink-0">{{ new Date(a.created_at).toLocaleString() }}</span>
          </button>
        </div>
      </div>

      <!-- Submissions -->
      <div v-if="submissions.length" class="mb-8 p-4 bg-gray-900 border border-gray-800">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">{{ pick('Submissions', '项目提交') }}（{{ submissions.length }}）</p>
        <div v-for="s in submissions" :key="s.id" class="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
          <div>
            <p class="text-sm font-semibold">{{ teams.find(t => t.id === s.team_id)?.name || s.team_id }}</p>
            <a :href="s.github_url" target="_blank" class="text-xs text-blue-400 hover:underline">{{ s.github_url }}</a>
          </div>
          <span class="text-[10px] text-gray-600">{{ new Date(s.submitted_at).toLocaleString() }}</span>
        </div>
      </div>

      <!-- Redeem Codes -->
      <div class="mb-8 p-4 bg-gray-900 border border-gray-800">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-bold">{{ pick('Redeem Codes', '兑换码') }}</p>
          <button @click="autoAssignCodes" class="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold uppercase tracking-widest">{{ pick('Auto-assign All', '自动分配全部') }}</button>
        </div>

        <!-- Code stats -->
        <div class="flex gap-4 mb-4">
          <div v-for="(s, model) in codeStats" :key="model" class="text-xs">
            <span class="text-white font-bold">{{ model }}</span>:
            <span class="text-emerald-400">{{ s.available }} {{ pick('free', '可用') }}</span> /
            <span class="text-blue-400">{{ s.assigned }} {{ pick('assigned', '已分配') }}</span> /
            <span class="text-gray-500">{{ s.used }} {{ pick('used', '已使用') }}</span>
          </div>
        </div>

        <!-- Import -->
        <div class="flex gap-2 mb-4">
          <select v-model="importModel" class="px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs">
            <option>MiniMax</option>
            <option>Kimi</option>
          </select>
          <textarea v-model="importText" rows="2" :placeholder="pick('Paste codes, one per line...', '粘贴兑换码，每行一个……')"
            class="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs focus:border-amber-500 focus:outline-none"></textarea>
          <button @click="importCodes" :disabled="!importText.trim()" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-bold uppercase disabled:opacity-50">{{ pick('Import', '导入') }}</button>
        </div>

        <!-- Full code list -->
        <details class="mt-4">
          <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300">{{ pick('View all codes', '查看全部兑换码') }}（{{ redeemCodes.length }}）</summary>
          <div class="mt-2 max-h-64 overflow-y-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-gray-600 uppercase border-b border-gray-800">
                  <th class="py-1 px-2 text-left">{{ pick('Code', '兑换码') }}</th>
                  <th class="py-1 px-2 text-left">{{ pick('Model', '模型') }}</th>
                  <th class="py-1 px-2 text-left">{{ pick('Status', '状态') }}</th>
                  <th class="py-1 px-2 text-left">{{ pick('Assigned To', '分配给') }}</th>
                  <th class="py-1 px-2 text-left">{{ pick('Time', '时间') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in redeemCodes" :key="c.id" class="border-b border-gray-800/30"
                  :class="c.status === 'assigned' ? 'text-blue-400' : c.status === 'used' ? 'text-gray-600 line-through' : 'text-emerald-400'">
                  <td class="py-1 px-2 font-mono">{{ c.code }}</td>
                  <td class="py-1 px-2">{{ c.model }}</td>
                  <td class="py-1 px-2">{{ codeStatusLabel(c.status) }}</td>
                  <td class="py-1 px-2">{{ c.assigned_to ? (profiles.find((p: any) => p.id === c.assigned_to)?.name || c.assigned_to) : '—' }}</td>
                  <td class="py-1 px-2 text-gray-600">{{ c.assigned_at ? new Date(c.assigned_at).toLocaleString() : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <!-- Stats Row 2: Breakdown -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div class="bg-gray-900 border border-gray-800 p-4">
          <div class="flex items-baseline gap-3 mb-2">
            <span class="text-xl font-bold text-white">{{ inTeam }}</span>
            <span class="text-xs text-gray-500">{{ pick('in teams', '已加入队伍') }}</span>
            <span class="text-xl font-bold text-amber-400 ml-auto">{{ noTeam }}</span>
            <span class="text-xs text-gray-500">{{ pick('no team', '无队伍') }}</span>
          </div>
          <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-white rounded-full" :style="{ width: totalUsers > 0 ? `${inTeam / totalUsers * 100}%` : '0%' }"></div>
          </div>
          <p class="text-[10px] text-gray-600 mt-1">{{ lookingForTeam }} {{ pick('looking for team', '人正在寻找队伍') }}</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-xs text-gray-500 uppercase mb-2">{{ pick('Models', '模型') }}</p>
          <div class="space-y-1">
            <div v-for="(count, model) in modelStats" :key="model" class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-14">{{ model }}</span>
              <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" :style="{ width: totalTeams > 0 ? `${count / totalTeams * 100}%` : '0%' }"></div>
              </div>
              <span class="text-xs text-white font-bold w-6 text-right">{{ count }}</span>
            </div>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-xs text-gray-500 uppercase mb-2">{{ pick('Roles', '角色') }}</p>
          <div class="space-y-0.5">
            <div v-for="[role, count] in roleStats" :key="role" class="flex items-center justify-between">
              <span class="text-[11px] text-gray-400 truncate">{{ roleLabel(role) }}</span>
              <span class="text-[11px] text-white font-bold ml-2">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row 3: Charts & Completion -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <!-- Daily signups chart -->
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-xs text-gray-500 uppercase mb-3">{{ pick('Registration Timeline', '报名时间线') }}</p>
          <div class="relative overflow-x-auto" ref="chartScroll">
            <svg v-if="dailySignups.length" :viewBox="`0 0 ${chartWidth} 200`" :width="chartWidth" height="200" class="block">
              <!-- Bars (daily count) -->
              <rect v-for="(d, i) in chartBarData" :key="'bar-'+i"
                :x="d.x" :y="d.y" :width="d.barW" :height="d.height"
                :fill="hoveredDay === i ? '#f59e0b' : '#f59e0b'" :opacity="hoveredDay === i ? 0.7 : 0.25" rx="2"
                class="cursor-pointer transition-opacity duration-150"
                @mouseenter="hoveredDay = i" @mouseleave="hoveredDay = -1" />
              <!-- Cumulative line -->
              <path :d="chartPoints" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Dots -->
              <circle v-for="(d, i) in dailySignups" :key="'dot-'+i"
                :cx="chartPad + (i / Math.max(dailySignups.length - 1, 1)) * (chartWidth - chartPad * 2)"
                :cy="chartH - chartPad - (d.cumulative / dailySignups[dailySignups.length-1].cumulative) * (chartH - chartPad * 2)"
                :r="hoveredDay === i ? 6 : 3.5" :fill="hoveredDay === i ? '#fff' : '#f59e0b'" :opacity="hoveredDay === i ? 1 : 0.7"
                :stroke="hoveredDay === i ? '#f59e0b' : 'none'" :stroke-width="hoveredDay === i ? 2 : 0"
                class="cursor-pointer transition-all duration-150"
                @mouseenter="hoveredDay = i" @mouseleave="hoveredDay = -1" />
              <!-- X-axis date labels -->
              <text v-for="(d, i) in dailySignups" :key="'lbl-'+i"
                :x="chartPad + (i / Math.max(dailySignups.length - 1, 1)) * (chartWidth - chartPad * 2)"
                :y="chartH - 2"
                text-anchor="middle" class="text-[10px]" fill="#555">{{ d.date.slice(5) }}</text>
            </svg>
            <!-- Hover tooltip -->
            <div v-if="hoveredDay >= 0 && hoveredDay < dailySignups.length"
              class="absolute top-2 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded shadow-lg pointer-events-none z-10"
              :style="{ left: `${chartPad + (hoveredDay / Math.max(dailySignups.length - 1, 1)) * (chartWidth - chartPad * 2)}px`, transform: 'translateX(-50%)' }">
              <p class="text-xs text-white font-bold">{{ dailySignups[hoveredDay].date }}</p>
              <p class="text-[10px] text-amber-400">+{{ dailySignups[hoveredDay].count }} {{ pick('new', '新增') }}</p>
              <p class="text-[10px] text-gray-400">{{ dailySignups[hoveredDay].cumulative }} {{ pick('total', '累计') }}</p>
            </div>
          </div>
        </div>

        <!-- Field completion rates -->
        <div class="bg-gray-900 border border-gray-800 p-4">
          <p class="text-xs text-gray-500 uppercase mb-3">{{ pick('Profile Completion', '资料完整度') }}</p>
          <div class="space-y-2">
            <div v-for="f in fieldRates" :key="f.label" class="flex items-center gap-2">
              <span class="text-[11px] text-gray-400 w-16 shrink-0">{{ f.label }}</span>
              <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.pct >= 50 ? 'bg-green-500' : f.pct >= 20 ? 'bg-amber-500' : 'bg-red-500'"
                  :style="{ width: `${f.pct}%` }"></div>
              </div>
              <span class="text-[11px] text-gray-400 w-16 text-right">{{ f.count }}/{{ totalUsers }} <span class="text-gray-600">({{ f.pct }}%)</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-gray-800">
        <button @click="tab = 'users'" class="px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
          :class="tab === 'users' ? 'text-white border-amber-500' : 'text-gray-500 border-transparent hover:text-gray-300'">
          {{ pick('Users', '用户') }}（{{ totalUsers }}）
        </button>
        <button @click="tab = 'teams'" class="px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
          :class="tab === 'teams' ? 'text-white border-amber-500' : 'text-gray-500 border-transparent hover:text-gray-300'">
          {{ pick('Teams', '队伍') }}（{{ totalTeams }}）
        </button>
      </div>

      <!-- Users tab -->
      <div v-if="tab === 'users'">
        <input v-model="search" type="text" :placeholder="pick('Search by name or email...', '按姓名或邮箱搜索……')"
          class="w-full max-w-md px-4 py-2 mb-4 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none text-sm" />

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase border-b border-gray-800">
                <th class="py-3 px-3">{{ pick('User', '用户') }}</th>
                <th class="py-3 px-3">{{ pick('Email', '邮箱') }}</th>
                <th class="py-3 px-3">{{ pick('WeChat', '微信') }}</th>
                <th class="py-3 px-3">{{ pick('Role', '角色') }}</th>
                <th class="py-3 px-3">{{ pick('Location', '地区') }}</th>
                <th class="py-3 px-3">{{ pick('Organization / Age', '单位 / 年龄段') }}</th>
                <th class="py-3 px-3">{{ pick('Team', '队伍') }}</th>
                <th class="py-3 px-3 text-center">{{ pick('Approved', '已批准') }}</th>
                <th class="py-3 px-3 text-center">{{ pick('Check-in', '签到') }}</th>
                <th class="py-3 px-3 text-center">{{ pick('Demo Day RSVP', 'Demo Day 出席') }}</th>
                <th class="py-3 px-3">{{ pick('Registered', '注册时间') }}</th>
                <th class="py-3 px-3">{{ pick('Actions', '操作') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredUsers" :key="p.id" class="border-b border-gray-800/50 hover:bg-gray-900/50">
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2">
                    <img :src="userAvatar(p)"
                      class="w-7 h-7 rounded-full object-cover" />
                    <span class="text-white">{{ p.name }}</span>
                    <span v-if="p.admin_notes" class="ml-1 text-amber-400 text-[10px]" :title="p.admin_notes">📝</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-gray-400">{{ p.email || '—' }}</td>
                <td class="py-3 px-3 text-gray-400">{{ p.wechat || '—' }}</td>
                <td class="py-3 px-3 text-gray-400">{{ roleLabel(p.role) || '—' }}</td>
                <td class="py-3 px-3 text-gray-400">{{ [p.city, p.country].filter(Boolean).join(', ') || '—' }}</td>
                <td class="py-3 px-3 text-gray-400"><span>{{ p.organization || '—' }}</span><span v-if="p.age_range" class="ml-1 text-gray-600">· {{ p.age_range }}</span></td>
                <td class="py-3 px-3 text-gray-400">{{ getTeamName(p.team_id) }}</td>
                <td class="py-3 px-3 text-center">
                  <button @click="toggleApproved(p)" class="w-6 h-6 border-2 rounded inline-flex items-center justify-center transition-colors"
                    :class="p.approved ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 hover:border-blue-500'">
                    <svg v-if="p.approved" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </button>
                </td>
                <td class="py-3 px-3 text-center">
                  <button @click="toggleCheckIn(p)" class="w-6 h-6 border-2 rounded inline-flex items-center justify-center transition-colors"
                    :class="p.checked_in ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 hover:border-green-500'">
                    <svg v-if="p.checked_in" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </button>
                </td>
                <td class="py-3 px-3 text-center">
                  <span v-if="p.confirmed_attendance === 'yes'" class="text-emerald-400 text-xs font-bold">{{ pick('YES', '是') }}</span>
                  <span v-else-if="p.confirmed_attendance === 'no'" class="text-red-400 text-xs font-bold">{{ pick('NO', '否') }}</span>
                  <span v-else class="text-gray-600 text-xs">—</span>
                </td>
                <td class="py-3 px-3 text-gray-500 text-xs">{{ new Date(p.created_at).toLocaleDateString() }}</td>
                <td class="py-3 px-3">
                  <div class="flex gap-2 items-center">
                    <button @click="showQr(p)" class="text-xs text-amber-400 hover:text-amber-300">QR</button>
                    <button @click="openEdit(p)" class="text-xs text-blue-400 hover:text-blue-300">{{ pick('Edit', '编辑') }}</button>
                    <template v-if="p.checked_in && p.team_id && ['Kimi','GLM','MiniMax','DeepSeek'].includes(teams.find((t: any) => t.id === p.team_id)?.model)">
                      <template v-if="getUserCode(p.id)">
                        <code class="text-[10px] text-emerald-400 font-mono">{{ getUserCode(p.id).code }}</code>
                        <button @click="replaceCode(p.id, getUserCode(p.id).id, teams.find((t: any) => t.id === p.team_id)?.model)" class="text-[10px] text-gray-500 hover:text-amber-400">↻</button>
                      </template>
                      <button v-else @click="manualAssign(p.id, teams.find((t: any) => t.id === p.team_id)?.model)" class="text-xs text-emerald-500 hover:text-emerald-400">{{ pick('Code', '兑换码') }}</button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Teams tab -->
      <div v-if="tab === 'teams'">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase border-b border-gray-800">
                <th class="py-3 px-3">{{ pick('Team', '队伍') }}</th>
                <th class="py-3 px-3">{{ pick('Leader', '队长') }}</th>
                <th class="py-3 px-3">{{ pick('Members', '成员') }}</th>
                <th class="py-3 px-3">{{ pick('Model', '模型') }}</th>
                <th class="py-3 px-3">{{ pick('Capability Domains', '能力域') }}</th>
                <th class="py-3 px-3">{{ pick('Status', '状态') }}</th>
                <th class="py-3 px-3">{{ pick('Actions', '操作') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in teams" :key="t.id" class="border-b border-gray-800/50 hover:bg-gray-900/50">
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2">
                    <img :src="assetUrl(t.avatar) || assetUrl('/default-team-avatar.svg')" class="w-7 h-7 rounded object-cover" />
                    <span class="text-white">{{ t.name }}</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-gray-400">{{ getLeaderName(t.id) }}</td>
                <td class="py-3 px-3 text-gray-400">{{ getTeamMembers(t.id).length }}{{ t.max_size != null ? ` / ${t.max_size}` : '' }}</td>
                <td class="py-3 px-3 text-gray-400">{{ t.model || '—' }}</td>
                <td class="py-3 px-3">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="theme in (t.themes || [])" :key="theme" class="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded">{{ trackLabel(theme) }}</span>
                  </div>
                </td>
                <td class="py-3 px-3">
                  <span :class="t.locked ? 'text-red-400' : 'text-green-400'" class="text-xs font-semibold">{{ t.locked ? pick('Locked', '已锁定') : pick('Open', '开放') }}</span>
                </td>
                <td class="py-3 px-3">
                  <div class="flex gap-2">
                    <button @click="viewingTeam = t" class="text-xs text-blue-400 hover:text-blue-300">{{ pick('View', '查看') }}</button>
                    <button @click="dissolveTeam(t)" class="text-xs text-red-400 hover:text-red-300">{{ pick('Dissolve', '解散') }}</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
        <div v-if="editingUser" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70" @click="editingUser = null" />
          <div class="relative w-full max-w-md bg-gray-900 border border-gray-700 p-6 max-h-[80vh] overflow-y-auto">
            <h3 class="text-lg font-bold text-white mb-4">{{ pick('Edit', '编辑') }}：{{ editingUser.name }}</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Name', '姓名') }}</label>
                <input v-model="editFields.name" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Email', '邮箱') }}</label>
                <input v-model="editFields.email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('WeChat ID', '微信号') }}</label>
                <input v-model="editFields.wechat" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Role', '角色') }}</label>
                <input v-model="editFields.role" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Bio', '个人简介') }}</label>
                <textarea v-model="editFields.bio" rows="2" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"></textarea>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{{ pick('Country', '国家') }}</label>
                  <input v-model="editFields.country" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{{ pick('City', '城市') }}</label>
                  <input v-model="editFields.city" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Organization / School', '单位 / 学校') }}</label>
                <input v-model="editFields.organization" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Age Range', '年龄段') }}</label>
                <select v-model="editFields.age_range" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none">
                  <option value="">—</option>
                  <option v-for="range in ['18-22', '23-28', '29-35', '36+']" :key="range" :value="range">{{ range }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">{{ pick('Where do you hear from us?', '你从哪里了解到我们？') }}</label>
                <input v-model="editFields.referral_source" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">GitHub</label>
                  <input v-model="editFields.github_id" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Discord</label>
                  <input v-model="editFields.discord" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Twitter</label>
                  <input v-model="editFields.twitter" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Telegram</label>
                  <input v-model="editFields.telegram" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <label class="block text-xs text-amber-400 mb-1">{{ pick('Admin Notes (internal only)', '管理员备注（仅内部可见）') }}</label>
              <textarea v-model="editFields.admin_notes" rows="3" :placeholder="pick('Internal notes about this user...', '关于该用户的内部备注……')"
                class="w-full px-3 py-2 bg-gray-800 border border-amber-500/30 text-white text-sm focus:border-amber-500 focus:outline-none"></textarea>
            </div>
            <div class="flex gap-3 mt-4">
              <button @click="saveEdit" class="flex-1 py-2 bg-amber-600 text-black font-semibold text-sm hover:bg-amber-500 transition-colors">{{ pick('Save', '保存') }}</button>
              <button @click="editingUser = null" class="flex-1 py-2 bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors">{{ pick('Cancel', '取消') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- View Team Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
        <div v-if="viewingTeam" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70" @click="viewingTeam = null" />
          <div class="relative w-full max-w-md bg-gray-900 border border-gray-700 p-6">
            <h3 class="text-lg font-bold text-white mb-1">{{ viewingTeam.name }}</h3>
            <p v-if="viewingTeam.project_idea" class="text-sm text-gray-400 mb-4 italic">"{{ viewingTeam.project_idea }}"</p>
            <div class="mb-4">
              <p class="text-xs text-gray-500 uppercase mb-2">{{ pick('Members', '成员') }}（{{ getTeamMembers(viewingTeam.id).length }}{{ viewingTeam.max_size != null ? ` / ${viewingTeam.max_size}` : '' }}）</p>
              <div class="space-y-2">
                <div v-for="m in getTeamMembers(viewingTeam.id)" :key="m.id" class="flex items-center gap-3 p-2 bg-gray-800 rounded">
                  <img :src="userAvatar(m)" class="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p class="text-sm text-white">{{ m.name }} <span v-if="m.id === viewingTeam.leader_id" class="text-amber-400 text-xs">{{ pick('Lead', '队长') }}</span></p>
                    <p class="text-xs text-gray-500">{{ roleLabel(m.role) }} {{ m.email ? `· ${m.email}` : '' }}</p>
                  </div>
                  <span :class="m.checked_in ? 'text-green-400' : 'text-gray-600'" class="ml-auto text-xs">{{ m.checked_in ? pick('Checked in', '已签到') : pick('Not here', '未到场') }}</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs text-gray-400">
              <p><span class="text-gray-600">{{ pick('Model', '模型') }}：</span> {{ viewingTeam.model || '—' }}</p>
              <p><span class="text-gray-600">{{ pick('Status', '状态') }}：</span> {{ viewingTeam.locked ? pick('Locked', '已锁定') : pick('Open', '开放') }}</p>
              <p v-if="viewingTeam.github_repo"><span class="text-gray-600">{{ pick('Repo', '仓库') }}：</span> <a :href="viewingTeam.github_repo" target="_blank" class="text-blue-400 hover:underline">{{ pick('Link', '链接') }}</a></p>
            </div>
            <button @click="viewingTeam = null" class="w-full mt-4 py-2 bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors">{{ pick('Close', '关闭') }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- QR Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
        <div v-if="qrUser" class="fixed inset-0 z-[200] flex items-center justify-center p-4" @click="qrUser = null">
          <div class="absolute inset-0 bg-black/80" />
          <div class="relative bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center" @click.stop>
            <h3 class="text-lg font-bold text-gray-900 mb-1">{{ qrUser.name }}</h3>
            <p class="text-sm text-gray-500 mb-1">{{ qrUser.email || '' }}</p>
            <span :class="qrUser.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs font-semibold px-2 py-0.5 rounded mb-4">
              {{ qrUser.approved ? pick('APPROVED', '已批准') : pick('NOT APPROVED', '未批准') }}
            </span>
            <img v-if="qrDataUrl" :src="qrDataUrl" class="w-56 h-56" />
            <p class="text-xs text-gray-400 mt-3">{{ qrUser.id }}</p>
            <button @click="qrUser = null" class="mt-4 px-6 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">{{ pick('Close', '关闭') }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
