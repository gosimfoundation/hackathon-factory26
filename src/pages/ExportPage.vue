<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useI18n } from '../composables/useI18n'

const authed = ref(false)
const { pick } = useI18n()
const passInput = ref('')
const rows = ref<any[]>([])
const loading = ref(false)

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function checkPass() {
  const hash = await sha256hex(passInput.value)
  const { data } = await supabase.from('admin_config').select('value').eq('key', 'export_pass_hash').single()
  if (data && data.value === hash) {
    authed.value = true
    await loadData()
  } else {
    alert(pick('Wrong password', '密码错误'))
  }
}

async function loadData() {
  loading.value = true
  const { data: profiles } = await supabase
    .from('profiles')
    .select('name, email, wechat, country, city, organization, age_range, team_id')
    .not('team_id', 'is', null)
  const { data: teams } = await supabase.from('teams').select('id, name, model')
  const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]))
  rows.value = (profiles || []).map(p => ({
    name: p.name || '',
    email: p.email || '',
    wechat: p.wechat || '',
    country: p.country || '',
    city: p.city || '',
    organization: p.organization || '',
    ageRange: p.age_range || '',
    team: teamMap[p.team_id]?.name || '',
    model: teamMap[p.team_id]?.model || '',
  })).sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name))
  loading.value = false
}

function exportCSV() {
  const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const header = ['Name', 'Email', 'WeChat', 'Country', 'City', 'Organization / School', 'Age Range', 'Team', 'Model']
  const lines = rows.value.map(r => [r.name, r.email, r.wechat, r.country, r.city, r.organization, r.ageRange, r.team, r.model].map(csvCell).join(','))
  const csv = [header.map(csvCell).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `hackathon-teams-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(rows.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `hackathon-teams-${new Date().toISOString().slice(0,10)}.json`
  a.click(); URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col items-center py-20 px-4">
    <div v-if="!authed" class="w-full max-w-sm mt-20">
      <h1 class="text-2xl font-bold mb-6 text-center">{{ pick('Export — Team Members', '导出队伍成员') }}</h1>
      <form @submit.prevent="checkPass" class="space-y-4">
        <input v-model="passInput" type="password" :placeholder="pick('Admin password', '管理员密码')" autofocus
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none" />
        <button type="submit" class="w-full py-3 bg-gray-800 text-white font-bold uppercase tracking-widest hover:bg-gray-700 transition-colors">{{ pick('Enter', '进入') }}</button>
      </form>
    </div>

    <div v-else class="w-full max-w-7xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">{{ pick('Team Members', '队伍成员') }}</h1>
          <p class="text-sm text-gray-500">{{ rows.length }} {{ pick('people in teams', '人已加入队伍') }}</p>
        </div>
        <div class="flex gap-3">
          <button @click="exportCSV" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-sm font-bold uppercase tracking-widest transition-colors">CSV</button>
          <button @click="exportJSON" class="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-sm font-bold uppercase tracking-widest transition-colors">JSON</button>
        </div>
      </div>

      <div v-if="loading" class="text-gray-500 text-center py-12">{{ pick('Loading...', '加载中……') }}</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 uppercase border-b border-gray-800">
            <th class="py-3 px-3">#</th>
            <th class="py-3 px-3">{{ pick('Name', '姓名') }}</th>
            <th class="py-3 px-3">{{ pick('Email', '邮箱') }}</th>
            <th class="py-3 px-3">{{ pick('WeChat', '微信') }}</th>
            <th class="py-3 px-3">{{ pick('Location', '地区') }}</th>
            <th class="py-3 px-3">{{ pick('Organization / School', '单位 / 学校') }}</th>
            <th class="py-3 px-3">{{ pick('Age Range', '年龄段') }}</th>
            <th class="py-3 px-3">{{ pick('Team', '队伍') }}</th>
            <th class="py-3 px-3">{{ pick('Model', '模型') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="border-b border-gray-800/50 hover:bg-gray-900/50">
            <td class="py-2 px-3 text-gray-600">{{ i + 1 }}</td>
            <td class="py-2 px-3">{{ r.name }}</td>
            <td class="py-2 px-3 text-gray-400">{{ r.email }}</td>
            <td class="py-2 px-3 text-gray-400">{{ r.wechat || '—' }}</td>
            <td class="py-2 px-3 text-gray-400">{{ [r.city, r.country].filter(Boolean).join(', ') || '—' }}</td>
            <td class="py-2 px-3 text-gray-400">{{ r.organization || '—' }}</td>
            <td class="py-2 px-3 text-gray-500">{{ r.ageRange || '—' }}</td>
            <td class="py-2 px-3 text-gray-400">{{ r.team }}</td>
            <td class="py-2 px-3 text-gray-500">{{ r.model }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
