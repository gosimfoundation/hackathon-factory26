<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../composables/useI18n'

const route = useRoute()
const { pick } = useI18n()
const hiddenPages = ['admin', 'export', 'checkin']
const shouldHide = computed(() => hiddenPages.some(p => route.path.includes(p)))
const current = ref('')
const history = ref<any[]>([])
const dismissed = ref(false)
const showHistory = ref(false)

async function load() {
  const { data } = await supabase.from('announcements').select('id, content, active, created_at').order('created_at', { ascending: false }).limit(20)
  history.value = data || []
  const active = (data || []).find((a: any) => a.active)
  current.value = active?.content || ''
  if (current.value) dismissed.value = false
}

onMounted(() => {
  load()
  supabase
    .channel('announcement-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => load())
    .subscribe()
})
</script>

<template>
  <div v-if="current && !dismissed && !shouldHide" class="fixed top-16 left-0 right-0 z-40 bg-accent text-white text-sm font-semibold py-2 px-4 flex items-center justify-center gap-3">
    <button @click="showHistory = !showHistory" class="text-white/55 hover:text-white text-xs" :title="pick('History', '历史公告')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    </button>
    <span class="flex-1 text-center">{{ current }}</span>
    <button @click="dismissed = true" class="text-white/55 hover:text-white">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>

  <!-- History dropdown -->
  <div v-if="showHistory" class="fixed top-[calc(4rem+2.25rem)] left-0 right-0 z-40 bg-gray-900 border-b border-gray-700 max-h-48 overflow-y-auto">
    <div v-for="a in history" :key="a.id" class="px-4 py-2 text-xs border-b border-gray-800/50 flex items-center justify-between"
      :class="a.active ? 'text-[#dca6b9]' : 'text-gray-500'">
      <span>{{ a.content }}</span>
      <span class="text-gray-600 shrink-0 ml-3">{{ new Date(a.created_at).toLocaleTimeString() }}</span>
    </div>
    <button @click="showHistory = false" class="w-full py-1.5 text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest">{{ pick('Close', '关闭') }}</button>
  </div>
</template>
