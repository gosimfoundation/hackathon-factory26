<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCountUp } from '../../composables/useCountUp'
import { useTeams, type Team } from '../../composables/useTeams'
import { useAuth, type User } from '../../composables/useAuth'
import { useI18n } from '../../composables/useI18n'
import { teamFilter } from '../../composables/useTeamFilter'
import { API_BASE, assetUrl } from '../../composables/api'

const { t, pick, roleLabel, trackLabel } = useI18n()
const { user, isLoggedIn, promptAuth } = useAuth()
// GitHub avatar helper
function getGitHubAvatar(githubId?: string): string {
  if (!githubId) return assetUrl('/default-avatar.svg')
  return `https://avatars.githubusercontent.com/${githubId.replace(/^@/, '')}`
}


const {
  teams, users, totalMembers, totalRegistered, isFull, cancelJoin, kickMember,
  modelStats, loading, error, lastUpdated,
  fetchTeams, createTeam, editTeam, joinTeam, leaveTeam, likeTeam, approveJoin, rejectJoin
} = useTeams()

// Animated counters
const teamsCount = useCountUp(computed(() => teams.value.length))
const membersCount = useCountUp(totalMembers)
const registeredCount = useCountUp(totalRegistered)

// Like tracking (localStorage)
const likedTeams = ref<Set<string>>(new Set(JSON.parse(localStorage.getItem('likedTeams') || '[]')))

async function handleLike(teamId: string, e: Event) {
  e.stopPropagation()
  if (likedTeams.value.has(teamId)) return
  const ok = await likeTeam(teamId)
  if (ok) {
    likedTeams.value.add(teamId)
    localStorage.setItem('likedTeams', JSON.stringify([...likedTeams.value]))
  }
}

// Theme filter (shared)
const filteredTeams = computed(() => {
  if (!teamFilter.value) return teams.value
  return teams.value.filter(team => (team.themes || []).some(th => th.includes(teamFilter.value)))
})

// Get members for a team from users array
function getTeamMembers(teamId: string): User[] {
  return users.value.filter(u => u.teamId === teamId)
}

const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
let toastTimer: number | undefined

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.value = null, 4000)
}

function timeAgo(date: Date | null) {
  if (!date) return ''
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return pick('just now', '刚刚')
  if (secs < 60) return pick(`${secs}s ago`, `${secs} 秒前`)
  return pick(`${Math.floor(secs / 60)}m ago`, `${Math.floor(secs / 60)} 分钟前`)
}

function timeAgoFromString(iso: string) {
  const d = new Date(iso)
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return pick('just now', '刚刚')
  if (secs < 3600) return pick(`${Math.floor(secs / 60)}m ago`, `${Math.floor(secs / 60)} 分钟前`)
  if (secs < 86400) return pick(`${Math.floor(secs / 3600)}h ago`, `${Math.floor(secs / 3600)} 小时前`)
  return pick(`${Math.floor(secs / 86400)}d ago`, `${Math.floor(secs / 86400)} 天前`)
}

// Recent activity for ticker: newest user + newest team
const recentActivity = computed(() => {
  const events: { text: string; time: string }[] = []
  const recentUsers = [...users.value].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 3)
  for (const u of recentUsers) {
    if (u.createdAt) events.push({ text: pick(`${u.name} just joined`, `${u.name} 刚刚加入`), time: timeAgoFromString(u.createdAt) })
  }
  const recentTeams = [...teams.value].sort((a: any, b: any) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 2)
  for (const t of recentTeams as any[]) {
    if (t.createdAt) events.push({ text: pick(`Team "${t.name}" formed`, `队伍“${t.name}”已成立`), time: timeAgoFromString(t.createdAt) })
  }
  return events.sort((a, b) => a.time.localeCompare(b.time))
})

const tickerIndex = ref(0)
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (recentActivity.value.length > 0) {
      tickerIndex.value = (tickerIndex.value + 1) % recentActivity.value.length
    }
  }, 4000)
}

