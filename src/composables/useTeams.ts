import { ref, computed, onMounted } from 'vue'
import type { User } from './useAuth'
import { supabase } from '../lib/supabase'
import { useI18n } from './useI18n'

export interface Team {
  id: string
  name: string
  leaderId: string
  avatar: string
  githubRepo: string
  themes: string[]
  model: string
  harness: string
  projectIdea: string
  locked: boolean
  maxSize: number | null
  likes: number
  members: User[]
  pendingJoins?: string[]
  pendingUsers?: User[]
  createdAt: string
}

const teams = ref<Team[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref<Date | null>(null)

let realtimeSetup = false

function profileRowToUser(row: Record<string, any>): User {
  return {
    id: row.id,
    name: row.name,
    email: '',
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
    referralSource: row.referral_source ?? '',
    teamId: row.team_id ?? null,
    lookingForTeam: row.looking_for_team ?? false,
    passwordChanged: row.password_changed ?? false,
    confirmedAttendance: row.confirmed_attendance ?? null,
    checkedIn: row.checked_in ?? false,
    createdAt: row.created_at ?? '',
  }
}

function teamRowToTeam(row: Record<string, any>, allUsers: User[]): Team {
  const members = allUsers.filter(u => u.teamId === row.id)
  const pendingUsers = allUsers.filter(u => (row.pending_joins ?? []).includes(u.id))
  return {
    id: row.id,
    name: row.name,
    leaderId: row.leader_id,
    avatar: row.avatar ?? '',
    githubRepo: row.github_repo ?? '',
    themes: row.themes ?? [],
    model: row.model ?? '',
    harness: row.harness ?? '',
    projectIdea: row.project_idea ?? '',
    locked: row.locked ?? false,
    maxSize: row.max_size ?? null,
    likes: row.likes ?? 0,
    members,
    pendingJoins: row.pending_joins ?? [],
    pendingUsers,
    createdAt: row.created_at ?? '',
  }
}

export function useTeams() {
  const { pick } = useI18n()
  const notLoggedIn = () => pick('Not logged in', '请先登录')
  const networkError = () => pick('Network error', '网络错误，请稍后重试')
  const teamNotFound = () => pick('Team not found', '未找到该队伍')
  const teamFull = () => pick('Team is full', '该队伍人数已满')
  const teamLocked = () => pick('Team is locked', '该队伍已锁定')
  const teamAlreadyExists = () => pick('This account already has a team. Open Edit Registration instead.', '这个账号已经有队伍，请使用“编辑报名信息”。')
  const totalMembers = computed(() => users.value.filter(u => u.teamId).length)
  const totalRegistered = computed(() => users.value.length)
  const maxParticipants = ref<number | null>(null)
  const spotsLeft = computed(() => 0)
  const isFull = computed(() => false)
  const progress = computed(() => 0)

  const modelStats = computed(() => {
    const stats: Record<string, number> = { Kimi: 0, GLM: 0, MiniMax: 0, DeepSeek: 0, Other: 0 }
    teams.value.forEach((t) => {
      if (t.model && t.model in stats) stats[t.model]++
    })
    return stats
  })

  async function fetchTeams() {
    const { data: { session } } = await supabase.auth.getSession()
    const publicTeamColumns = 'id,name,avatar,model,harness,themes,project_idea,github_repo,likes,created_at'
    const profileRequest = session
      ? supabase.from('profiles').select('*')
      : Promise.resolve({ data: [] as Record<string, any>[] })
    const [{ data: profileRows }, { data: teamRows }] = await Promise.all([
      profileRequest,
      supabase.from('teams').select(session ? '*' : publicTeamColumns),
    ])
    const allUsers = (profileRows ?? []).map(profileRowToUser)
    users.value = allUsers
    teams.value = (teamRows ?? []).map(row => teamRowToTeam(row, allUsers))
    lastUpdated.value = new Date()
  }

  async function createTeam(payload: {
    name: string
    avatar: string
    githubRepo: string
    themes: string[]
    model: string
    harness: string
    projectIdea: string
    locked: boolean
    maxSize: number | null
  }) {
    loading.value = true
    error.value = ''
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { error.value = notLoggedIn(); loading.value = false; return false }
    try {
      const [{ data: ownProfile, error: profileError }, { data: ownedTeam, error: ownedTeamError }] = await Promise.all([
        supabase.from('profiles').select('team_id').eq('id', session.user.id).maybeSingle(),
        supabase.from('teams').select('id').eq('leader_id', session.user.id).limit(1).maybeSingle(),
      ])
      if (profileError || ownedTeamError) { error.value = (profileError || ownedTeamError)?.message || networkError(); return false }
      if (ownedTeam || ownProfile?.team_id) { error.value = teamAlreadyExists(); return false }

      const { data: team, error: insertError } = await supabase.from('teams').insert({
        name: payload.name,
        leader_id: session.user.id,
        contact_email: session.user.email || null,
        avatar: payload.avatar,
        github_repo: payload.githubRepo,
        themes: payload.themes,
        model: payload.model,
        harness: payload.harness,
        project_idea: payload.projectIdea,
        locked: payload.locked,
        max_size: payload.maxSize,
      }).select().single()
      if (insertError) { error.value = insertError.message; return false }
      // 把自己加入团队
      await supabase.from('profiles').update({ team_id: team.id }).eq('id', session.user.id)
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function editTeam(teamId: string, payload: Record<string, any>) {
    loading.value = true
    error.value = ''
    try {
      const update: Record<string, any> = {}
      if (payload.name !== undefined) update.name = payload.name
      if (payload.avatar !== undefined) update.avatar = payload.avatar
      if (payload.githubRepo !== undefined) update.github_repo = payload.githubRepo
      if (payload.themes !== undefined) update.themes = payload.themes
      if (payload.model !== undefined) update.model = payload.model
      if (payload.harness !== undefined) update.harness = payload.harness
      if (payload.projectIdea !== undefined) update.project_idea = payload.projectIdea
      if (payload.locked !== undefined) update.locked = payload.locked
      if (payload.maxSize !== undefined) update.max_size = payload.maxSize

      const { error: updateError } = await supabase.from('teams').update(update).eq('id', teamId)
      if (updateError) { error.value = updateError.message; return false }
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function cancelJoin(teamId: string) {
    loading.value = true
    error.value = ''
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { error.value = notLoggedIn(); loading.value = false; return false }
    try {
      const { error: updateError } = await supabase.rpc('cancel_join_request', { p_team_id: teamId })
      if (updateError) { error.value = updateError.message; console.error('[cancelJoin] error:', updateError); return false }
      await fetchTeams()
      return true
    } catch (e) { error.value = networkError(); console.error('[cancelJoin] exception:', e); return false }
    finally { loading.value = false }
  }

  async function deleteTeam(teamId: string) {
    loading.value = true
    error.value = ''
    try {
      const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId)
      if (deleteError) { error.value = deleteError.message; return false }
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function joinTeam(teamId: string) {
    loading.value = true
    error.value = ''
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { error.value = notLoggedIn(); loading.value = false; return false }
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (!team) { error.value = teamNotFound(); return false }
      if (team.maxSize !== null && team.members.length >= team.maxSize) { error.value = teamFull(); return false }
      if (team.locked) { error.value = teamLocked(); return false }
      const { error: updateError } = await supabase.rpc('request_join_team', { p_team_id: teamId })
      if (updateError) { error.value = updateError.message; console.error('[joinTeam] error:', updateError); return false }
      const { error: mailErr } = await supabase.functions.invoke('send_team_email', {
        body: { kind: 'join_request', team_id: teamId, user_id: session.user.id },
      })
      if (mailErr) console.warn('[joinTeam] email failed:', mailErr)
      await fetchTeams()
      return true
    } catch (e) { error.value = networkError(); console.error('[joinTeam] exception:', e); return false }
    finally { loading.value = false }
  }

  async function leaveTeam(teamId: string) {
    loading.value = true
    error.value = ''
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { error.value = notLoggedIn(); loading.value = false; return false }
    try {
      const { error: fnError } = await supabase.rpc('leave_team', { p_team_id: teamId })
      if (fnError) { error.value = fnError.message; return false }
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function approveJoin(teamId: string, userId: string) {
    loading.value = true
    error.value = ''
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (!team) { error.value = teamNotFound(); return false }
      if (team.maxSize !== null && team.members.length >= team.maxSize) { error.value = teamFull(); return false }
      // 用 security definer 函数绕过 RLS（可跨用户写 profiles.team_id）
      const { error: fnError } = await supabase.rpc('approve_team_member', {
        p_team_id: teamId,
        p_user_id: userId,
      })
      if (fnError) { error.value = fnError.message; return false }
      const { error: mailErr } = await supabase.functions.invoke('send_team_email', {
        body: { kind: 'join_approved', team_id: teamId, user_id: userId },
      })
      if (mailErr) console.warn('[approveJoin] email failed:', mailErr)
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function rejectJoin(teamId: string, userId: string) {
    loading.value = true
    error.value = ''
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (!team) { error.value = teamNotFound(); return false }
      const { error: updateError } = await supabase.rpc('reject_join_request', { p_team_id: teamId, p_user_id: userId })
      if (updateError) { error.value = updateError.message; return false }
      const { error: mailErr } = await supabase.functions.invoke('send_team_email', {
        body: { kind: 'join_rejected', team_id: teamId, user_id: userId },
      })
      if (mailErr) console.warn('[rejectJoin] email failed:', mailErr)
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function kickMember(teamId: string, userId: string) {
    loading.value = true
    error.value = ''
    try {
      const { error: fnError } = await supabase.rpc('kick_team_member', {
        p_team_id: teamId,
        p_user_id: userId,
      })
      if (fnError) { error.value = fnError.message; return false }
      await fetchTeams()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  async function inviteToTeam(teamId: string, userId: string, message: string = '') {
    loading.value = true
    error.value = ''
    try {
      const { data: inviteId, error: fnError } = await supabase.rpc('invite_to_team', {
        p_team_id: teamId, p_user_id: userId, p_message: message || null,
      })
      if (fnError) { error.value = fnError.message; return null }
      const { error: mailErr } = await supabase.functions.invoke('send_team_email', {
        body: { kind: 'invite', invite_id: inviteId },
      })
      if (mailErr) console.warn('[inviteToTeam] email failed:', mailErr)
      await fetchInvitations()
      return inviteId
    } catch (e) { error.value = networkError(); console.error('[inviteToTeam]', e); return null }
    finally { loading.value = false }
  }

  async function respondToInvite(inviteId: string, accept: boolean) {
    loading.value = true
    error.value = ''
    try {
      const { error: fnError } = await supabase.rpc('respond_to_invite', { p_invite_id: inviteId, p_accept: accept })
      if (fnError) { error.value = fnError.message; return false }
      const { error: mailErr } = await supabase.functions.invoke('send_team_email', {
        body: { kind: accept ? 'accepted' : 'declined', invite_id: inviteId },
      })
      if (mailErr) console.warn('[respondToInvite] email failed:', mailErr)
      await Promise.all([fetchTeams(), fetchInvitations()])
      return true
    } catch (e) { error.value = networkError(); console.error('[respondToInvite]', e); return false }
    finally { loading.value = false }
  }

  async function cancelInvite(inviteId: string) {
    loading.value = true
    error.value = ''
    try {
      const { error: fnError } = await supabase.rpc('cancel_invite', { p_invite_id: inviteId })
      if (fnError) { error.value = fnError.message; return false }
      await fetchInvitations()
      return true
    } catch { error.value = networkError(); return false }
    finally { loading.value = false }
  }

  const myInvitations = ref<any[]>([])
  const sentInvitations = ref<any[]>([])

  async function fetchInvitations() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { myInvitations.value = []; sentInvitations.value = []; return }
    const { data } = await supabase
      .from('team_invitations')
      .select('id, team_id, invited_user_id, invited_by, message, status, created_at')
      .eq('status', 'pending')
    const all = data || []
    myInvitations.value = all.filter(i => i.invited_user_id === session.user.id)
    sentInvitations.value = all.filter(i => i.invited_by === session.user.id)
  }

  async function likeTeam(teamId: string) {
    const team = teams.value.find(t => t.id === teamId)
    if (!team) return false
    const { data: likes, error: updateError } = await supabase.rpc('like_team', { p_team_id: teamId })
    if (updateError) return false
    team.likes = likes ?? team.likes + 1
    return true
  }

  onMounted(() => {
    fetchTeams()
    fetchInvitations()
    if (!realtimeSetup) {
      realtimeSetup = true
      supabase
        .channel('teams-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeams)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchTeams)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, fetchInvitations)
        .subscribe()
    }
  })

  return {
    teams, users, totalMembers, totalRegistered, maxParticipants, spotsLeft, isFull, progress,
    modelStats, loading, error, lastUpdated, myInvitations, sentInvitations,
    fetchTeams, createTeam, editTeam, deleteTeam, joinTeam, cancelJoin, leaveTeam, likeTeam, approveJoin, rejectJoin, kickMember,
    inviteToTeam, respondToInvite, cancelInvite, fetchInvitations,
  }
}
