<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'
import { useI18n } from '../composables/useI18n'
import { publicSiteUrl } from '../composables/api'

const route = useRoute()
const { pick, roleLabel, trackLabel } = useI18n()
const userId = route.params.id as string
const profile = ref<Record<string, any> | null>(null)
const loading = ref(true)
const qrDataUrl = ref('')

function getGitHubAvatar(githubId?: string): string {
  if (!githubId) return ''
  return `https://avatars.githubusercontent.com/${githubId.replace(/^@/, '')}`
}

onMounted(async () => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  profile.value = data
  loading.value = false

  if (data) {
    qrDataUrl.value = await QRCode.toDataURL(publicSiteUrl(`/profile/${userId}`), {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-primary pt-24 pb-16">
    <div class="max-w-md mx-auto px-6">
      <div v-if="loading" class="text-center text-text-secondary py-20">{{ pick('Loading...', '加载中……') }}</div>
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

        <div v-if="qrDataUrl" class="flex flex-col items-center pt-4 border-t border-border">
          <p class="text-xs text-text-muted uppercase tracking-wider mb-3">{{ pick('Registration QR Code', '报名二维码') }}</p>
          <img :src="qrDataUrl" class="w-32 h-32" />
          <p class="text-[10px] text-text-muted mt-2">{{ pick('Scan to open this registration record', '扫码打开这份报名资料') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
