<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import { useAuth } from '../../composables/useAuth'
import { useTheme } from '../../composables/useTheme'
import { useTeams } from '../../composables/useTeams'
import { assetUrl, publicSiteUrl } from '../../composables/api'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'

const { t, locale, pick, roleLabel, trackLabel, toggleLocale } = useI18n()
const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.path === '/')
const { user, isLoggedIn, login, register, logout, updateProfile, changePassword, sendPasswordReset, error: authError, showAuthModal, authModalTab, showChangePasswordModal } = useAuth()
const newPassword = ref('')
const confirmPassword = ref('')
const changePwError = ref('')
async function handleChangePassword() {
  changePwError.value = ''
  if (newPassword.value.length < 6) { changePwError.value = pick('Password must be at least 6 characters', '密码至少需要 6 个字符'); return }
  if (newPassword.value !== confirmPassword.value) { changePwError.value = pick('Passwords do not match', '两次输入的密码不一致'); return }
  const ok = await changePassword(newPassword.value)
  if (ok) {
    newPassword.value = ''
    confirmPassword.value = ''
    showHeaderToast(pick('Password changed!', '密码已修改'))
  } else {
    changePwError.value = authError.value || pick('Failed to change password', '密码修改失败')
  }
}
const { isDark, toggleTheme } = useTheme()
const { createTeam, teams, approveJoin, rejectJoin, cancelJoin } = useTeams()

const myTeam = computed(() =>
  teams.value.find(t => t.id === user.value?.teamId) ||
  teams.value.find(t => t.pendingJoins?.includes(user.value?.id ?? ''))
)
const myPendingTeams = computed(() =>
  teams.value.filter(t =>
    t.pendingJoins?.includes(user.value?.id ?? '') &&
    t.id !== user.value?.teamId
  )
)
const pendingCount = computed(() => {
  if (!myTeam.value || myTeam.value.leaderId !== user.value?.id) return 0
  return myTeam.value.pendingJoins?.length ?? 0
})

const headerToast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
let headerToastTimer: number | undefined
function showHeaderToast(msg: string, type: 'success' | 'error' = 'success') {
  headerToast.value = { msg, type }
  clearTimeout(headerToastTimer)
  headerToastTimer = window.setTimeout(() => headerToast.value = null, 4000)
}

async function handleApprove(teamId: string, userId: string) {
  await approveJoin(teamId, userId)
}
async function handleReject(teamId: string, userId: string) {
  await rejectJoin(teamId, userId)
}
async function handleCancelJoin(teamId: string) {
  const ok = await cancelJoin(teamId)
  showHeaderToast(ok ? pick('Application cancelled.', '申请已取消') : pick('Failed to cancel', '取消失败'), ok ? 'success' : 'error')
}

const scrolled = ref(false)
const mobileOpen = ref(false)

const navItems = computed(() => [
  { label: t('nav.about'), href: '#about' },
  { label: t('nav.themes'), href: '#themes' },
  { label: t('nav.schedule'), href: '#schedule' },
  { label: t('nav.awards'), href: '#awards' },
])

function onScroll() {
  scrolled.value = window.scrollY > 50
}

async function scrollTo(href: string) {
  mobileOpen.value = false
  await router.push({ path: '/', hash: href })
  await nextTick()
  window.requestAnimationFrame(() => {
    const el = document.querySelector(href)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 64
    window.scrollTo({ top, behavior: 'smooth' })
  })
}

function handleOpenProfileEvent() { openProfileModal() }
onMounted(() => { window.addEventListener('scroll', onScroll); window.addEventListener('open-profile-modal', handleOpenProfileEvent) })
onUnmounted(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('open-profile-modal', handleOpenProfileEvent) })

// Auth modal uses shared state from useAuth (showAuthModal, authModalTab)

// Login form
const loginEmail = ref('')
const loginPassword = ref('')

// Register form
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regGithubId = ref('')
const regRole = ref('')
const regDiscord = ref('')
const regTwitter = ref('')
const regTelegram = ref('')
const regLinkedin = ref('')
const regWebsite = ref('')
const regLookingForTeam = ref(false)
const regWantCreateTeam = ref(false)
const regTeamName = ref('')
const regTeamTracks = ref<string[]>([])
const regTeamGithubRepo = ref('')
const regTeamModel = ref('')
const regTeamHarness = ref('')
const regTeamProjectIdea = ref('')
const regTeamLocked = ref(false)

const registrationTrackIds = ['auth-session', 'repository-lifecycle', 'issues-forms', 'pull-request-review', 'actions-workflow', 'org-permissions-audit', 'compute-engine']
const regTrackOptions = computed(() => (t('tracks.themes') as any[]).map((theme, i) => ({ id: registrationTrackIds[i], label: theme.title })))

function toggleRegTrack(id: string) {
  const idx = regTeamTracks.value.indexOf(id)
  if (idx >= 0) regTeamTracks.value.splice(idx, 1)
  else regTeamTracks.value.push(id)
}

const roleOptions = computed(() => [
  { value: 'AI Engineer', label: pick('AI Engineer', 'AI 工程师') },
  { value: 'Full-Stack Developer', label: pick('Full-Stack Developer', '全栈开发者') },
  { value: 'Frontend Developer', label: pick('Frontend Developer', '前端开发者') },
  { value: 'Backend Developer', label: pick('Backend Developer', '后端开发者') },
  { value: 'Researcher', label: pick('Researcher', '研究者') },
  { value: 'Designer', label: pick('Designer', '设计师') },
  { value: 'Product Manager', label: pick('Product Manager', '产品经理') },
  { value: 'Student', label: pick('Student', '学生') },
  { value: 'Startup Founder', label: pick('Startup Founder', '创业者') },
  { value: 'Other', label: pick('Other', '其他') },
])

const authLoading = ref(false)