// Twemoji CDN helper
const twemoji = (code: string) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`
const tw = {
  crown: twemoji('1f451'),    // 👑
  sparkles: twemoji('2728'),  // ✨
  wave: twemoji('1f44b'),     // 👋
  rocket: twemoji('1f680'),   // 🚀
  fire: twemoji('1f525'),     // 🔥
  heart: twemoji('2764'),     // ❤️
  lock: twemoji('1f512'),     // 🔒
  bulb: twemoji('1f4a1'),     // 💡
  link: twemoji('1f517'),     // 🔗
  star: twemoji('2b50'),      // ⭐
  eyes: twemoji('1f440'),     // 👀
  handshake: twemoji('1f91d'),// 🤝
}

const showModal = ref(false)
const modalMode = ref<'create' | 'view' | 'edit'>('create')
const viewingTeam = ref<Team | null>(null)
const teamLocked = ref(false)
const showAdvanced = ref(false)

const teamName = ref('')
const githubRepo = ref('')
const selectedTracks = ref<string[]>([])
const selectedModel = ref('')
const selectedHarness = ref('')
const projectIdea = ref('')
const teamAvatar = ref('')
const maxSize = ref<number | null>(null)

const trackIds = ['auth-session', 'repository-lifecycle', 'issues-forms', 'pull-request-review', 'actions-workflow', 'org-permissions-audit', 'compute-engine']
const trackIcons = ['/icons/theme-01.svg', '/icons/theme-02-v2.svg', '/icons/theme-03.svg', '/icons/theme-04.svg', '/icons/theme-05.svg', '/icons/theme-06.svg', '/icons/theme-07.svg']
const tracks = computed(() => (t('tracks.themes') as any[]).map((theme, i) => ({ id: trackIds[i], label: theme.title, icon: assetUrl(trackIcons[i]) })))

function toggleTrack(id: string) {
  const idx = selectedTracks.value.indexOf(id)
  if (idx >= 0) selectedTracks.value.splice(idx, 1)
  else selectedTracks.value.push(id)
}

function getTrackIcon(trackId: string) {
  return tracks.value.find(track => track.id === trackId || track.label === trackId)?.icon
}

function getTrackLabel(trackId: string) {
  return trackLabel(trackId)
}

const modelOptions = computed<{ id: string; label: string; icon?: string }[]>(() => [
  { id: 'MiniMax', label: 'MiniMax' },
  { id: 'Kimi', label: 'Kimi' },
  { id: 'GLM', label: 'GLM' },
  { id: 'DeepSeek', label: 'DeepSeek' },
  { id: 'Other', label: pick('Other', '其他') },
])

const avatarPresets: { id: string; label: string; src: string }[] = []

function selectAvatar(preset: { id: string; src: string }) {
  teamAvatar.value = preset.src
  selectedModel.value = preset.id
}

function selectModel(id: string) {
  if (selectedModel.value === id) {
    selectedModel.value = ''
  } else {
    selectedModel.value = id
    // 没有自定义头图时，跟随模型
    const isCustom = teamAvatar.value && !avatarPresets.some(p => p.src === teamAvatar.value)
    if (!isCustom) {
      teamAvatar.value = avatarPresets.find(p => p.id === id)?.src ?? ''
    }
  }
}

function defaultAvatar(): string {
  return assetUrl('/default-team-avatar.svg')
}

async function uploadTeamAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('avatar', file)
  try {
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form })
    const data = await res.json()
    if (data.url) teamAvatar.value = `${API_BASE}${data.url}`
    else showToast(data.error || pick('Upload failed', '上传失败'), 'error')
  } catch { showToast(pick('Upload failed', '上传失败'), 'error') }
}

function resetForm() {
  teamName.value = ''
  githubRepo.value = ''
  selectedTracks.value = []
  selectedModel.value = ''
  selectedHarness.value = ''
  projectIdea.value = ''
  teamAvatar.value = ''
  teamLocked.value = false
  maxSize.value = null
  showAdvanced.value = false
  error.value = ''
}

function openCreateModal() {
  modalMode.value = 'create'
  resetForm()
  showModal.value = true
}

function openViewModal(team: Team) {
  modalMode.value = 'view'
  viewingTeam.value = team
  error.value = ''
  showModal.value = true
}

function openEditModal() {
  if (!viewingTeam.value) return
  const team = viewingTeam.value
  modalMode.value = 'edit'
  teamName.value = team.name
  githubRepo.value = team.githubRepo
  selectedTracks.value = [...(team.themes || [])]
  selectedModel.value = team.model || ''
  selectedHarness.value = team.harness || ''
  projectIdea.value = team.projectIdea || ''
  teamAvatar.value = team.avatar || ''
  teamLocked.value = team.locked
  maxSize.value = team.maxSize
  error.value = ''
}

async function submitCreate() {
  if (!isLoggedIn.value) return
  const ok = await createTeam({
    name: teamName.value,
    avatar: teamAvatar.value || defaultAvatar(),
    githubRepo: githubRepo.value,
    themes: selectedTracks.value,
    model: selectedModel.value,
    harness: selectedHarness.value,
    projectIdea: projectIdea.value,
    locked: teamLocked.value,
    maxSize: maxSize.value,
  })
  if (ok) {
    showModal.value = false
    showToast(pick(`Team "${teamName.value}" created! Good luck!`, `队伍“${teamName.value}”创建成功，祝你们好运！`))
  }
}

async function submitEdit() {
  if (!viewingTeam.value) return
  const ok = await editTeam(viewingTeam.value.id, {
    name: teamName.value,
    avatar: teamAvatar.value || defaultAvatar(),
    githubRepo: githubRepo.value,
    themes: selectedTracks.value,
    model: selectedModel.value,
    harness: selectedHarness.value,
    projectIdea: projectIdea.value,
    locked: teamLocked.value,
    maxSize: maxSize.value,
  })
  if (ok) {
    showModal.value = false
    showToast(pick(`Team "${teamName.value}" updated!`, `队伍“${teamName.value}”已更新！`))
  }
}

async function handleJoinTeam(teamId: string, e?: Event) {
  if (e) e.stopPropagation()
  if (!isLoggedIn.value) return
  const team = teams.value.find(t => t.id === teamId)
  const ok = await joinTeam(teamId)
  if (ok) {
    showToast(pick(`Request sent to "${team?.name || 'the team'}". Waiting for leader approval.`, `加入“${team?.name || '该队伍'}”的申请已发送，等待队长审批。`))
    if (viewingTeam.value?.id === teamId) {
      viewingTeam.value = teams.value.find(t => t.id === teamId) || null
    }
  } else {
    showToast(error.value || pick('Failed to send request', '申请发送失败'), 'error')
  }
}

function hasPendingRequest(team: Team) {
  return user.value && (team.pendingJoins || []).includes(user.value.id)
}

async function handleApprove(teamId: string, userId: string) {
  const ok = await approveJoin(teamId, userId)
  if (ok) {
    showToast(pick('Member approved!', '已通过成员申请！'))
    viewingTeam.value = teams.value.find(t => t.id === teamId) || null
  }
}

async function handleCancelJoin(teamId: string) {
  const ok = await cancelJoin(teamId)
  if (ok) {
    showToast(pick('Application cancelled.', '申请已取消。'))
    if (viewingTeam.value?.id === teamId) {
      viewingTeam.value = teams.value.find(t => t.id === teamId) || null
    }
  } else {
    showToast(error.value || pick('Failed to cancel', '取消失败'), 'error')
  }
}

async function handleReject(teamId: string, userId: string) {
  const ok = await rejectJoin(teamId, userId)
  if (ok) {
    showToast(pick('Request declined.', '申请已拒绝。'))
    viewingTeam.value = teams.value.find(t => t.id === teamId) || null
  }
}

async function handleLeaveTeam() {
  if (!viewingTeam.value) return
  const name = viewingTeam.value.name
  const ok = await leaveTeam(viewingTeam.value.id)
  if (ok) {
    showModal.value = false
    showToast(pick(`You've left "${name}".`, `你已退出“${name}”。`))
  }
}

