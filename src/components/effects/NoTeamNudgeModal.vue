<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useTeams } from '../../composables/useTeams'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../composables/useI18n'

const { user, isLoggedIn } = useAuth()
const { teams, myInvitations } = useTeams()
const route = useRoute()
const { pick } = useI18n()
const isHome = computed(() => route.path === '/')

const dismissed = ref(false)
const toggling = ref(false)
const toggledOn = ref(false)

const hasTeam = computed(() => !!user.value?.teamId)
const hasIncomingInvites = computed(() => myInvitations.value.length > 0)

const shouldShow = computed(() =>
  isHome.value
  && isLoggedIn.value
  && user.value
  && !hasTeam.value
  && !dismissed.value
)

watch(() => user.value?.id, () => {
  dismissed.value = false
  toggledOn.value = !!user.value?.lookingForTeam
})

// Init on mount (useAuth populates later)
watch(() => user.value, (u) => {
  if (u) toggledOn.value = !!u.lookingForTeam
}, { immediate: true })

async function enableLookingForTeam() {
  if (!user.value || toggling.value) return
  toggling.value = true
  const { error: updErr } = await supabase.from('profiles').update({ looking_for_team: true }).eq('id', user.value.id)
  toggling.value = false
  if (!updErr) {
    toggledOn.value = true
    if (user.value) user.value.lookingForTeam = true
  }
}

function dismiss() {
  dismissed.value = true
}

function scrollToTeams() {
  const el = document.getElementById('teams')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  dismiss()
}

const upcomingTeamsCount = computed(() => teams.value.filter(t => !t.locked && (t.maxSize === null || t.members.length < t.maxSize)).length)
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="shouldShow" class="fixed inset-0 z-[250] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div class="relative w-full max-w-lg bg-bg-primary border border-amber-400/40 shadow-2xl p-6">
          <button @click="dismiss" class="absolute top-3 right-3 text-text-muted hover:text-text-primary text-xs uppercase tracking-widest">
            {{ pick('Later', '稍后处理') }}
          </button>
          <div class="text-center mb-5">
            <div class="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 text-[10px] font-bold tracking-widest uppercase rounded mb-3">{{ pick('Action required', '必须处理') }}</div>
            <h2 class="text-xl font-bold text-text-primary mb-2">{{ pick('You must join or create a team to complete your registration.', '加入或创建队伍后才算完成报名。') }}</h2>
            <p class="text-sm text-text-secondary">
              {{ pick("Without a registered team, you won't be able to compete on event day.", '没有已注册的队伍将无法参赛。') }}
              {{ upcomingTeamsCount }} {{ pick('teams are still open.', '支队伍仍开放加入。') }}
            </p>
          </div>

          <div class="space-y-3 mb-4">
            <button @click="scrollToTeams" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-bold uppercase tracking-widest hover:bg-btn-hover transition-colors">
              {{ pick('Create or Browse Teams', '创建或浏览队伍') }}
            </button>
            <button
              v-if="!toggledOn"
              @click="enableLookingForTeam"
              :disabled="toggling"
              class="w-full py-2 text-xs text-text-muted hover:text-text-secondary uppercase tracking-widest disabled:opacity-50 transition-colors">
              {{ toggling ? pick('Saving...', '正在保存……') : pick('Just mark me as Looking for Team', '将我标记为“正在寻找队伍”') }}
            </button>
            <p v-else class="text-center text-xs text-emerald-400">{{ pick("You're marked as Looking for Team. Team leaders can now find you.", '已标记为“正在寻找队伍”，队长现在可以找到你。') }}</p>
          </div>

          <p v-if="hasIncomingInvites" class="text-[11px] text-amber-300 text-center mb-2">
            {{ pick('You have', '你有') }} {{ myInvitations.length }} {{ pick('pending invitation(s).', '条待处理的队伍邀请。') }}
          </p>
          <p class="text-[11px] text-text-muted text-center">
            {{ pick("You'll see this reminder until you join a team.", '加入队伍前，此提醒会继续出现。') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
