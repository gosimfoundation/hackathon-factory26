<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useTeams } from '../../composables/useTeams'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../composables/useI18n'

const { isLoggedIn } = useAuth()
const { pick } = useI18n()
const { myInvitations, teams, users: allProfiles, respondToInvite, fetchInvitations } = useTeams()

const showModal = ref(false)
const busyId = ref<string | null>(null)
const toast = ref('')

const enriched = computed(() => {
  return myInvitations.value.map((i: any) => ({
    ...i,
    team: teams.value.find(t => t.id === i.team_id),
    inviter: allProfiles.value.find(u => u.id === i.invited_by),
  }))
})

const count = computed(() => myInvitations.value.length)

async function handleRespond(inviteId: string, accept: boolean) {
  busyId.value = inviteId
  const ok = await respondToInvite(inviteId, accept)
  busyId.value = null
  if (ok) {
    toast.value = accept ? pick('Joined!', '已加入队伍！') : pick('Declined', '已拒绝')
    setTimeout(() => (toast.value = ''), 2000)
    if (enriched.value.length === 0) showModal.value = false
  }
}

function avatarOf(u: any): string {
  if (u?.avatar) return u.avatar
  if (u?.githubId) return `https://avatars.githubusercontent.com/${u.githubId.replace(/^@/, '')}`
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || '?')}&background=1f2937&color=fff&size=64`
}

onMounted(() => {
  if (isLoggedIn.value) fetchInvitations()
  supabase.auth.onAuthStateChange(() => { fetchInvitations() })
})
</script>

<template>
  <!-- Floating button (only when logged in and has pending invites) -->
  <button v-if="isLoggedIn && count > 0 && !showModal"
    @click="showModal = true"
    class="invitations-fab"
    :title="pick(`${count} pending invitation${count > 1 ? 's' : ''}`, `${count} 条待处理邀请`)">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
    <span class="invitations-fab__text">{{ pick('INVITATIONS', '队伍邀请') }}</span>
    <span class="invitations-fab__badge">{{ count }}</span>
  </button>

  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-[205] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative w-full max-w-lg max-h-[88vh] bg-bg-primary border border-border shadow-2xl flex flex-col" @click.stop>
          <div class="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div>
              <h2 class="text-lg font-bold text-text-primary">{{ pick('Team Invitations', '队伍邀请') }}</h2>
              <p class="text-xs text-text-muted mt-0.5">{{ count }} {{ pick('pending', '条待处理') }}</p>
            </div>
            <button @click="showModal = false" class="text-text-secondary hover:text-text-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="enriched.length === 0" class="text-center text-text-muted py-8">{{ pick('No pending invitations.', '暂无待处理邀请。') }}</div>
            <div v-for="inv in enriched" :key="inv.id" class="p-4 bg-bg-secondary border border-border-subtle rounded">
              <div class="flex items-center gap-3 mb-3">
                <img :src="avatarOf(inv.inviter)" class="w-10 h-10 rounded-full object-cover border border-border" />
                <div class="min-w-0">
                  <p class="text-sm text-text-primary">
                    <span class="font-semibold">{{ inv.inviter?.name || pick('Someone', '有人') }}</span>
                    {{ pick('invited you to', '邀请你加入') }}
                  </p>
                  <p class="text-base font-bold text-accent truncate">{{ inv.team?.name || pick('(team)', '（队伍）') }}</p>
                </div>
              </div>
              <p v-if="inv.message" class="text-sm text-text-secondary italic mb-3 pl-3 border-l-2 border-accent/40">"{{ inv.message }}"</p>
              <div v-if="inv.team" class="flex items-center gap-3 text-xs text-text-muted mb-3">
                <span>{{ inv.team.members?.length || 0 }} {{ pick('members', '名成员') }}</span>
                <span v-if="inv.team.model" class="px-1.5 py-0.5 bg-accent/10 text-accent rounded">{{ inv.team.model }}</span>
                <span v-if="inv.team.locked" class="text-red-400">{{ pick('LOCKED', '已锁定') }}</span>
              </div>
              <div class="flex gap-2">
                <button @click="handleRespond(inv.id, true)" :disabled="busyId === inv.id"
                  class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                  {{ busyId === inv.id ? pick('Joining...', '正在加入……') : pick('Accept', '接受') }}
                </button>
                <button @click="handleRespond(inv.id, false)" :disabled="busyId === inv.id"
                  class="flex-1 py-2 bg-bg-card hover:bg-bg-elevated border border-border text-text-secondary text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                  {{ pick('Decline', '拒绝') }}
                </button>
              </div>
            </div>
            <p v-if="toast" class="text-sm text-emerald-400 text-center">{{ toast }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.invitations-fab {
  position: fixed;
  top: 5.5rem;
  right: 1.25rem;
  z-index: 55;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 1.15rem;
  background: #c788a1;
  color: #111310;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  border-radius: 0;
  border: 1px solid #111310;
  box-shadow: none;
  cursor: pointer;
  backdrop-filter: none;
  transition: background-color 0.2s ease;
  animation: none;
}
.invitations-fab:hover {
  transform: none;
  background: white;
}
.invitations-fab__badge {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.12rem 0.5rem;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
}
@media (max-width: 640px) {
  .invitations-fab {
    top: 4.5rem;
    right: 0.8rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.65rem;
  }
  .invitations-fab__text { display: none; }
}
</style>