async function handleKickMember(teamId: string, userId: string, userName: string) {
  if (!confirm(pick(`Remove ${userName} from the team?`, `确定将 ${userName} 移出队伍吗？`))) return
  const ok = await kickMember(teamId, userId)
  if (ok) showToast(pick(`${userName} removed from team.`, `${userName} 已被移出队伍。`))
  else showToast(error.value || pick('Failed to remove member', '移除成员失败'), 'error')
}

async function handleDeleteTeam() {
  if (!viewingTeam.value) return
  if (!confirm(pick(`Disband team "${viewingTeam.value.name}"? All members will be removed and this cannot be undone.`, `确定解散队伍“${viewingTeam.value.name}”吗？所有成员都会被移除，且此操作无法撤销。`))) return
  const ok = await leaveTeam(viewingTeam.value.id)
  if (ok) {
    showModal.value = false
    showToast(pick('Team disbanded.', '队伍已解散。'))
  }
}

function getModelIcon(model: string) {
  return modelOptions.value.find((o) => o.id === model)?.icon
}

function canJoin(team: Team) {
  return !team.locked && !isFull.value
}

function isTeamMember(team: Team): boolean {
  if (!user.value) return false
  return user.value.teamId === team.id
}

function isTeamLeader(team: Team): boolean {
  if (!user.value) return false
  return team.leaderId === user.value.id
}

function userHasTeam(): boolean {
  if (!user.value) return false
  if (user.value.teamId) return true
  // 有任何 pending 申请也算"已绑定"，不能再创建/加入其他队
  return teams.value.some(t => t.pendingJoins?.includes(user.value!.id))
}

// function repoName(url: string) {
//   const m = url.match(/github\.com\/([^/]+\/[^/]+)/)
//   return m ? m[1] : url.replace(/https?:\/\//, '')
// }

const inputClass = 'w-full px-4 py-2.5 bg-input-bg border border-input-border text-text-primary placeholder-input-placeholder focus:border-accent/50 focus:outline-none transition-colors text-sm'

function handleOpenMyTeam(e: Event) {
  const teamId = (e as CustomEvent).detail?.teamId
  if (!teamId) return
  const team = teams.value.find(t => t.id === teamId)
  if (team) viewingTeam.value = team
}

function openMyTeamFromButton() {
  if (!user.value) return
  // 先找已加入的队伍
  const joined = teams.value.find(t => t.members?.some(m => m.id === user.value!.id))
  if (joined) { openViewModal(joined); return }
  // 再找 pending 的队伍
  const pending = teams.value.find(t => t.pendingJoins?.includes(user.value!.id))
  if (pending) { openViewModal(pending); return }
}

function openMyProfile() {
  window.dispatchEvent(new CustomEvent('open-profile-modal'))
}

const viewingUser = ref<ReturnType<typeof getTeamMembers>[0] | null>(null)
const showUserProfileModal = ref(false)

function openUserProfile(member: ReturnType<typeof getTeamMembers>[0]) {
  if (user.value && member.id === user.value.id) {
    openMyProfile()
  } else {
    viewingUser.value = member
    showUserProfileModal.value = true
  }
}

onMounted(() => window.addEventListener('open-my-team', handleOpenMyTeam))
onUnmounted(() => window.removeEventListener('open-my-team', handleOpenMyTeam))
</script>