watch(showAuthModal, (open) => {
  if (open) {
    authError.value = ''
    loginEmail.value = ''
    loginPassword.value = ''
    regName.value = ''
    regEmail.value = ''
    regPassword.value = ''
    regGithubId.value = ''
    regRole.value = ''
    regDiscord.value = ''
    regTwitter.value = ''
    regTelegram.value = ''
    regLinkedin.value = ''
    regWebsite.value = ''
    regLookingForTeam.value = false
    regWantCreateTeam.value = false
    regTeamName.value = ''
    regTeamTracks.value = []
    regTeamGithubRepo.value = ''
    regTeamModel.value = ''
    regTeamHarness.value = ''
    regTeamProjectIdea.value = ''
    regTeamLocked.value = false
  }
})

const forgotSent = ref(false)
const registerNeedsConfirm = ref(false)
const confirmedEmail = ref('')

async function submitLogin() {
  authLoading.value = true
  const ok = await login(loginEmail.value, loginPassword.value)
  authLoading.value = false
  if (ok) showAuthModal.value = false
}

async function submitForgot() {
  authLoading.value = true
  forgotSent.value = false
  const ok = await sendPasswordReset(loginEmail.value)
  authLoading.value = false
  if (ok) forgotSent.value = true
}

async function submitRegister() {
  authLoading.value = true
  const ok = await register({
    name: regName.value,
    email: regEmail.value,
    password: regPassword.value,
    githubId: regGithubId.value,
    role: regRole.value,
    avatar: '',
    themes: regWantCreateTeam.value ? regTeamTracks.value : [],
    preferredModel: '',
    bio: '',
    discord: regDiscord.value,
    twitter: regTwitter.value,
    telegram: regTelegram.value,
    linkedin: regLinkedin.value,
    website: regWebsite.value,
    lookingForTeam: regLookingForTeam.value,
  })
  if (ok && regWantCreateTeam.value && regTeamName.value.trim()) {
    await createTeam({
      name: regTeamName.value.trim(),
      avatar: '',
      githubRepo: regTeamGithubRepo.value.trim(),
      themes: regTeamTracks.value,
      model: regTeamModel.value,
      harness: regTeamHarness.value,
      projectIdea: regTeamProjectIdea.value.trim(),
      locked: regTeamLocked.value,
      maxSize: null,
    })
  }
  authLoading.value = false
  if (ok) {
    if (isLoggedIn.value) {
      showAuthModal.value = false
      setTimeout(() => {
        document.getElementById('teams')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } else {
      // 需要邮件确认
      confirmedEmail.value = regEmail.value
      registerNeedsConfirm.value = true
    }
  }
}

function handleLogout() {
  logout()
  mobileOpen.value = false
}

const inputClass = 'w-full px-4 py-2.5  bg-input-bg border border-input-border text-text-primary placeholder-input-placeholder focus:border-accent/50 focus:outline-none transition-colors text-sm'

// User dropdown
const showUserDropdown = ref(false)

// Profile edit modal
const showProfileModal = ref(false)
const profileEditing = ref(false)
const profileName = ref('')
const profileGithubId = ref('')
const profileRole = ref('')
const profileBio = ref('')
const profileThemes = ref<string[]>([])
const profilePreferredModel = ref('')
const profileDiscord = ref('')
const profileTwitter = ref('')
const profileTelegram = ref('')
const profileLinkedin = ref('')
const profileWebsite = ref('')
const profileLookingForTeam = ref(false)
const profileRSVP = ref<string | null>(null)
const profileLoading = ref(false)

const trackOptions = regTrackOptions

const modelChoices = computed(() => [
  { value: 'Kimi', label: 'Kimi' },
  { value: 'GLM', label: 'GLM' },
  { value: 'MiniMax', label: 'MiniMax' },
  { value: 'DeepSeek', label: 'DeepSeek' },
  { value: 'Other', label: pick('Other', '其他') },
])

const showMyTeamModal = ref(false)

function goToMyTeam() {
  showMyTeamModal.value = true
}

const profileQr = ref('')
const myRedeemCode = ref<any>(null)

async function loadMyCode() {
  if (!user.value) { myRedeemCode.value = null; return }
  const { data } = await supabase.from('redeem_codes').select('code, model').eq('assigned_to', user.value.id).eq('status', 'assigned').single()
  myRedeemCode.value = data || null
}

async function openProfileModal() {
  showUserDropdown.value = false
  if (user.value) {
    profileName.value = user.value.name
    profileGithubId.value = user.value.githubId
    profileRole.value = user.value.role
    profileBio.value = user.value.bio || ''
    profileThemes.value = [...(user.value.themes || [])]
    profilePreferredModel.value = user.value.preferredModel || ''
    profileDiscord.value = user.value.discord || ''
    profileTwitter.value = user.value.twitter || ''
    profileTelegram.value = user.value.telegram || ''
    profileLinkedin.value = user.value.linkedin || ''
    profileWebsite.value = user.value.website || ''
    profileLookingForTeam.value = user.value.lookingForTeam
    profileRSVP.value = user.value.confirmedAttendance
    profileQr.value = await QRCode.toDataURL(publicSiteUrl(`/profile/${user.value.id}`), {
      width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' },
    })
  }
  profileEditing.value = false
  showProfileModal.value = true
  loadMyCode()
}

function toggleProfileTheme(id: string) {
  const idx = profileThemes.value.indexOf(id)
  if (idx >= 0) profileThemes.value.splice(idx, 1)
  else profileThemes.value.push(id)
}

async function saveProfile() {
  profileLoading.value = true
  const ok = await updateProfile({
    name: profileName.value,
    githubId: profileGithubId.value,
    role: profileRole.value,
    bio: profileBio.value,
    themes: profileThemes.value,
    preferredModel: profilePreferredModel.value,
    discord: profileDiscord.value,
    twitter: profileTwitter.value,
    telegram: profileTelegram.value,
    linkedin: profileLinkedin.value,
    website: profileWebsite.value,
    lookingForTeam: profileLookingForTeam.value,
    confirmedAttendance: profileRSVP.value,
  })
  profileLoading.value = false
  if (ok) profileEditing.value = false
}
</script>

<template>
  <header
    class="site-header fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-200"
    :class="!isHome || scrolled || mobileOpen ? 'is-scrolled bg-bg-primary border-border' : 'border-white/25 bg-transparent'"
  >
    <div class="max-w-[1440px] mx-auto px-6 md:px-10 xl:px-14 h-16 flex items-center justify-between">
      <router-link to="/" class="flex min-w-0 items-center gap-3 group">
        <span class="shrink-0 text-lg font-semibold tracking-[-0.05em] text-text-primary">OAIC</span>
        <span class="h-5 w-px shrink-0 bg-border"></span>
        <span
          class="font-mono uppercase leading-[1.35] text-text-tertiary"
          :class="locale === 'zh'
            ? 'whitespace-nowrap text-xs tracking-[0.1em]'
            : 'max-w-[18rem] line-clamp-2 text-[11px] tracking-[0.08em] sm:text-xs sm:tracking-[0.1em]'"
        >{{ t('hero.system') }}</span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="hidden lg:flex items-center gap-3 xl:gap-4">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="router.resolve({ path: '/', hash: item.href }).href"
          @click.prevent="scrollTo(item.href)"
          class="inline-flex h-10 items-center font-mono text-xs uppercase tracking-[0.06em] text-text-tertiary transition-colors hover:text-accent cursor-pointer"
        >
          {{ item.label }}
        </a>
        <router-link
          to="/bootcamp"
          class="inline-flex h-10 items-center font-mono text-xs uppercase tracking-[0.06em] text-text-tertiary transition-colors hover:text-accent cursor-pointer"
        >
          {{ t('nav.bootcamp') }}
        </router-link>
        <router-link
          to="/rules"
          class="inline-flex h-10 items-center font-mono text-xs uppercase tracking-[0.06em] text-text-tertiary transition-colors hover:text-accent cursor-pointer"
        >
          {{ t('nav.rules') }}
        </router-link>
        <!-- Theme toggle -->
        <button
          @click="toggleTheme"
          class="inline-flex h-10 w-10 items-center justify-center border border-border p-0 text-text-tertiary transition-colors hover:text-text-primary"
          :title="isDark ? pick('Switch to light mode', '切换为浅色模式') : pick('Switch to dark mode', '切换为深色模式')"
        >
          <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <!-- Language toggle -->
        <button
          @click="toggleLocale"
          class="inline-flex h-10 min-w-12 shrink-0 items-center justify-center whitespace-nowrap border border-border px-2 py-0 font-mono text-xs text-text-tertiary transition-colors hover:text-text-primary"
        >
          {{ locale === 'en' ? '中文' : 'EN' }}
        </button>

        <!-- User area -->
        <template v-if="isLoggedIn && user">
          <div class="relative">
            <button @click="showUserDropdown = !showUserDropdown" class="relative flex h-10 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary">
              <span class="relative">
                <img :src="assetUrl(user.avatar) || (user.githubId ? `https://avatars.githubusercontent.com/${user.githubId.replace('@', '')}` : assetUrl('/default-avatar.svg'))" class="w-7 h-7 rounded-full object-cover border border-border" />
                <span v-if="pendingCount > 0" class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-bg-primary bg-accent-red px-1 text-xs font-bold leading-none text-white">{{ pendingCount }}</span>
              </span>
              <span class="max-w-[60px] xl:max-w-[80px] truncate text-xs">{{ user.name }}</span>
            </button>
            <Transition
              enter-active-class="transition-all duration-150"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-100"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showUserDropdown" class="absolute right-0 top-full mt-2 w-44 bg-bg-card border border-border shadow-lg py-1 z-50">
                <button @click="openProfileModal" class="w-full text-left px-4 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                  {{ pick('My Profile', '我的资料') }}
                </button>
                <button v-if="isLoggedIn" @click="goToMyTeam(); showUserDropdown = false" class="w-full text-left px-4 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center justify-between">
                  <span>{{ pick('My Team', '我的队伍') }}</span>
                  <span v-if="pendingCount > 0" class="text-xs bg-accent-red text-white rounded-full px-1.5 py-0.5 leading-none">{{ pendingCount }}</span>
                </button>
                <button @click="handleLogout(); showUserDropdown = false" class="w-full text-left px-4 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                  {{ pick('Logout', '退出登录') }}
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <router-link
          v-if="isLoggedIn && user?.teamId"
          to="/submit"
          class="inline-flex h-10 items-center bg-emerald-600 px-4 py-0 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-emerald-500 whitespace-nowrap"
        >
          {{ pick('SUBMIT PROJECT', '提交项目') }}
        </router-link>
        <a
          v-if="!isLoggedIn || !user?.teamId"
          :href="router.resolve({ path: '/', hash: '#teams' }).href"
          @click.prevent="scrollTo('#teams')"
          class="inline-flex h-10 items-center bg-btn-bg px-4 py-0 text-xs font-semibold uppercase tracking-widest text-btn-text transition-colors hover:bg-btn-hover whitespace-nowrap"
        >
          {{ t('nav.applyNow') }}
        </a>
      </nav>

      <!-- Mobile Toggle -->
      <button
        @click="mobileOpen = !mobileOpen"
        class="inline-flex h-10 w-10 items-center justify-center text-text-secondary lg:hidden"
        :aria-label="mobileOpen ? pick('Close navigation menu', '关闭导航菜单') : pick('Open navigation menu', '打开导航菜单')"
        :aria-expanded="mobileOpen"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div v-if="mobileOpen" class="lg:hidden bg-bg-primary border-t border-border px-6 py-4">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="router.resolve({ path: '/', hash: item.href }).href"
          @click.prevent="scrollTo(item.href)"
          class="block py-3 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          {{ item.label }}
        </a>
        <router-link
          to="/bootcamp"
          @click="mobileOpen = false"
          class="block py-3 text-text-tertiary hover:text-text-primary transition-colors"
        >
          {{ t('nav.bootcamp') }}
        </router-link>
        <router-link
          to="/rules"
          @click="mobileOpen = false"
          class="block py-3 text-text-tertiary hover:text-text-primary transition-colors"
        >
          {{ t('nav.rules') }}
        </router-link>
        <button
          @click="toggleLocale"
          class="block py-3 text-text-tertiary hover:text-text-primary transition-colors font-mono text-sm"
        >
          {{ locale === 'en' ? '切换至中文' : '切换至 English' }}
        </button>

        <!-- Mobile user area -->
        <template v-if="isLoggedIn && user">
          <div class="flex items-center gap-2 py-3 border-t border-border-subtle mt-2">
            <img :src="assetUrl(user.avatar) || (user.githubId ? `https://avatars.githubusercontent.com/${user.githubId.replace('@', '')}` : assetUrl('/default-avatar.svg'))" class="w-7 h-7 rounded-full object-cover border border-border" />
            <span class="text-sm text-text-secondary truncate">{{ user.name }}</span>
          </div>
          <button @click="openProfileModal(); mobileOpen = false" class="block py-3 text-text-tertiary hover:text-text-primary transition-colors text-sm">
            {{ pick('My Profile', '我的资料') }}
          </button>
          <button @click="handleLogout" class="block py-3 text-text-tertiary hover:text-text-primary transition-colors text-sm">
            {{ pick('Logout', '退出登录') }}
          </button>
        </template>
        <a :href="router.resolve({ path: '/', hash: '#teams' }).href" @click.prevent="scrollTo('#teams')" class="mt-4 block text-center px-5 py-3 bg-btn-bg text-btn-text text-xs font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">
          {{ t('nav.applyNow') }}
        </a>
      </div>
    </Transition>
  </header>

  <!-- Auth Modal -->
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showAuthModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showAuthModal = false"></div>

        <div class="relative w-full max-w-md glass-card p-8 max-h-[90vh] overflow-y-auto border-accent-red/20">
          <button @click="showAuthModal = false" class="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- Tabs -->
          <div class="flex gap-6 mb-6 border-b border-border">
            <button
              @click="authModalTab = 'login'; authError = ''"
              class="pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px"
              :class="authModalTab === 'login' ? 'text-text-primary border-accent' : 'text-text-secondary border-transparent hover:text-text-secondary'"
            >
              {{ pick('Login', '登录') }}
            </button>
            <button
              @click="authModalTab = 'register'; authError = ''"
              class="pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px"
              :class="authModalTab === 'register' ? 'text-text-primary border-accent' : 'text-text-secondary border-transparent hover:text-text-secondary'"
            >
              {{ pick('Register', '注册') }}
            </button>
          </div>

          <div v-if="authError" class="mb-4 p-3  bg-badge-danger-bg border border-accent-red/30 text-badge-danger-text text-sm">{{ authError }}</div>

          <!-- Login form -->
          <form v-if="authModalTab === 'login'" @submit.prevent="submitLogin" class="space-y-5">
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Email', '邮箱') }} <span class="text-accent-red">*</span></label>
              <input v-model="loginEmail" type="email" required placeholder="your@email.com" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Password', '密码') }} <span class="text-accent-red">*</span></label>
              <input v-model="loginPassword" type="password" required :placeholder="pick('Password', '密码')" :class="inputClass" />
            </div>
            <button type="submit" :disabled="authLoading" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
              {{ authLoading ? pick('Logging in...', '正在登录……') : pick('Login', '登录') }}
            </button>
            <p class="text-center text-xs text-text-secondary mt-1">
              <button type="button" @click="authModalTab = 'forgot'; authError = ''" class="text-accent hover:underline">{{ pick('Forgot password?', '忘记密码？') }}</button>
            </p>
            <p class="text-center text-xs text-text-secondary">
              {{ pick("Don't have an account?", '还没有账号？') }}
              <button type="button" @click="authModalTab = 'register'; authError = ''" class="text-accent hover:underline">{{ pick('Register', '注册') }}</button>
            </p>
          </form>

          <!-- Forgot password form -->
          <div v-else-if="authModalTab === 'forgot'" class="space-y-5">
            <p class="text-sm text-text-secondary">{{ pick("Enter your email and we'll send you a reset link.", '输入邮箱，我们会向你发送密码重置链接。') }}</p>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Email', '邮箱') }}</label>
              <input v-model="loginEmail" type="email" required placeholder="your@email.com" :class="inputClass" />
            </div>
            <div v-if="forgotSent" class="text-green-400 text-sm text-center">{{ pick('Reset email sent! Check your inbox.', '重置邮件已发送，请检查收件箱。') }}</div>
            <button type="button" :disabled="authLoading" @click="submitForgot" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
              {{ authLoading ? pick('Sending...', '正在发送……') : pick('Send Reset Link', '发送重置链接') }}
            </button>
            <p class="text-center text-xs text-text-secondary">
              <button type="button" @click="authModalTab = 'login'; authError = ''" class="text-accent hover:underline">{{ pick('Back to login', '返回登录') }}</button>
            </p>
          </div>

          <!-- Register form -->
          <form v-else @submit.prevent="submitRegister" class="space-y-5">
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Name', '姓名') }} <span class="text-accent-red">*</span></label>
              <input v-model="regName" type="text" required :placeholder="pick('Your name', '你的姓名')" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Email', '邮箱') }} <span class="text-accent-red">*</span></label>
              <input v-model="regEmail" type="email" required placeholder="your@email.com" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Password', '密码') }} <span class="text-accent-red">*</span></label>
              <input v-model="regPassword" type="password" required :placeholder="pick('Password', '密码')" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('GitHub Username', 'GitHub 用户名') }} <span class="text-accent-red">*</span></label>
              <input v-model="regGithubId" type="text" required placeholder="e.g. octocat" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Role', '角色') }}</label>
              <select v-model="regRole" :class="[inputClass, 'appearance-none']">
                <option value="" class="bg-bg-primary text-text-secondary">{{ pick('Select role (optional)', '选择角色（选填）') }}</option>
                <option v-for="r in roleOptions" :key="r.value" :value="r.value" class="bg-bg-primary">{{ r.label }}</option>
              </select>
            </div>
            <!-- Social links with stronger guidance -->
            <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span class="text-sm font-medium text-text-primary">{{ pick('Connect with teammates', '方便队友联系你') }}</span>
                <span class="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">{{ pick('recommended', '推荐填写') }}</span>
              </div>
              <p class="text-xs text-text-tertiary mb-3">{{ pick('Add at least one way for teammates to reach you', '建议至少填写一种联系方式') }}</p>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      Discord
                    </label>
                    <input v-model="regDiscord" type="text" placeholder="username" :class="[inputClass, regDiscord ? 'border-emerald-500/50' : '']" />
                  </div>
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Twitter / X
                    </label>
                    <input v-model="regTwitter" type="text" placeholder="@handle" :class="[inputClass, regTwitter ? 'border-emerald-500/50' : '']" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </label>
                    <input v-model="regTelegram" type="text" placeholder="@username" :class="[inputClass, regTelegram ? 'border-emerald-500/50' : '']" />
                  </div>
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </label>
                    <input v-model="regLinkedin" type="text" placeholder="yourname" :class="[inputClass, regLinkedin ? 'border-emerald-500/50' : '']" />
                  </div>
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    <svg class="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    {{ pick('Personal Website', '个人网站') }}
                  </label>
                  <input v-model="regWebsite" type="text" placeholder="https://yoursite.com" :class="[inputClass, regWebsite ? 'border-emerald-500/50' : '']" />
                </div>
              </div>
            </div>

            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="regLookingForTeam" class="sr-only peer" @change="regLookingForTeam && (regWantCreateTeam = false)" />
                <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-sm text-text-secondary">{{ pick('Looking for a team', '正在寻找队伍') }}</span>
            </label>

            <!-- Create team option -->
            <div v-if="!regLookingForTeam">
              <label class="flex items-center gap-3 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="regWantCreateTeam" class="sr-only peer" />
                  <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-accent-blue transition-colors"></div>
                  <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                </div>
                <span class="text-sm text-text-secondary">{{ pick('Create a team now', '现在创建队伍') }}</span>
              </label>

              <div v-if="regWantCreateTeam" class="mt-4 space-y-4 pl-4 border-l-2 border-accent-blue/30">
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ pick('Team Name', '队伍名称') }} <span class="text-accent-red">*</span></label>
                  <input v-model="regTeamName" type="text" required :placeholder="pick('e.g. Team Alpha', '例如：启航队')" :class="inputClass" />
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-2">{{ t('teams.track') }} ({{ t('teams.optional') }})</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="track in regTrackOptions"
                      :key="track.id"
                      type="button"
                      @click="toggleRegTrack(track.id)"
                      class="px-2.5 py-1 text-xs border transition-colors"
                      :class="regTeamTracks.includes(track.id) ? 'bg-btn-bg text-btn-text border-btn-bg' : 'border-border text-text-secondary hover:border-border-hover'"
                    >
                      {{ track.label }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ pick('GitHub Repo (optional)', 'GitHub 仓库（选填）') }}</label>
                  <input v-model="regTeamGithubRepo" type="text" placeholder="https://github.com/..." :class="inputClass" />
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ pick('Model (optional)', '模型（选填）') }}</label>
                  <select v-model="regTeamModel" :class="[inputClass, 'appearance-none']">
                    <option value="">{{ pick('Select a model', '选择模型') }}</option>
                    <option v-for="m in modelChoices" :key="m.value" :value="m.value">{{ m.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ t('teams.harness') }}</label>
                  <select v-model="regTeamHarness" :class="[inputClass, 'appearance-none']">
                    <option value="">{{ t('teams.optional') }}</option>
                    <option v-for="option in (t('teams.harnessOptions') as string[])" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-text-secondary mb-1">{{ pick('Project Idea (optional)', '项目想法（选填）') }}</label>
                  <input v-model="regTeamProjectIdea" type="text" :placeholder="pick('One sentence about your idea', '用一句话介绍你的想法')" :class="inputClass" />
                </div>
                <div>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <div class="relative">
                      <input type="checkbox" v-model="regTeamLocked" class="sr-only peer" />
                      <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-accent-blue transition-colors"></div>
                      <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <span class="text-sm text-text-secondary">{{ pick('Lock team (no join requests)', '锁定队伍（不再接受加入申请）') }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-if="registerNeedsConfirm" class="p-4 bg-green-900/30 border border-green-500/30 text-green-300 text-sm text-center">
              {{ pick('A confirmation email has been sent to', '确认邮件已发送至') }} <strong>{{ confirmedEmail }}</strong>{{ pick('. Please check your inbox and click the link to activate your account.', '。请检查收件箱并点击邮件中的链接激活账号。') }}
            </div>
            <template v-else>
              <p v-if="!regLookingForTeam && !regWantCreateTeam" class="text-xs text-badge-warning-text text-center -mt-2">
                {{ pick('Please choose at least one:', '请至少选择一项：') }} <strong>{{ pick('Looking for a team', '正在寻找队伍') }}</strong> {{ pick('or', '或') }} <strong>{{ pick('Create a team now', '现在创建队伍') }}</strong>。
              </p>
              <button type="submit" :disabled="authLoading || (regWantCreateTeam && !regTeamName.trim()) || (!regLookingForTeam && !regWantCreateTeam)" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
                {{ authLoading ? pick('Registering...', '正在注册……') : regWantCreateTeam ? pick('Register & Create Team', '注册并创建队伍') : pick('Register', '注册') }}
              </button>
              <p class="text-center text-xs text-text-secondary">
                {{ pick('Already have an account?', '已有账号？') }}
                <button type="button" @click="authModalTab = 'login'; authError = ''" class="text-accent hover:underline">{{ pick('Login', '登录') }}</button>
              </p>
            </template>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Profile Edit Modal -->
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showProfileModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showProfileModal = false"></div>

        <div class="relative w-full max-w-md glass-card p-8 max-h-[90vh] overflow-y-auto border-accent-blue/20">
          <button @click="showProfileModal = false" class="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <h3 class="text-lg font-bold text-text-primary mb-1">{{ profileEditing ? pick('Edit Profile', '编辑资料') : pick('My Profile', '我的资料') }}</h3>
          <button v-if="!profileEditing" @click="profileEditing = true" class="mb-4 px-4 py-1.5 text-xs border border-accent text-accent hover:bg-accent hover:text-black transition-colors uppercase tracking-widest">{{ pick('Edit Profile', '编辑资料') }}</button>
          <button v-else @click="profileEditing = false" class="mb-4 px-4 py-1.5 text-xs border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors uppercase tracking-widest">{{ pick('Cancel', '取消') }}</button>

          <!-- View Mode -->
          <div v-if="!profileEditing && user" class="space-y-4">
            <div class="flex items-center gap-4 mb-4">
              <img :src="assetUrl(user.avatar) || (user.githubId ? `https://avatars.githubusercontent.com/${user.githubId.replace('@', '')}` : assetUrl('/default-avatar.svg'))" class="w-16 h-16 rounded-full object-cover border-2 border-border" />
              <div>
                <p class="text-lg font-bold text-text-primary">{{ user.name || pick('(no name)', '（未填写姓名）') }}</p>
                <p v-if="user.role" class="text-sm text-text-secondary">{{ roleLabel(user.role) }}</p>
              </div>
            </div>
            <p v-if="user.bio" class="text-sm text-text-secondary whitespace-pre-line">{{ user.bio }}</p>
            <div v-if="user.themes?.length" class="flex flex-wrap gap-1.5">
              <span v-for="theme in user.themes" :key="theme" class="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded">{{ trackLabel(theme) }}</span>
            </div>
            <div v-if="user.preferredModel" class="text-xs text-text-muted">{{ pick('Model', '模型') }}：<span class="text-text-secondary">{{ user.preferredModel }}</span></div>
            <div class="pt-3 border-t border-border-subtle space-y-1.5">
              <p v-if="user.githubId" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> {{ user.githubId }}</p>
              <p v-if="user.discord" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg> {{ user.discord }}</p>
              <p v-if="user.twitter" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> {{ user.twitter }}</p>
              <p v-if="user.telegram" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> {{ user.telegram }}</p>
              <p v-if="user.linkedin" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> {{ user.linkedin }}</p>
              <p v-if="user.website" class="text-sm text-text-secondary flex items-center gap-2"><svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg> {{ user.website }}</p>
              <p v-if="!user.githubId && !user.discord && !user.twitter && !user.telegram && !user.linkedin && !user.website" class="text-xs text-text-muted italic">{{ pick('No social links added yet.', '尚未添加公开联系方式。') }}</p>
            </div>
            <div v-if="user.lookingForTeam && !user.teamId" class="pt-3 border-t border-border-subtle text-xs text-emerald-400">{{ pick('Looking for a team', '正在寻找队伍') }}</div>
            <!-- API Credits (checked-in users with team only) -->
            <div v-if="user && user.checkedIn && user.teamId" class="pt-3 border-t border-border-subtle">
              <p class="text-xs text-text-muted uppercase tracking-wider mb-2">{{ pick('API Credits', 'API 额度') }}</p>
              <template v-if="myRedeemCode">
                <p class="text-sm text-text-secondary mb-1">{{ pick('Your', '你的') }} <strong class="text-text-primary">{{ myRedeemCode.model }}</strong> {{ pick('redemption code:', '兑换码：') }}</p>
                <code class="block px-3 py-2 bg-bg-secondary border border-accent/30 text-accent font-mono text-sm select-all mb-2">{{ myRedeemCode.code }}</code>
                <a v-if="myRedeemCode.model === 'MiniMax'" href="https://platform.minimax.io/docs/guides/pricing-token-plan" target="_blank" class="text-xs text-accent hover:underline">→ {{ pick('Redeem on MiniMax Platform', '前往 MiniMax 平台兑换') }}</a>
                <a v-else-if="myRedeemCode.model === 'Kimi'" href="https://platform.kimi.ai/docs/api/overview" target="_blank" class="text-xs text-accent hover:underline">→ {{ pick('Redeem on Kimi Platform', '前往 Kimi 平台兑换') }}</a>
              </template>
              <template v-else-if="myTeam && ['GLM','DeepSeek'].includes(myTeam.model || '')">
                <p class="text-sm text-text-secondary mb-2">{{ pick('Register on RouteTokens to get your API credits:', '在 RouteTokens 注册以领取 API 额度：') }}</p>
                <a href="https://portal.routetokens.com/" target="_blank" class="block px-3 py-2 bg-bg-secondary border border-accent/30 text-accent text-sm hover:bg-accent/5 transition-colors mb-1">→ portal.routetokens.com</a>
                <p class="mb-1 text-xs text-badge-warning-text">用你在我们网站注册的邮箱注册，否则可能在获取 token 的时候遇到问题</p>
                <a href="https://docs.routetokens.com/" target="_blank" class="text-xs text-text-muted hover:text-text-secondary">{{ pick('Documentation', '使用文档') }} →</a>
              </template>
              <template v-else>
                <p class="text-xs text-text-muted">{{ pick('Model credits are distributed by the organizers for the competition environment.', '比赛环境所需的模型额度将由组织方统一发放。') }}</p>
              </template>
            </div>

            <div v-if="user && profileQr" class="flex flex-col items-center pt-4 mt-2 border-t border-border">
              <p class="text-xs text-text-muted uppercase tracking-wider mb-2">{{ pick('Your Registration QR Code', '你的报名二维码') }}</p>
              <img :src="profileQr" class="w-28 h-28" />
              <p class="mt-1 text-xs text-text-muted">{{ pick('Opens your registration record', '扫码打开你的报名资料') }}</p>
            </div>
          </div>

          <!-- Edit Mode -->
          <form v-if="profileEditing" @submit.prevent="saveProfile" class="space-y-4">
          <div v-if="authError" class="mb-4 p-3 bg-badge-danger-bg border border-accent-red/30 text-badge-danger-text text-sm">{{ authError }}</div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Name', '姓名') }}</label>
              <input v-model="profileName" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('GitHub Username', 'GitHub 用户名') }}</label>
              <input v-model="profileGithubId" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Role', '角色') }}</label>
              <select v-model="profileRole" :class="[inputClass, 'appearance-none']">
                <option value="">{{ pick('Select role', '选择角色') }}</option>
                <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">{{ pick('Bio', '个人简介') }}</label>
              <textarea v-model="profileBio" rows="3" :class="inputClass" :placeholder="pick('Tell others about yourself...', '向其他参赛者介绍一下自己……')"></textarea>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">{{ t('teams.track') }}</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="track in trackOptions"
                  :key="track.id"
                  type="button"
                  @click="toggleProfileTheme(track.id)"
                  class="px-3 py-1.5 text-xs rounded-full border transition-colors"
                  :class="profileThemes.includes(track.id) ? 'bg-btn-bg text-btn-text border-btn-bg' : 'border-border text-text-secondary hover:border-border-strong'"
                >
                  {{ track.label }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-2">{{ pick('Preferred Model', '偏好模型') }}</label>
              <div class="flex gap-3">
                <button
                  v-for="m in modelChoices"
                  :key="m.value"
                  type="button"
                  @click="profilePreferredModel = profilePreferredModel === m.value ? '' : m.value"
                  class="px-3 py-1.5 text-xs rounded-full border transition-colors"
                  :class="profilePreferredModel === m.value ? 'bg-btn-bg text-btn-text border-btn-bg' : 'border-border text-text-secondary hover:border-border-strong'"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>
            <!-- Social links with stronger guidance -->
            <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span class="text-sm font-medium text-text-primary">{{ pick('Social links', '社交联系方式') }}</span>
              </div>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      Discord
                    </label>
                    <input v-model="profileDiscord" type="text" placeholder="username" :class="[inputClass, profileDiscord ? 'border-emerald-500/50' : '']" />
                  </div>
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Twitter / X
                    </label>
                    <input v-model="profileTwitter" type="text" placeholder="@handle" :class="[inputClass, profileTwitter ? 'border-emerald-500/50' : '']" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </label>
                    <input v-model="profileTelegram" type="text" placeholder="@username" :class="[inputClass, profileTelegram ? 'border-emerald-500/50' : '']" />
                  </div>
                  <div>
                    <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <svg class="w-3.5 h-3.5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </label>
                    <input v-model="profileLinkedin" type="text" placeholder="yourname" :class="[inputClass, profileLinkedin ? 'border-emerald-500/50' : '']" />
                  </div>
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    <svg class="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    {{ pick('Personal Website', '个人网站') }}
                  </label>
                  <input v-model="profileWebsite" type="text" placeholder="https://yoursite.com" :class="[inputClass, profileWebsite ? 'border-emerald-500/50' : '']" />
                </div>
              </div>
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="profileLookingForTeam" class="sr-only peer" />
                <div class="w-9 h-5 bg-border rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-bg-card rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-sm text-text-secondary">{{ pick('Looking for a team', '正在寻找队伍') }}</span>
            </label>
            <button type="submit" :disabled="profileLoading" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors disabled:opacity-50">
              {{ profileLoading ? pick('Saving...', '正在保存……') : pick('Save Profile', '保存资料') }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- My Team Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMyTeamModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showMyTeamModal = false"></div>
          <div class="relative bg-bg-card border border-border w-full max-w-md max-h-[80vh] overflow-y-auto">
            <button @click="showMyTeamModal = false" class="absolute top-4 right-4 text-text-secondary hover:text-text-primary">✕</button>

            <!-- Leader 视图 -->
            <template v-if="myTeam && myTeam.leaderId === user?.id">
              <div class="p-6">
                <h3 class="text-lg font-bold text-text-primary mb-1">{{ pick('My Team', '我的队伍') }} — {{ myTeam.name }}</h3>
                <p class="text-xs text-text-tertiary mb-6">{{ pick('You are the team leader', '你是队长') }}</p>

                <!-- 成员列表 -->
                <div class="mb-6">
                  <p class="text-xs text-text-muted uppercase tracking-wider mb-3 font-semibold">{{ pick('Members', '成员') }}（{{ myTeam.members.length }}）</p>
                  <div class="space-y-2">
                    <div v-for="m in myTeam.members" :key="m.id" class="flex items-center gap-3 p-2 bg-bg-elevated">
                      <img :src="m.avatar || `https://avatars.githubusercontent.com/${m.githubId}`" class="w-8 h-8 rounded-full object-cover" />
                      <span class="text-sm text-text-primary">{{ m.name }}</span>
                      <span v-if="m.id === myTeam.leaderId" class="text-xs text-badge-warning-text">{{ pick('Lead', '队长') }}</span>
                    </div>
                  </div>
                </div>

                <!-- 待审批 -->
                <div v-if="myTeam.pendingUsers?.length">
                  <p class="text-xs text-badge-warning-text uppercase tracking-wider mb-3 font-semibold">{{ pick('Pending Requests', '待处理申请') }}（{{ myTeam.pendingUsers.length }}）</p>
                  <div class="space-y-2">
                    <div v-for="pu in myTeam.pendingUsers" :key="pu.id" class="flex items-center justify-between gap-3 p-2 bg-bg-elevated border border-border-hover">
                      <div class="flex items-center gap-3">
                        <img :src="pu.avatar || `https://avatars.githubusercontent.com/${pu.githubId}`" class="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p class="text-sm text-text-primary">{{ pu.name }}</p>
                          <p class="text-xs text-text-tertiary">{{ roleLabel(pu.role) }}</p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button @click="handleApprove(myTeam!.id, pu.id)" class="px-3 py-1 text-xs bg-btn-bg text-btn-text hover:bg-btn-hover transition-colors">{{ pick('Approve', '通过') }}</button>
                        <button @click="handleReject(myTeam!.id, pu.id)" class="px-3 py-1 text-xs border border-border text-text-secondary hover:text-text-primary transition-colors">{{ pick('Decline', '拒绝') }}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-text-tertiary">{{ pick('No pending requests.', '暂无待处理申请。') }}</div>
              </div>
            </template>

            <!-- 成员/Pending 视图 -->
            <template v-else>
              <div class="p-6">
                <h3 class="text-lg font-bold text-text-primary mb-6">{{ pick('My Team', '我的队伍') }}</h3>

                <!-- 已加入的团队 -->
                <div v-if="user?.teamId && myTeam" class="mb-6">
                  <div class="flex items-center gap-4 mb-3">
                    <img :src="assetUrl(myTeam.avatar) || assetUrl('/default-team-avatar.svg')" class="w-12 h-12 rounded-[10px] object-cover dark:invert" />
                    <div>
                      <p class="font-bold text-text-primary">{{ myTeam.name }}</p>
                      <p class="text-xs text-emerald-500 mt-0.5">{{ pick('Member', '成员') }}</p>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div v-for="m in myTeam.members" :key="m.id" class="flex items-center gap-3 p-2 bg-bg-elevated">
                      <img :src="m.avatar || `https://avatars.githubusercontent.com/${m.githubId}`" class="w-8 h-8 rounded-full object-cover" />
                      <span class="text-sm text-text-primary">{{ m.name }}</span>
                      <span v-if="m.id === myTeam.leaderId" class="text-xs text-badge-warning-text">{{ pick('Lead', '队长') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Pending 申请列表 -->
                <div v-if="myPendingTeams.length">
                  <p class="text-xs text-text-muted uppercase tracking-wider mb-3 font-semibold">{{ pick('Pending Applications', '待审批申请') }}</p>
                  <div class="space-y-3">
                    <div v-for="t in myPendingTeams" :key="t.id" class="flex items-center justify-between gap-3 p-3 bg-bg-elevated border border-border-hover">
                      <div class="flex items-center gap-3">
                        <img :src="assetUrl(t.avatar) || assetUrl('/default-team-avatar.svg')" class="w-10 h-10 rounded-[8px] object-cover dark:invert" />
                        <div>
                          <p class="text-sm font-semibold text-text-primary">{{ t.name }}</p>
                          <p class="text-xs text-badge-warning-text">{{ pick('Pending Approval', '等待审批') }}</p>
                        </div>
                      </div>
                      <button @click="handleCancelJoin(t.id)" class="text-xs text-text-tertiary hover:text-accent-red transition-colors">{{ pick('Cancel', '取消') }}</button>
                    </div>
                  </div>
                </div>

                <div v-if="!user?.teamId && !myPendingTeams.length" class="text-sm text-text-tertiary">
                  {{ pick("You haven't joined or applied to any team yet.", '你尚未加入或申请任何队伍。') }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </Teleport>

  <!-- Change Password Modal -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showChangePasswordModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div class="relative w-full max-w-sm p-8 bg-bg-primary border border-border shadow-2xl">
          <h3 class="text-lg font-bold text-text-primary mb-2">{{ pick('Set a New Password', '设置新密码') }}</h3>
          <p class="text-sm text-text-secondary mb-6">{{ pick('Please enter a new password for your account.', '请为你的账号输入一个新密码。') }}</p>
          <div v-if="changePwError" class="mb-4 p-3 bg-badge-danger-bg border border-accent-red/30 text-badge-danger-text text-sm">{{ changePwError }}</div>
          <div class="space-y-4">
            <div>
              <label class="block text-xs text-text-secondary mb-1">{{ pick('New Password', '新密码') }} *</label>
              <input v-model="newPassword" type="password" :placeholder="pick('At least 6 characters', '至少 6 个字符')" class="w-full px-4 py-2.5 bg-input-bg border border-input-border text-text-primary placeholder-input-placeholder focus:border-accent/50 focus:outline-none text-sm" />
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">{{ pick('Confirm Password', '确认密码') }} *</label>
              <input v-model="confirmPassword" type="password" :placeholder="pick('Repeat new password', '再次输入新密码')" class="w-full px-4 py-2.5 bg-input-bg border border-input-border text-text-primary placeholder-input-placeholder focus:border-accent/50 focus:outline-none text-sm" @keyup.enter="handleChangePassword" />
            </div>
            <button @click="handleChangePassword" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-semibold tracking-widest uppercase hover:bg-btn-hover transition-colors">{{ pick('Change Password', '修改密码') }}</button>
            <button @click="showChangePasswordModal = false" class="w-full py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors">{{ pick('Skip for now', '暂时跳过') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Header Toast -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 translate-y-2">
      <div v-if="headerToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 text-sm font-medium shadow-lg" :class="headerToast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'">
        {{ headerToast.msg }}
      </div>
    </Transition>
  </Teleport>
</template>
