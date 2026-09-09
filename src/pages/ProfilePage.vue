<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useI18n } from '../composables/useI18n'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const { pick, roleLabel, trackLabel } = useI18n()
const { isLoggedIn, promptAuth } = useAuth()
const profile = ref<Record<string, any> | null>(null)
const loading = ref(true)
const needsLogin = ref(false)
const loadFailed = ref(false)
let loadVersion = 0

function getGitHubAvatar(githubId?: string): string {
  if (!githubId) return ''
  return `https://avatars.githubusercontent.com/${githubId.replace(/^@/, '')}`
}

async function loadProfile() {
  const version = ++loadVersion
  const userId = String(route.params.id || '')
  loading.value = true
  profile.value = null
  needsLogin.value = false
  loadFailed.value = false
  try {
    // A QR scan often opens a different, signed-out browser. Anonymous RLS
    // results cannot tell us whether this registration exists.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (version !== loadVersion) return
    if (sessionError) throw sessionError
    if (!session) {
      needsLogin.value = true
      return
    }
    const { data, error } = await supabase.from('profiles')
      .select('id,name,avatar,github_id,role,approved,checked_in,bio,themes,discord,twitter,telegram')
      .eq('id', userId).maybeSingle()
    if (version !== loadVersion) return
    if (error) throw error
    profile.value = data
  } catch {
    if (version === loadVersion) loadFailed.value = true
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

watch([() => route.params.id, isLoggedIn], loadProfile, { immediate: true })
onUnmounted(() => { loadVersion++ })
</script>

<template>
  <div class="min-h-screen bg-bg-primary pt-24 pb-16">
    <div class="max-w-md mx-auto px-6">
      <div v-if="loading" class="text-center text-text-secondary py-20">{{ pick('Loading...', '加载中……') }}</div>
      <div v-else-if="needsLogin" class="text-center text-text-secondary py-20">
        <h1 class="text-xl font-bold text-text-primary mb-3">{{ pick('Log in to view registration details', '请登录后查看报名资料') }}</h1>
        <p class="text-sm mb-6">{{ pick('This browser is not logged in. After logging in, this registration will open automatically.', '当前浏览器尚未登录。登录后会自动打开这份报名资料。') }}</p>
        <button type="button" @click="promptAuth('login')" class="px-6 py-3 bg-btn-bg text-btn-text font-semibold">{{ pick('Log in', '登录') }}</button>
      </div>
      <div v-else-if="loadFailed" role="alert" class="text-center text-text-secondary py-20">
        <p class="mb-4">{{ pick('Unable to load registration details. Please try again.', '报名资料加载失败，请重试。') }}</p>
        <button type="button" @click="loadProfile" class="px-6 py-3 bg-btn-bg text-btn-text font-semibold">{{ pick('Retry', '重试') }}</button>
      </div>
      <div v-else-if="!profile" class="text-center text-text-secondary py-20">{{ pick('User not found.', '未找到该用户。') }}</div>
      <div v-else class="bg-bg-secondary border border-border p-8">
        <div class="flex flex-col items-center text-center mb-6">
          <img :src="profile.avatar || getGitHubAvatar(profile.github_id)" class="w-24 h-24 rounded-full object-cover mb-3 border-2 border-border" />
          <h1 class="text-2xl font-bold text-text-primary">{{ profile.name }}</h1>
          <p v-if="profile.role" class="text-sm text-text-secondary mt-1">{{ roleLabel(profile.role) }}</p>
          <span v-if="profile.approved" class="inline-block mt-2 px-4 py-1.5 text-sm bg-green-900/30 text-green-400 border border-green-500/30 font-bold tracking-wider">{{ pick('DEMO DAY INVITATION CONFIRMED', 'DEMO DAY 邀请已确认') }}</span>
          <span v-if="profile.approved && profile.checked_in" class="inline-block mt-1 px-3 py-0.5 text-[10px] text-text-muted">{{ pick('Checked in at Demo Day', '已在 Demo Day 签到') }}</span>
        </div>

        <div v-if="profile.bio" class="mb-4">
          <p class="text-xs text-text-muted uppercase tracking-wider mb-1">{{ pick('Bio', '个人简介') }}</p>
          <p class="text-sm text-text-secondary">{{ profile.bio }}</p>
        </div>

        <div v-if="profile.themes?.length" class="mb-4">
          <p class="text-xs text-text-muted uppercase tracking-wider mb-2">{{ pick('Capability Domains', '能力域') }}</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="theme in profile.themes" :key="theme" class="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">{{ trackLabel(theme) }}</span>
          </div>
        </div>

        <div class="space-y-2 mb-6">
          <a v-if="profile.github_id" :href="`https://github.com/${profile.github_id.replace(/^@/, '')}`" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <span class="w-5 text-center">GH</span> {{ profile.github_id }}
          </a>
          <p v-if="profile.discord" class="flex items-center gap-2 text-sm text-text-secondary"><span class="w-5 text-center">DC</span> {{ profile.discord }}</p>
          <a v-if="profile.twitter" :href="`https://x.com/${profile.twitter.replace(/^@/, '')}`" target="_blank" class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <span class="w-5 text-center">X</span> {{ profile.twitter }}
          </a>
          <p v-if="profile.telegram" class="flex items-center gap-2 text-sm text-text-secondary"><span class="w-5 text-center">TG</span> {{ profile.telegram }}</p>
        </div>

      </div>
    </div>
  </div>
</template>
