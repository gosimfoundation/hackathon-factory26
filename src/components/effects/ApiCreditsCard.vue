<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useTeams } from '../../composables/useTeams'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../composables/useI18n'

const { user, isLoggedIn } = useAuth()
const { pick } = useI18n()
const { teams } = useTeams()

const myTeam = computed(() => teams.value.find(t => t.members.some(m => m.id === user.value?.id)))
const myCode = ref<any>(null)
const codeRevealed = ref(false)
const dismissed = ref(false)

const shouldShow = computed(() =>
  isLoggedIn.value && user.value?.checkedIn && user.value?.teamId && !dismissed.value
)

const teamModel = computed(() => myTeam.value?.model || '')

async function loadCode() {
  if (!user.value) return
  const { data } = await supabase.from('redeem_codes').select('code, model').eq('assigned_to', user.value.id).eq('status', 'assigned').single()
  myCode.value = data || null
}

watch(shouldShow, (v) => { if (v) loadCode() }, { immediate: true })
</script>

<template>
  <div v-if="shouldShow" class="fixed bottom-6 left-6 z-50 max-w-sm">
    <div class="bg-bg-primary border border-accent/40 shadow-2xl p-5 backdrop-blur-xl">
      <button @click="dismissed = true" class="absolute top-2 right-2 text-text-muted hover:text-text-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <p class="text-xs text-accent uppercase tracking-widest font-bold mb-3">{{ pick('API Credits', 'API 额度') }} — {{ teamModel || pick('Sponsor', '赞助方') }}</p>

      <!-- Show redeem code if available -->
      <template v-if="myCode">
        <p class="text-sm text-text-secondary mb-2">{{ pick('Your redemption code:', '你的兑换码：') }}</p>
        <code @click="codeRevealed = !codeRevealed"
          class="block px-4 py-3 bg-bg-secondary border border-accent/30 font-mono text-lg text-center mb-2 cursor-pointer transition-colors hover:border-accent"
          :class="codeRevealed ? 'text-accent select-all' : 'text-text-muted'">
          {{ codeRevealed ? myCode.code : '•••••••••••••' }}
        </code>
        <p v-if="!codeRevealed" class="text-[10px] text-text-muted text-center mb-3">{{ pick('Click to reveal', '点击显示兑换码') }}</p>
      </template>

      <template v-else>
        <p class="text-sm text-text-muted">{{ pick("Your code hasn't been assigned yet. Please contact staff on-site.", '你的兑换码尚未分配，请联系现场工作人员。') }}</p>
      </template>
    </div>
  </div>
</template>
