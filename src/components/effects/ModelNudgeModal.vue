<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useTeams } from '../../composables/useTeams'
import { useRoute } from 'vue-router'
import { useI18n } from '../../composables/useI18n'

const { user, isLoggedIn } = useAuth()
const { teams, editTeam } = useTeams()
const route = useRoute()
const { pick: localize } = useI18n()
const isHome = computed(() => route.path === '/')

const dismissed = ref(false)
const saving = ref(false)
const justSaved = ref(false)

const myLedTeam = computed(() => teams.value.find(t => t.leaderId === user.value?.id))
const needsModel = computed(() =>
  isHome.value && isLoggedIn.value && myLedTeam.value && !myLedTeam.value.model && !dismissed.value && !justSaved.value
)

const models = [
  { id: 'Kimi', color: '#3B82F6' },
  { id: 'GLM', color: '#22C55E' },
  { id: 'MiniMax', color: '#E94B7E' },
  { id: 'DeepSeek', color: '#8B5CF6' },
  { id: 'Other', color: '#6B7280' },
]

async function pick(model: string) {
  if (!myLedTeam.value) return
  saving.value = true
  const ok = await editTeam(myLedTeam.value.id, { model })
  saving.value = false
  if (ok) { justSaved.value = true; setTimeout(() => { justSaved.value = false }, 2000) }
}

function dismiss() {
  dismissed.value = true
}

watch(() => user.value?.id, () => {
  dismissed.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="needsModel" class="fixed inset-0 z-[190] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div class="relative w-full max-w-lg bg-bg-primary border border-accent/30 shadow-2xl p-6">
          <button @click="dismiss" class="absolute top-3 right-3 text-text-muted hover:text-text-primary text-xs uppercase tracking-widest">
            {{ localize('Later', '稍后处理') }}
          </button>
          <div class="text-center mb-5">
            <div class="inline-block px-3 py-1 bg-accent/20 text-accent text-[10px] font-bold tracking-widest uppercase rounded mb-3">{{ localize('Action needed', '需要处理') }}</div>
            <h2 class="text-xl font-bold text-text-primary mb-2">{{ localize('Pick your open-source model', '选择开源模型') }}</h2>
            <p class="text-sm text-text-secondary">
              {{ localize('Your team', '你的队伍') }} <strong>{{ myLedTeam?.name }}</strong> {{ localize('has not selected one yet. Organizer-issued tokens are accessed through the unified gateway.', '尚未选择模型。组织方提供的 Token 将通过统一网关使用。') }}
            </p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <button v-for="m in models" :key="m.id" @click="pick(m.id)" :disabled="saving"
              class="p-4 bg-bg-secondary border border-border hover:border-accent transition-all disabled:opacity-50 text-left rounded">
              <div class="text-base font-bold mb-1" :style="{ color: m.color }">{{ m.id }}</div>
            </button>
          </div>
          <p v-if="justSaved" class="text-center text-sm text-emerald-400">{{ localize('Saved!', '已保存！') }}</p>
          <p class="text-[11px] text-text-muted text-center">{{ localize('You can change this anytime from your team page.', '之后可以随时在队伍页面修改。') }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