<template>
  <!-- Toast notification -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full text-sm font-semibold shadow-lg backdrop-blur-xl" :class="toast.type === 'success' ? 'bg-accent/90 text-white' : 'bg-red-600 text-white'">
        {{ toast.msg }}
      </div>
    </Transition>
  </Teleport>

  <section id="teams" class="relative py-24 md:py-36 bg-bg-primary overflow-hidden">
    <div class="max-w-[1440px] mx-auto px-6 md:px-10 xl:px-14">
      <div class="grid gap-8 mb-14 reveal-blur lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <span class="section-kicker">{{ pick('07 / Registry', '07 / 队伍名册') }}</span>
          <h2 class="section-title mt-8">{{ t('teams.title') }} {{ t('teams.titleAccent') }}</h2>
        </div>
        <div class="lg:pt-12">
          <p class="text-text-secondary text-base max-w-2xl">{{ t('teams.subtitle') }}</p>
          <p class="text-accent mt-4 text-sm font-semibold">{{ t('teams.registerNote') }}</p>
          <p class="text-text-secondary mt-1 text-xs">{{ t('teams.registerWarn') }}</p>
          <div class="flex items-center gap-3 mt-4">
          <span class="text-xs text-text-secondary">{{ pick('Updated', '更新于') }} {{ timeAgo(lastUpdated) }}</span>
          <button @click="fetchTeams" class="text-xs text-accent hover:text-text-primary transition-colors flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {{ t('teams.refresh') }}
          </button>
        </div>

        <!-- Activity ticker -->
        <div v-if="recentActivity.length" class="flex items-center gap-2 mt-4 text-xs">
          <span class="h-1.5 w-1.5 bg-accent"></span>
          <span class="text-xs font-mono uppercase tracking-wider text-accent">{{ pick('Live Registry', '实时报名动态') }}</span>
          <Transition mode="out-in" enter-active-class="transition duration-300" enter-from-class="opacity-0 translate-y-1" leave-active-class="transition duration-200" leave-to-class="opacity-0 -translate-y-1">
            <span :key="tickerIndex" class="text-text-secondary">
              {{ recentActivity[tickerIndex]?.text }} · <span class="text-text-muted">{{ recentActivity[tickerIndex]?.time }}</span>
            </span>
          </Transition>
        </div>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="max-w-3xl mb-12 reveal border-y border-border py-5">
        <div class="flex justify-between text-sm mb-3">
          <span class="text-text-secondary inline-flex items-center gap-1">
            <img :src="tw.fire" class="w-4 h-4" />
            <span class="text-text-primary font-bold tabular-nums">{{ teamsCount }}</span> {{ t('teams.teams') }} ·
            <span class="text-text-primary font-bold tabular-nums">{{ membersCount }}</span> {{ pick('in teams', '已加入队伍') }} ·
            <span class="text-text-primary font-bold tabular-nums">{{ registeredCount }}</span> {{ pick('registered', '已注册') }}
          </span>
        </div>
        <div class="flex gap-6 mt-6">
          <div v-for="(count, model) in modelStats" :key="model" class="flex items-center gap-2">
            <img v-if="getModelIcon(model as string)" :src="getModelIcon(model as string)" class="h-5 w-auto max-w-[60px] object-contain rounded-[10px]" :title="(model as string)" />
            <span class="text-sm font-semibold text-text-primary">{{ count }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4 flex-wrap mb-12 reveal">
        <template v-if="isLoggedIn">
          <button v-if="userHasTeam()" @click="openMyTeamFromButton" class="px-8 py-4 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">
            {{ pick('MY TEAM', '我的队伍') }}
          </button>
          <button v-else @click="openCreateModal" :disabled="isFull" class="px-8 py-4 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <img v-if="!isFull" :src="tw.rocket" class="w-4 h-4 inline mr-1" />{{ isFull ? t('teams.closedBtn') : t('teams.registerBtn') }}
          </button>
          <button @click="openMyProfile" class="px-8 py-4 border border-border text-text-secondary text-sm font-semibold tracking-widest uppercase hover:text-text-primary hover:border-accent transition-colors">
            {{ pick('VIEW MY PROFILE', '查看我的资料') }}
          </button>
        </template>
        <template v-else>
          <button @click="promptAuth('register')" class="px-8 py-4 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">
            {{ t('nav.applyNow') }}
          </button>
        </template>
      </div>

      <!-- Filter chips -->
      <div v-if="teamFilter" class="flex items-center gap-2 mb-6 reveal">
        <span class="text-sm text-text-secondary">{{ pick('Filtered by:', '当前筛选：') }}</span>
        <button @click="teamFilter = ''" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          {{ getTrackLabel(teamFilter) }}
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Teams grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="team in filteredTeams"
          :key="team.id"
          @click="openViewModal(team)"
          class="team-card p-6 pt-7 group relative cursor-pointer flex flex-col overflow-hidden"
        >
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-accent"></div>
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative">
                <img :src="assetUrl(team.avatar) || assetUrl('/default-team-avatar.svg')" class="w-12 h-12 rounded-full shrink-0 object-cover border-2 border-border group-hover:border-accent-blue transition-colors" :class="!team.avatar ? 'dark:invert' : ''" />
                <img v-if="team.model && getModelIcon(team.model)" :src="getModelIcon(team.model)" :alt="team.model" class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-bg-card bg-bg-elevated" />
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-text-primary text-base truncate group-hover:text-accent transition-colors">{{ team.name }}</h3>
                <div class="flex items-center gap-1.5 mt-1">
                  <template v-for="theme in (team.themes || []).slice(0, 4)" :key="theme">
                    <img v-if="getTrackIcon(theme)" :src="getTrackIcon(theme)" class="w-5 h-5" :title="getTrackLabel(theme)" />
                  </template>
                </div>
              </div>
            </div>
            <span class="text-xs font-mono text-text-muted shrink-0 bg-bg-elevated/80 px-2 py-1 rounded inline-flex items-center gap-1"><img :src="tw.eyes" class="w-3.5 h-3.5" />{{ getTeamMembers(team.id).length }}</span>
          </div>

          <!-- Member slots grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <div v-for="member in getTeamMembers(team.id)" :key="member.id" @click.stop="openUserProfile(member)" class="flex items-center gap-2 px-3 py-2.5 bg-bg-elevated/60 border border-border-subtle rounded-lg cursor-pointer hover:border-accent/40 transition-colors">
              <img :src="assetUrl(member.avatar) || getGitHubAvatar(member.githubId)" class="w-7 h-7 rounded-full shrink-0 object-cover" />
              <div class="min-w-0">
                <span v-if="member.id === team.leaderId" class="flex items-center gap-0.5 text-xs font-semibold leading-tight text-badge-warning-text"><img :src="tw.crown" class="w-3 h-3" /> {{ pick('Lead', '队长') }}</span>
                <span class="text-xs text-text-secondary truncate block">{{ member.name }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom -->
          <div class="mt-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
              <a v-if="team.githubRepo" :href="team.githubRepo" target="_blank" @click.stop class="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors">
                <img :src="tw.link" class="w-3.5 h-3.5" /> {{ pick('Repo', '仓库') }}
              </a>
              <span v-if="team.locked" class="inline-flex items-center gap-0.5 text-xs text-text-muted">
                <img :src="tw.lock" class="w-3 h-3" /> {{ pick('Locked', '已锁定') }}
              </span>
            </div>
            <button
              @click="handleLike(team.id, $event)"
              class="inline-flex items-center gap-1 text-xs transition-colors"
              :class="likedTeams.has(team.id) ? 'text-red-500' : 'text-text-muted hover:text-red-400'"
            >
              <img :src="tw.heart" class="w-4 h-4" :class="likedTeams.has(team.id) ? '' : 'opacity-30 grayscale'" />
              {{ team.likes || 0 }}
            </button>
          </div>

          <!-- Project idea -->
          <p v-if="team.projectIdea" class="mt-3 pt-3 border-t border-border-subtle text-xs text-text-secondary leading-relaxed line-clamp-2 italic flex items-start gap-1.5"><img :src="tw.bulb" class="w-3.5 h-3.5 shrink-0 mt-0.5" /> "{{ team.projectIdea }}"</p>
        </div>
      </div>

      <div v-if="!teams.length" class="text-center py-16">
        <p class="text-text-secondary">{{ t('teams.noTeams') }}</p>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showModal = false"></div>

          <div class="relative w-full max-w-lg glass-card p-8 max-h-[90vh] overflow-y-auto border-accent-red/20">
            <button @click="showModal = false" class="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <!-- CREATE MODE -->
            <template v-if="modalMode === 'create'">
              <h3 class="text-2xl font-bold text-text-primary mb-6">{{ t('teams.createTitle') }}</h3>

              <!-- Not logged in -->
              <div v-if="!isLoggedIn" class="text-center py-8">
                <p class="text-text-secondary mb-4">{{ pick('Register to create your team', '注册后即可创建队伍') }}</p>
                <button @click="showModal = false; promptAuth('register')" class="px-6 py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">
                  {{ pick('Register', '注册') }}
                </button>
              </div>

              <!-- Logged in: create form -->
              <template v-else>
                <div v-if="error" class="mb-4 p-3 bg-badge-danger-bg border border-accent-red/30 text-red-600 text-sm">{{ error }}</div>

                <form @submit.prevent="submitCreate" class="space-y-5">
                  <div>
                    <label class="block text-sm text-text-secondary mb-1">{{ t('teams.teamName') }} <span class="text-accent-red">*</span></label>
                    <input v-model="teamName" type="text" required :placeholder="pick('e.g. AgentX', '例如：AgentX')" :class="inputClass" />
                  </div>
                  <!-- Team Avatar -->
                  <div>
                    <label class="block text-sm text-text-secondary mb-2">{{ t('teams.teamAvatar') }}</label>
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-14 rounded-[10px] border-2 border-border overflow-hidden shrink-0 flex items-center justify-center bg-bg-card">
                        <img :src="teamAvatar || defaultAvatar()" class="w-full h-full object-cover rounded-[24px]" :class="(!teamAvatar) ? 'dark:invert' : ''" />
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <button v-if="false" v-for="preset in avatarPresets" :key="preset.id" type="button" @click="selectAvatar(preset)" class="w-10 h-10 rounded-[10px] border-2 overflow-hidden transition-all flex items-center justify-center bg-bg-card p-1" :class="teamAvatar === preset.src ? 'border-accent-red scale-110' : 'border-border hover:border-border-hover'">
                          <img :src="preset.src" class="max-w-full max-h-full object-contain rounded-[10px]" />
                        </button>
                        <label class="w-10 h-10 rounded-[10px] border-2 border-dashed border-border-hover hover:border-border-strong flex items-center justify-center cursor-pointer transition-all overflow-hidden" :class="teamAvatar && !avatarPresets.some(p => p.src === teamAvatar) ? 'border-accent-red' : ''">
                          <img v-if="teamAvatar && !avatarPresets.some(p => p.src === teamAvatar)" :src="teamAvatar" class="w-full h-full object-cover" />
                          <span v-else class="text-text-tertiary text-sm">+</span>
                          <input type="file" accept="image/*" class="hidden" @change="uploadTeamAvatar($event)" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm text-text-secondary mb-1">{{ t('teams.githubRepo') }} <span class="text-accent-red">*</span></label>
                    <input v-model="githubRepo" type="url" required placeholder="https://github.com/your-org/project" :class="inputClass" />
                  </div>

                  <div>
                    <label class="block text-sm text-text-secondary mb-2">{{ t('teams.track') }} <span class="text-text-secondary text-xs">{{ pick('(multi-select)', '（可多选）') }}</span></label>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="track in tracks"
                        :key="track.id"
                        type="button"
                        @click="toggleTrack(track.id)"
                        class="flex items-center gap-2 px-3 py-2.5 border text-left transition-all text-sm"
                        :class="selectedTracks.includes(track.id) ? 'bg-accent/10 border-accent/50 text-text-primary' : 'border-border text-text-secondary hover:border-border-hover'"
                      >
                        <img :src="track.icon" class="w-4 h-4 shrink-0 theme-icon" />
                        <span class="truncate">{{ track.label }}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm text-text-secondary mb-1">{{ t('teams.aiModels') }}</label>
                    <p class="text-xs text-badge-warning-text mb-2">{{ pick('Your team will receive API tokens from the model provider you select.', '你的队伍将获得所选模型服务商提供的 API Token。') }}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button v-for="model in modelOptions" :key="model.id" type="button" @click="selectModel(model.id)" class="flex-1 flex items-center justify-center gap-2 py-3 border transition-all" :class="selectedModel === model.id ? 'bg-accent/10 border-accent/50 text-text-primary' : 'border-border text-text-secondary hover:border-border-hover'">
                        <img v-if="model.icon" :src="model.icon" class="w-5 h-5 rounded-[10px]" />
                        <span class="text-sm font-semibold">{{ model.label }}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm text-text-secondary mb-1">{{ t('teams.harness') }}</label>
                    <select v-model="selectedHarness" :class="inputClass">
                      <option value="">{{ t('teams.optional') }}</option>
                      <option v-for="option in (t('teams.harnessOptions') as string[])" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm text-text-secondary mb-1">{{ t('teams.projectIdea') }} <span class="text-text-secondary text-xs">{{ t('teams.optional') }}</span></label>
                    <textarea v-model="projectIdea" rows="2" :placeholder="pick('Briefly describe what you plan to build...', '简要描述你计划构建的内容……')" :class="[inputClass, 'resize-none']"></textarea>
                  </div>

                  <!-- Advanced options toggle -->
                  <button type="button" @click="showAdvanced = !showAdvanced" class="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors">
                    <span>{{ showAdvanced ? '▲' : '▼' }}</span>
                    <span>{{ showAdvanced ? pick('Hide advanced options', '收起高级选项') : pick('More options', '更多选项') }}</span>
                  </button>

                  <div v-if="showAdvanced" class="space-y-5">
                    <!-- Lock toggle -->
                    <label class="flex items-center gap-3 cursor-pointer">
                      <div class="relative">
                        <input type="checkbox" v-model="teamLocked" class="sr-only peer" />
                        <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-accent transition-colors"></div>
                        <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                      </div>
                      <div>
                        <span class="text-sm text-text-primary">{{ t('teams.lockTeam') }}</span>
                        <p class="text-xs text-text-secondary">{{ t('teams.lockTeamDesc') }}</p>
                      </div>
                    </label>
                  </div>

                  <button type="submit" :disabled="loading" class="w-full py-4 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
                    {{ loading ? t('teams.submitting') : t('teams.submitBtn') }}
                  </button>
                </form>
              </template>
            </template>

            <!-- EDIT MODE -->
            <template v-else-if="modalMode === 'edit' && viewingTeam">
              <h3 class="text-2xl font-bold text-text-primary mb-6">{{ pick('Edit Team', '编辑队伍') }}</h3>
              <div v-if="error" class="mb-4 p-3 bg-badge-danger-bg border border-accent-red/30 text-red-600 text-sm">{{ error }}</div>

              <form @submit.prevent="submitEdit" class="space-y-5">
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ t('teams.teamName') }} <span class="text-accent-red">*</span></label>
                  <input v-model="teamName" type="text" required :placeholder="pick('e.g. AgentX', '例如：AgentX')" :class="inputClass" />
                </div>
                <!-- Team Avatar -->
                <div>
                  <label class="block text-sm text-text-secondary mb-2">{{ t('teams.teamAvatar') }}</label>
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-[10px] border-2 border-border overflow-hidden shrink-0 flex items-center justify-center bg-bg-card">
                      <img :src="teamAvatar || defaultAvatar()" class="max-w-[80%] max-h-[80%] object-contain" />
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <button v-if="false" v-for="preset in avatarPresets" :key="preset.id" type="button" @click="teamAvatar = preset.src" class="w-10 h-10 rounded-[10px] border-2 overflow-hidden transition-all flex items-center justify-center bg-bg-card p-1" :class="teamAvatar === preset.src ? 'border-accent-red scale-110' : 'border-border hover:border-border-hover'">
                        <img :src="preset.src" class="max-w-full max-h-full object-contain rounded-[10px]" />
                      </button>
                      <label class="w-10 h-10 rounded-[10px] border-2 border-dashed border-border-hover hover:border-border-strong flex items-center justify-center cursor-pointer transition-all overflow-hidden" :class="teamAvatar && !avatarPresets.some(p => p.src === teamAvatar) ? 'border-accent-red' : ''">
                        <img v-if="teamAvatar && !avatarPresets.some(p => p.src === teamAvatar)" :src="teamAvatar" class="w-full h-full object-cover" />
                        <span v-else class="text-text-tertiary text-sm">+</span>
                        <input type="file" accept="image/*" class="hidden" @change="uploadTeamAvatar($event)" />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ t('teams.githubRepo') }} <span class="text-accent-red">*</span></label>
                  <input v-model="githubRepo" type="url" required placeholder="https://github.com/your-org/project" :class="inputClass" />
                </div>

                <div>
                  <label class="block text-sm text-text-secondary mb-2">{{ t('teams.track') }} <span class="text-text-secondary text-xs">{{ pick('(multi-select)', '（可多选）') }}</span></label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="track in tracks"
                      :key="track.id"
                      type="button"
                      @click="toggleTrack(track.id)"
                      class="flex items-center gap-2 px-3 py-2.5 border text-left transition-all text-sm"
                      :class="selectedTracks.includes(track.id) ? 'bg-accent/10 border-accent/50 text-text-primary' : 'border-border text-text-secondary hover:border-border-hover'"
                    >
                      <img :src="track.icon" class="w-4 h-4 shrink-0 theme-icon" />
                      <span class="truncate">{{ track.label }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm text-text-secondary mb-2">{{ t('teams.aiModels') }}</label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button v-for="model in modelOptions" :key="model.id" type="button" @click="selectModel(model.id)" class="flex-1 flex items-center justify-center gap-2 py-3 border transition-all" :class="selectedModel === model.id ? 'bg-accent/10 border-accent/50 text-text-primary' : 'border-border text-text-secondary hover:border-border-hover'">
                      <img v-if="model.icon" :src="model.icon" class="w-5 h-5 rounded-[10px]" />
                      <span class="text-sm font-semibold">{{ model.label }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ t('teams.harness') }}</label>
                  <select v-model="selectedHarness" :class="inputClass">
                    <option value="">{{ t('teams.optional') }}</option>
                    <option v-for="option in (t('teams.harnessOptions') as string[])" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ t('teams.projectIdea') }} <span class="text-text-secondary text-xs">{{ t('teams.optional') }}</span></label>
                  <textarea v-model="projectIdea" rows="2" :placeholder="pick('Briefly describe what you plan to build...', '简要描述你计划构建的内容……')" :class="[inputClass, 'resize-none']"></textarea>
                </div>

                <!-- Advanced options toggle -->
                <button type="button" @click="showAdvanced = !showAdvanced" class="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors">
                  <span>{{ showAdvanced ? '▲' : '▼' }}</span>
                  <span>{{ showAdvanced ? pick('Hide advanced options', '收起高级选项') : pick('More options', '更多选项') }}</span>
                </button>

                <div v-if="showAdvanced" class="space-y-5">
                  <!-- Lock toggle -->
                  <label class="flex items-center gap-3 cursor-pointer">
                    <div class="relative">
                      <input type="checkbox" v-model="teamLocked" class="sr-only peer" />
                      <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-accent transition-colors"></div>
                      <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <div>
                      <span class="text-sm text-text-primary">{{ t('teams.lockTeam') }}</span>
                      <p class="text-xs text-text-secondary">{{ t('teams.lockTeamDesc') }}</p>
                    </div>
                  </label>
                </div>

                <button type="submit" :disabled="loading" class="w-full py-4 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
                  {{ loading ? pick('Saving...', '正在保存……') : pick('Save Changes', '保存修改') }}
                </button>
              </form>
            </template>

            <!-- VIEW MODE -->
            <template v-else-if="modalMode === 'view' && viewingTeam">
              <div class="flex items-center gap-4 mb-6">
                <img :src="assetUrl(viewingTeam.avatar) || assetUrl('/default-avatar.svg')" class="w-16 h-16 rounded-[10px] object-cover border border-border" />
                <div>
                  <h3 class="text-2xl font-bold text-text-primary">{{ viewingTeam.name }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-sm text-text-secondary">{{ getTeamMembers(viewingTeam.id).length }} {{ pick('members', '名成员') }}</span>
                    <span v-if="viewingTeam.locked" class="inline-flex items-center gap-0.5 rounded bg-badge-neutral-bg px-1.5 py-0.5 text-xs text-text-tertiary">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                      {{ pick('Locked', '已锁定') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Tracks -->
              <div v-if="viewingTeam.themes?.length" class="flex flex-wrap gap-2 mb-4">
                <span v-for="theme in viewingTeam.themes" :key="theme" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-badge-neutral-bg text-xs text-text-tertiary">
                  <img v-if="getTrackIcon(theme)" :src="getTrackIcon(theme)" class="w-3.5 h-3.5 theme-icon" />
                  {{ getTrackLabel(theme) }}
                </span>
              </div>

              <!-- Model -->
              <div v-if="viewingTeam.model" class="flex gap-2 mb-4">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-badge-neutral-bg text-xs text-text-tertiary">
                  <img v-if="getModelIcon(viewingTeam.model)" :src="getModelIcon(viewingTeam.model)" class="w-4 h-4 rounded" />
                  {{ viewingTeam.model }}
                </div>
                <div v-if="viewingTeam.harness" class="inline-flex items-center px-2.5 py-1 rounded-full bg-badge-neutral-bg text-xs text-text-tertiary">
                  {{ viewingTeam.harness }}
                </div>
              </div>

              <!-- Project Idea -->
              <div v-if="viewingTeam.projectIdea" class="mb-6 p-4 bg-bg-elevated">
                <p class="text-xs text-text-muted uppercase tracking-wider mb-2 font-semibold">{{ t('teams.projectIdeaLabel') }}</p>
                <p class="text-sm text-text-secondary leading-relaxed">"{{ viewingTeam.projectIdea }}"</p>
              </div>

              <!-- Members -->
              <div class="mb-6">
                <p class="text-xs text-text-muted uppercase tracking-wider mb-3 font-semibold">{{ t('teams.membersLabel') }}</p>
                <div class="space-y-3">
                  <div v-for="member in getTeamMembers(viewingTeam.id)" :key="member.id" class="flex items-center gap-3 p-3 bg-bg-elevated">
                    <img :src="assetUrl(member.avatar) || getGitHubAvatar(member.githubId)" class="w-8 h-8 rounded-full shrink-0 object-cover border border-border" />
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-semibold text-text-primary">{{ member.name }}</span>
                      <span v-if="member.id === viewingTeam.leaderId" class="ml-1 text-xs text-badge-warning-text">{{ t('teams.lead') }}</span>
                      <span v-if="member.role" class="text-xs text-text-secondary ml-2">{{ roleLabel(member.role) }}</span>
                    </div>
                    <a v-if="member.githubId" :href="'https://github.com/' + member.githubId.replace(/^@/, '')" target="_blank" @click.stop class="text-xs text-text-secondary hover:text-accent transition-colors">@{{ member.githubId.replace(/^@/, '') }}</a>
                    <button
                      v-if="isTeamLeader(viewingTeam) && member.id !== user?.id"
                      @click.stop="handleKickMember(viewingTeam.id, member.id, member.name)"
                      class="text-xs text-text-tertiary hover:text-accent-red transition-colors ml-2"
                      :title="pick('Remove from team', '移出队伍')"
                    >✕</button>
                  </div>
                </div>
              </div>

              <!-- GitHub Repo -->
              <a v-if="viewingTeam.githubRepo" :href="viewingTeam.githubRepo" target="_blank" @click.stop class="inline-flex items-center gap-2 mb-6 text-sm text-text-secondary hover:text-accent transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                {{ viewingTeam.githubRepo }}
              </a>

              <!-- Action buttons -->
              <div class="flex gap-3">
                <button
                  @click="handleLike(viewingTeam.id, $event)"
                  class="flex-1 py-3 border transition-all flex items-center justify-center gap-2 text-sm"
                  :class="likedTeams.has(viewingTeam.id) ? 'border-accent-red/30 bg-badge-danger-bg text-red-500' : 'border-border text-text-secondary hover:border-border-hover'"
                >
                  <svg class="w-4 h-4" :fill="likedTeams.has(viewingTeam.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                  {{ viewingTeam.likes || 0 }}
                </button>

                <!-- Join: logged in, team open, user has no team -->
                <button
                  v-if="isLoggedIn && canJoin(viewingTeam) && !userHasTeam() && !hasPendingRequest(viewingTeam)"
                  @click="handleJoinTeam(viewingTeam.id)"
                  :disabled="loading"
                  class="flex-[2] py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50"
                >
                  {{ loading ? pick('Sending...', '正在发送……') : pick('Request to Join', '申请加入') }}
                </button>
                <!-- Already requested -->
                <div v-else-if="isLoggedIn && hasPendingRequest(viewingTeam)" class="flex-[2] flex gap-2">
                  <span class="flex-1 py-3 text-center text-sm text-badge-warning-text border border-border-hover">{{ pick('Pending Approval', '等待审批') }}</span>
                  <button @click="handleCancelJoin(viewingTeam.id)" :disabled="loading" class="px-4 py-3 text-sm border border-border text-text-secondary hover:text-accent-red hover:border-accent-red/50 transition-colors">{{ pick('Cancel', '取消') }}</button>
                </div>
                <!-- Has team or other pending -->
                <span
                  v-else-if="isLoggedIn && userHasTeam() && canJoin(viewingTeam)"
                  class="flex-[2] py-3 text-center text-xs text-text-muted border border-border"
                >
                  {{ pick('Cancel your current application first', '请先取消当前申请') }}
                </span>

                <!-- Not logged in: register to join -->
                <button v-else-if="!isLoggedIn && canJoin(viewingTeam)" @click="showModal = false; promptAuth('register')" class="flex-[2] py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">
                  {{ pick('Register to Join', '注册并申请加入') }}
                </button>

                <!-- Locked -->
                <span v-else-if="viewingTeam.locked" class="flex-[2] py-3 text-center text-sm text-text-muted border border-border">
                  {{ t('teams.notAccepting') }}
                </span>
              </div>

              <!-- Member actions: leave -->
              <div v-if="isLoggedIn && isTeamMember(viewingTeam) && !isTeamLeader(viewingTeam)" class="mt-3">
                <button
                  @click="handleLeaveTeam"
                  :disabled="loading"
                  class="w-full py-3 border border-accent-red/30 text-red-500 text-sm font-semibold hover:bg-badge-danger-bg transition-colors disabled:opacity-50"
                >
                  {{ loading ? pick('Leaving...', '正在退出……') : pick('Leave Team', '退出队伍') }}
                </button>
              </div>

              <!-- Pending join requests (leader only) -->
              <div v-if="isLoggedIn && isTeamLeader(viewingTeam) && viewingTeam.pendingUsers?.length" class="mt-4 p-4 border border-border-hover bg-badge-warning-bg/30">
                <p class="text-xs text-badge-warning-text uppercase tracking-wider mb-3 font-semibold">{{ pick('Pending Requests', '待处理申请') }}（{{ viewingTeam.pendingUsers.length }}）</p>
                <div class="space-y-2">
                  <div v-for="pu in viewingTeam.pendingUsers" :key="pu.id" class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 min-w-0">
                      <img :src="assetUrl(pu.avatar) || getGitHubAvatar(pu.githubId)" class="w-6 h-6 rounded-full shrink-0 object-cover" />
                      <span class="text-sm text-text-primary truncate">{{ pu.name }}</span>
                      <span v-if="pu.role" class="truncate text-xs text-text-muted">{{ roleLabel(pu.role) }}</span>
                    </div>
                    <div class="flex gap-2 shrink-0">
                      <button @click="handleApprove(viewingTeam.id, pu.id)" class="px-3 py-1 text-xs bg-badge-success-bg text-badge-success-text font-semibold hover:opacity-80 transition-opacity">{{ pick('Approve', '通过') }}</button>
                      <button @click="handleReject(viewingTeam.id, pu.id)" class="px-3 py-1 text-xs bg-badge-danger-bg text-badge-danger-text font-semibold hover:opacity-80 transition-opacity">{{ pick('Decline', '拒绝') }}</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Leader actions: edit + delete -->
              <div v-if="isLoggedIn && isTeamLeader(viewingTeam)" class="mt-3 flex gap-3">
                <button
                  @click="openEditModal"
                  class="flex-1 py-3 border border-border text-text-secondary text-sm font-semibold hover:bg-bg-elevated transition-colors"
                >
                  {{ pick('Edit Team', '编辑队伍') }}
                </button>
                <button
                  @click="handleDeleteTeam"
                  :disabled="loading"
                  class="flex-1 py-3 border border-accent-red/30 text-red-500 text-sm font-semibold hover:bg-badge-danger-bg transition-colors disabled:opacity-50"
                >
                  {{ loading ? pick('Deleting...', '正在删除……') : pick('Delete Team', '删除队伍') }}
                </button>
              </div>

              <!-- Leader leave (dissolve note) -->
              <div v-if="isLoggedIn && isTeamLeader(viewingTeam)" class="mt-2">
                <p class="text-center text-xs text-text-secondary">{{ pick('As team leader, delete the team to leave.', '队长需要解散队伍后才能退出。') }}</p>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- User Profile Modal (read-only, for viewing others) -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
        <div v-if="showUserProfileModal && viewingUser" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showUserProfileModal = false" />
          <div class="relative w-full max-w-sm p-8 bg-bg-primary border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button @click="showUserProfileModal = false" class="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="flex flex-col items-center text-center mb-6">
              <img :src="assetUrl(viewingUser.avatar) || getGitHubAvatar(viewingUser.githubId)" class="w-20 h-20 rounded-full object-cover mb-3 border-2 border-border" />
              <h3 class="text-lg font-bold text-text-primary">{{ viewingUser.name }}</h3>
              <p v-if="viewingUser.role" class="text-sm text-text-secondary">{{ roleLabel(viewingUser.role) }}</p>
            </div>
            <div v-if="viewingUser.bio" class="mb-4">
              <p class="text-xs text-text-muted uppercase tracking-wider mb-1">{{ pick('Bio', '个人简介') }}</p>
              <p class="text-sm text-text-secondary">{{ viewingUser.bio }}</p>
            </div>
            <div v-if="viewingUser.themes?.length" class="mb-4">
              <p class="text-xs text-text-muted uppercase tracking-wider mb-2">{{ pick('Capability Domains', '能力域') }}</p>
              <div class="flex flex-wrap gap-1">
                <span v-for="theme in viewingUser.themes" :key="theme" class="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">{{ trackLabel(theme) }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <a v-if="viewingUser.githubId" :href="`https://github.com/${viewingUser.githubId.replace(/^@/, '')}`" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <span class="truncate">{{ viewingUser.githubId }}</span>
              </a>
              <p v-if="viewingUser.discord" class="flex items-center gap-2 text-sm text-text-secondary">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                <span class="truncate">{{ viewingUser.discord }}</span>
              </p>
              <a v-if="viewingUser.twitter" :href="`https://x.com/${viewingUser.twitter.replace(/^@/, '')}`" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span class="truncate">{{ viewingUser.twitter }}</span>
              </a>
              <p v-if="viewingUser.telegram" class="flex items-center gap-2 text-sm text-text-secondary">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span class="truncate">{{ viewingUser.telegram }}</span>
              </p>
              <a v-if="viewingUser.linkedin" :href="viewingUser.linkedin.startsWith('http') ? viewingUser.linkedin : `https://linkedin.com/in/${viewingUser.linkedin}`" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span class="truncate">{{ viewingUser.linkedin }}</span>
              </a>
              <a v-if="viewingUser.website" :href="viewingUser.website" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                <span class="truncate">{{ viewingUser.website }}</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.team-card-breathe {
  animation: card-breathe 4s ease-in-out infinite;
  transition: transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s;
}
.team-card-breathe:nth-child(2n) { animation-delay: -1s; }
.team-card-breathe:nth-child(3n) { animation-delay: -2s; }
.team-card-breathe:nth-child(4n) { animation-delay: -3s; }
@keyframes card-breathe {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04);
    border-color: rgba(107, 114, 128, 0.4);
  }
  50% {
    box-shadow: 0 0 16px rgba(212,160,23,0.08), inset 0 1px 0 rgba(255,255,255,0.08);
    border-color: rgba(212, 160, 23, 0.25);
  }
}
</style>
