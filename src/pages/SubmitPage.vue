<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useTeams } from '../composables/useTeams'
import { useI18n } from '../composables/useI18n'
import { supabase } from '../lib/supabase'

const { user, isLoggedIn } = useAuth()
const { teams, loading: teamsLoading } = useTeams()
const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

const round = ref<'qualifier' | 'grand-challenge'>('qualifier')
const githubUrl = ref('')
const traceUrl = ref('')
const demoUrl = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')
const existingSubmission = ref<any>(null)

const myTeam = computed(() => teams.value.find(team => team.members.some(member => member.id === user.value?.id)))
const isLeader = computed(() => myTeam.value?.leaderId === user.value?.id)
const roundOptions = computed(() => [
  { id: 'qualifier', label: isEn.value ? 'Qualifier' : '初赛', dates: isEn.value ? 'Submissions close Sep 30' : '比赛截止 9 月 30 日' },
  { id: 'grand-challenge', label: isEn.value ? 'Finals' : '决赛', dates: isEn.value ? 'Oct 1–17' : '10 月 1–17 日' },
])

function validUrl(value: string) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

async function loadSubmission() {
  if (!myTeam.value) return
  submitted.value = false
  error.value = ''
  const { data } = await supabase.from('submissions').select('*').eq('team_id', myTeam.value.id).eq('round', round.value).maybeSingle()
  existingSubmission.value = data
  githubUrl.value = data?.github_url ?? ''
  traceUrl.value = data?.trace_url ?? ''
  demoUrl.value = data?.demo_url ?? ''
}

watch(() => [myTeam.value?.id, round.value], loadSubmission, { immediate: true })

async function submit() {
  if (!myTeam.value || !user.value) return
  if (!githubUrl.value.startsWith('https://github.com/')) { error.value = isEn.value ? 'Enter a GitHub repository URL.' : '请输入 GitHub 仓库链接。'; return }
  if (!validUrl(traceUrl.value) || !validUrl(demoUrl.value)) { error.value = isEn.value ? 'Enter valid trace and demo URLs.' : '请输入有效的轨迹与 Demo 链接。'; return }
  error.value = ''
  submitting.value = true
  const { error: dbError } = await supabase.from('submissions').upsert({
    team_id: myTeam.value.id,
    round: round.value,
    github_url: githubUrl.value.trim(),
    trace_url: traceUrl.value.trim(),
    demo_url: demoUrl.value.trim(),
    submitted_by: user.value.id,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'team_id,round' })
  submitting.value = false
  if (dbError) { error.value = dbError.message; return }
  submitted.value = true
  await loadSubmission()
  submitted.value = true
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex flex-col items-center py-28 px-4">
    <div class="w-full max-w-xl">
      <router-link to="/" class="inline-flex text-text-tertiary hover:text-text-primary mb-8">← {{ isEn ? 'Back' : '返回' }}</router-link>
      <h1 class="heading-serif text-4xl text-text-primary mb-2">{{ isEn ? 'Submit Your Work' : '提交作品' }}</h1>
      <p class="text-sm text-text-secondary mb-8">{{ isEn ? 'Submit the runnable rebuild, complete production trace, and a 3–5 minute demo.' : '提交可运行的复刻、完整生产轨迹，以及 3–5 分钟 Demo。' }}</p>

      <div v-if="!isLoggedIn && !teamsLoading" class="panel">{{ isEn ? 'Please log in to submit.' : '请先登录。' }}</div>
      <div v-else-if="teamsLoading" class="panel">{{ isEn ? 'Loading…' : '加载中……' }}</div>
      <div v-else-if="!myTeam" class="panel text-center">
        <p>{{ isEn ? 'Join or create a team before submitting.' : '提交前请先加入或创建队伍。' }}</p>
        <router-link :to="{ path: '/', hash: '#teams' }" class="inline-block mt-4 text-accent">{{ isEn ? 'Go to Teams' : '前往队伍' }}</router-link>
      </div>
      <div v-else-if="!isLeader" class="panel">{{ isEn ? 'Only the team lead can submit or update this package.' : '只有队长可以提交或更新作品。' }}</div>
      <form v-else @submit.prevent="submit" class="panel space-y-5">
        <div>
          <label class="label">{{ isEn ? 'Stage' : '赛程阶段' }}</label>
          <div class="grid sm:grid-cols-2 gap-2">
            <button v-for="option in roundOptions" :key="option.id" type="button" @click="round = option.id as any" class="p-3 border text-left" :class="round === option.id ? 'border-accent bg-accent/10' : 'border-border'">
              <span class="block text-sm font-bold text-text-primary">{{ option.label }}</span><span class="text-[10px] text-text-muted">{{ option.dates }}</span>
            </button>
          </div>
        </div>
        <div><label class="label">{{ isEn ? 'GitHub repository' : 'GitHub 仓库' }}</label><input v-model="githubUrl" required type="url" placeholder="https://github.com/your-org/project" class="input" /><p class="hint">{{ isEn ? 'Include source code and startup instructions.' : '包含源码与启动方式。' }}</p></div>
        <div><label class="label">{{ isEn ? 'Production trace URL' : '生产轨迹链接' }}</label><input v-model="traceUrl" required type="url" placeholder="https://…/trace.jsonl" class="input" /><p class="hint">{{ isEn ? 'Prompts, tool calls, agent iterations, and human intervention points.' : 'Prompts、工具调用、agent 迭代与人工干预点。' }}</p></div>
        <div><label class="label">{{ isEn ? '3–5 minute demo URL' : '3–5 分钟 Demo 链接' }}</label><input v-model="demoUrl" required type="url" placeholder="https://…" class="input" /></div>
        <p v-if="existingSubmission && !submitted" class="text-sm text-emerald-400">{{ isEn ? 'A submission exists for this stage. Saving will update it.' : '该阶段已有提交；保存后将更新。' }}</p>
        <p v-if="submitted" class="text-sm text-emerald-400">{{ isEn ? 'Submission saved.' : '提交已保存。' }}</p>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button :disabled="submitting" class="w-full py-3 bg-btn-bg text-btn-text text-sm font-bold uppercase tracking-widest disabled:opacity-50">{{ submitting ? (isEn ? 'Saving…' : '保存中……') : (isEn ? 'Save Submission' : '保存提交') }}</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.panel { padding: 1.5rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.label { display: block; color: var(--color-text-secondary); font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; margin-bottom: .5rem; }
.input { width: 100%; padding: .8rem 1rem; background: var(--color-input-bg); border: 1px solid var(--color-input-border); color: var(--color-text-primary); outline: none; }
.input:focus { border-color: var(--color-accent); }
.hint { color: var(--color-text-muted); font-size: .68rem; margin-top: .4rem; }
</style>
