import { ref, provide, inject, type InjectionKey, type Ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { publicSiteUrl } from './api'

export interface User {
  id: string
  name: string
  email?: string
  wechat: string
  githubId: string
  role: string
  avatar: string
  themes: string[]
  preferredModel: string
  bio: string
  discord: string
  twitter: string
  telegram: string
  linkedin: string
  website: string
  country: string
  city: string
  organization: string
  ageRange: string
  teamId: string | null
  lookingForTeam: boolean
  passwordChanged: boolean
  confirmedAttendance: string | null
  checkedIn: boolean
  createdAt: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  wechat: string
  githubId: string
  role: string
  avatar: string
  themes: string[]
  preferredModel: string
  bio: string
  discord: string
  twitter: string
  telegram: string
  linkedin: string
  website: string
  country: string
  city: string
  organization: string
  ageRange: string
  lookingForTeam: boolean
  team: {
    name: string
    githubRepo: string
    themes: string[]
    model: string
    harness: string
    projectIdea: string
  }
}

const AUTH_KEY: InjectionKey<{
  user: Ref<User | null>
  isLoggedIn: Ref<boolean>
  register: (data: RegisterData) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<boolean>
  changePassword: (newPassword: string) => Promise<boolean>
  sendPasswordReset: (email: string) => Promise<boolean>
  fetchMe: () => Promise<void>
  error: Ref<string>
  showAuthModal: Ref<boolean>
  authModalTab: Ref<'login' | 'register' | 'forgot'>
  showChangePasswordModal: Ref<boolean>
  promptAuth: (tab?: 'login' | 'register') => void
}> = Symbol('auth')

const user = ref<User | null>(null)
const isLoggedIn = ref(false)
const error = ref('')
const showAuthModal = ref(false)
const authModalTab = ref<'login' | 'register' | 'forgot'>('login')
const showChangePasswordModal = ref(false)

function promptAuth(tab: 'login' | 'register' = 'login') {
  authModalTab.value = tab
  error.value = ''
  showAuthModal.value = true
}

function profileRowToUser(row: Record<string, any>, email?: string): User {
  return {
    id: row.id,
    name: row.name,
    email: email ?? '',
    wechat: row.wechat ?? '',
    githubId: row.github_id ?? '',
    role: row.role ?? '',
    avatar: row.avatar ?? '',
    themes: row.themes ?? [],
    preferredModel: row.preferred_model ?? '',
    bio: row.bio ?? '',
    discord: row.discord ?? '',
    twitter: row.twitter ?? '',
    telegram: row.telegram ?? '',
    linkedin: row.linkedin ?? '',
    website: row.website ?? '',
    country: row.country ?? '',
    city: row.city ?? '',
    organization: row.organization ?? '',
    ageRange: row.age_range ?? '',
    teamId: row.team_id ?? null,
    lookingForTeam: row.looking_for_team ?? false,
    passwordChanged: row.password_changed ?? false,
    confirmedAttendance: row.confirmed_attendance ?? null,
    checkedIn: row.checked_in ?? false,
    createdAt: row.created_at ?? '',
  }
}

export function provideAuth(pick: <T>(english: T, chinese: T) => T) {
  const provisioningTeams = new Set<string>()

  function friendlyAuthError(message: string): string {
    if (/load failed|failed to fetch|network request failed|networkerror/i.test(message)) {
      return pick(
        'Unable to reach the registration service. Please switch networks or disable request-blocking extensions, then try again. If you may have registered already, try logging in or resetting your password.',
        '无法连接报名服务。请切换网络或关闭可能拦截请求的插件后重试。如果账号可能已创建，请尝试直接登录或重置密码。',
      )
    }
    if (/email rate limit exceeded|over_email_send_rate_limit|rate limit.*email/i.test(message)) {
      return pick(
        'The confirmation-email limit has been reached. Please wait and try again later, or contact the organizers if registration is urgent.',
        '确认邮件发送额度已用完，请稍后再试；如需紧急报名，请联系主办方。',
      )
    }
    if (pick(false, true) === false) return message
    const exact: Record<string, string> = {
      'Invalid login credentials': '邮箱或密码错误',
      'Email not confirmed': '邮箱尚未确认，请先检查确认邮件',
      'User already registered': '该邮箱已注册，请直接登录',
      'Signup requires a valid password': '请输入有效密码',
      'Password should be at least 6 characters.': '密码至少需要 6 个字符',
      'Unable to validate email address: invalid format': '邮箱格式无效',
    }
    return exact[message] || message
  }
  async function fetchMe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (profile) {
      user.value = profileRowToUser(profile, session.user.email)
    } else {
      // profile 还未创建（触发器延迟），用 session 构建基础对象
      user.value = {
        id: session.user.id,
        name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '',
        email: session.user.email,
        wechat: '', githubId: '', role: '', avatar: '', themes: [], preferredModel: '',
        bio: '', discord: '', twitter: '', telegram: '', linkedin: '', website: '',
        country: '', city: '', organization: '', ageRange: '',
        teamId: null, lookingForTeam: false, passwordChanged: true, confirmedAttendance: null, checkedIn: false, createdAt: session.user.created_at,
      }
    }
    isLoggedIn.value = true
  }

  async function ensureTeamFromRegistration(authUser: any): Promise<boolean> {
    const pendingTeam = authUser?.user_metadata?.pending_team
    if (!pendingTeam?.name?.trim() || provisioningTeams.has(authUser.id)) return true

    provisioningTeams.add(authUser.id)
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', authUser.id)
        .single()
      if (profileError) { error.value = friendlyAuthError(profileError.message); return false }

      if (profile?.team_id) {
        await supabase.auth.updateUser({ data: { pending_team: null } })
        return true
      }

      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('leader_id', authUser.id)
        .maybeSingle()

      let teamId = existingTeam?.id
      if (!teamId) {
        const { data: createdTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: pendingTeam.name.trim(),
            leader_id: authUser.id,
            avatar: '',
            github_repo: pendingTeam.githubRepo?.trim() || '',
            themes: pendingTeam.themes || [],
            model: pendingTeam.model || '',
            harness: pendingTeam.harness || '',
            project_idea: pendingTeam.projectIdea?.trim() || '',
            contact_email: authUser.email || null,
            locked: true,
            max_size: null,
          })
          .select('id')
          .single()
        if (teamError) { error.value = friendlyAuthError(teamError.message); return false }
        teamId = createdTeam.id
      }

      const { error: linkError } = await supabase
        .from('profiles')
        .update({ team_id: teamId, looking_for_team: false })
        .eq('id', authUser.id)
      if (linkError) { error.value = friendlyAuthError(linkError.message); return false }

      await supabase.auth.updateUser({ data: { pending_team: null } })
      return true
    } finally {
      provisioningTeams.delete(authUser.id)
    }
  }

  async function register(data: RegisterData): Promise<boolean> {
    error.value = ''
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          wechat: data.wechat,
          github_id: data.githubId,
          role: data.role,
          avatar: data.avatar,
          themes: data.themes,
          preferred_model: data.preferredModel,
          bio: data.bio,
          discord: data.discord,
          twitter: data.twitter,
          telegram: data.telegram,
          linkedin: data.linkedin,
          website: data.website,
          country: data.country,
          city: data.city,
          organization: data.organization,
          age_range: data.ageRange,
          looking_for_team: data.lookingForTeam,
          pending_team: data.team,
        },
        emailRedirectTo: publicSiteUrl(),
      },
    })
    if (signUpError) { error.value = friendlyAuthError(signUpError.message); return false }
    if (!authData.user) { error.value = pick('Registration failed', '注册失败'); return false }

    // Supabase 的"安全"行为：邮箱已注册时返回 user 但 identities 为空，不发邮件
    if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      error.value = pick('This email is already registered. Please login instead, or use Forgot Password if you lost access.', '该邮箱已注册。请直接登录；如果忘记密码，请使用“忘记密码”重置。')
      return false
    }

    // 有 session 说明 autoconfirm 开启，直接创建 profile
    if (authData.session) {
      await supabase.auth.setSession(authData.session)
      await upsertProfile(authData.user.id, data)
      await ensureTeamFromRegistration(authData.user)
      await fetchMe()
    }
    // 没 session 说明需要邮件确认，资料已存入 user_metadata，确认后在 SIGNED_IN 事件里创建 profile
    return true
  }

  async function upsertProfile(userId: string, data: Partial<RegisterData> & { email?: string }) {
    return supabase.from('profiles').upsert({
      id: userId,
      email: data.email,
      name: data.name,
      wechat: data.wechat,
      github_id: data.githubId,
      role: data.role,
      avatar: data.avatar,
      themes: data.themes,
      preferred_model: data.preferredModel,
      bio: data.bio,
      discord: data.discord,
      twitter: data.twitter,
      telegram: data.telegram,
      linkedin: data.linkedin,
      website: data.website,
      country: data.country,
      city: data.city,
      organization: data.organization,
      age_range: data.ageRange,
      looking_for_team: data.lookingForTeam,
    })
  }

  async function login(email: string, password: string): Promise<boolean> {
    error.value = ''
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { error.value = friendlyAuthError(signInError.message); return false }
    if (signInData.user) await ensureTeamFromRegistration(signInData.user)
    await fetchMe()
    if (user.value && !user.value.passwordChanged) {
      showChangePasswordModal.value = true
    }
    return true
  }

  async function sendPasswordReset(email: string): Promise<boolean> {
    error.value = ''
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: publicSiteUrl(),
    })
    if (resetError) { error.value = friendlyAuthError(resetError.message); return false }
    return true
  }

  async function changePassword(newPassword: string): Promise<boolean> {
    error.value = ''
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) { error.value = friendlyAuthError(updateErr.message); return false }
    if (user.value) {
      await supabase.from('profiles').update({ password_changed: true }).eq('id', user.value.id)
      user.value.passwordChanged = true
    }
    showChangePasswordModal.value = false
    return true
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    isLoggedIn.value = false
  }

  async function updateProfile(data: Partial<User>): Promise<boolean> {
    if (!user.value) return false
    error.value = ''
    const { error: updateError } = await supabase.from('profiles').update({
      name: data.name,
      wechat: data.wechat,
      github_id: data.githubId,
      role: data.role,
      avatar: data.avatar,
      themes: data.themes,
      preferred_model: data.preferredModel,
      bio: data.bio,
      discord: data.discord,
      twitter: data.twitter,
      telegram: data.telegram,
      linkedin: data.linkedin,
      website: data.website,
      country: data.country,
      city: data.city,
      organization: data.organization,
      age_range: data.ageRange,
      looking_for_team: data.lookingForTeam,
      confirmed_attendance: data.confirmedAttendance,
      team_id: data.teamId,
    }).eq('id', user.value.id)
    if (updateError) { error.value = friendlyAuthError(updateError.message); return false }
    await fetchMe()
    return true
  }

  let authDebounce: ReturnType<typeof setTimeout> | null = null
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      user.value = null
      isLoggedIn.value = false
      return
    }
    if (event === 'PASSWORD_RECOVERY') {
      showChangePasswordModal.value = true
      return
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // 防抖：多次快速触发只处理最后一次
      if (authDebounce) clearTimeout(authDebounce)
      authDebounce = setTimeout(async () => {
        try {
          if (session?.user) {
            const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).single()
            if (!existing) {
              const meta = session.user.user_metadata || {}
              await upsertProfile(session.user.id, {
                email: session.user.email,
                name: meta.name,
                wechat: meta.wechat,
                githubId: meta.github_id,
                role: meta.role,
                avatar: meta.avatar,
                themes: meta.themes,
                preferredModel: meta.preferred_model,
                bio: meta.bio,
                discord: meta.discord,
                twitter: meta.twitter,
                telegram: meta.telegram,
                linkedin: meta.linkedin,
                website: meta.website,
                country: meta.country,
                city: meta.city,
                organization: meta.organization,
                ageRange: meta.age_range,
                lookingForTeam: meta.looking_for_team,
              })
            }
            await ensureTeamFromRegistration(session.user)
          }
          fetchMe()
        } catch (e) {
          console.warn('Auth state change handler error:', e)
          fetchMe()
        }
      }, 100)
    }
  })

  onMounted(() => fetchMe())

  const ctx = { user, isLoggedIn, register, login, logout, updateProfile, changePassword, sendPasswordReset, fetchMe, error, showAuthModal, authModalTab, showChangePasswordModal, promptAuth }
  provide(AUTH_KEY, ctx)
  return ctx
}

export function useAuth() {
  const auth = inject(AUTH_KEY)
  if (!auth) throw new Error('useAuth() called without provideAuth()')
  return auth
}
