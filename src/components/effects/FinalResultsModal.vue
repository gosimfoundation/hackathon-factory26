<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { finalists, repositoryLabel } from '../../lib/finalists'

const { pick } = useI18n()

// Show once per browser session so in-app navigation back to the homepage doesn't re-open it.
const STORAGE_KEY = 'factory26-final-results-seen'
const open = ref(false)

function close() {
  open.value = false
  try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* storage unavailable */ }
}

function viewOnPage() {
  close()
  document.getElementById('final-results')?.scrollIntoView({ behavior: 'smooth' })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  let seen = false
  try { seen = sessionStorage.getItem(STORAGE_KEY) === '1' } catch { /* storage unavailable */ }
  if (!seen && !location.hash) open.value = true
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-[190] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="final-results-modal-title">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />
        <div class="relative flex max-h-[85vh] w-full max-w-2xl flex-col border border-accent/30 bg-bg-primary shadow-2xl">
          <button
            @click="close"
            class="absolute top-3 right-3 text-xs uppercase tracking-widest text-text-muted hover:text-text-primary"
            :aria-label="pick('Close', '关闭')"
          >
            {{ pick('Close', '关闭') }} ✕
          </button>

          <div class="px-6 pt-6 pb-4 text-center">
            <div class="mb-3 inline-block rounded bg-accent/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
              {{ pick('Final result', '决赛结果') }}
            </div>
            <h2 id="final-results-modal-title" class="text-xl font-bold text-text-primary md:text-2xl">
              {{ pick('Final standings', '决赛成绩排行') }}
            </h2>
            <p class="mt-2 text-sm text-text-secondary">
              {{ pick('Official standings for all 20 finalist teams.', '20 支决赛队伍的官方成绩排名。') }}
            </p>
          </div>

          <ol class="min-h-0 flex-1 overflow-y-auto border-t border-border px-6">
            <li
              v-for="team in finalists"
              :key="team.rank"
              class="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-border py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,.9fr)] sm:items-center"
            >
              <span class="font-mono text-sm" :class="team.rank <= 3 ? 'font-semibold text-accent' : 'text-text-muted'">
                {{ String(team.rank).padStart(2, '0') }}
              </span>
              <span class="min-w-0 break-words text-sm font-semibold text-text-primary">{{ team.name }}</span>
              <a
                v-if="team.repository"
                :href="team.repository"
                target="_blank"
                rel="noopener noreferrer"
                class="col-start-2 min-w-0 truncate text-xs text-text-secondary hover:text-accent sm:col-start-3"
              >
                {{ repositoryLabel(team.repository) }} ↗
              </a>
            </li>
          </ol>

          <div class="flex justify-center gap-3 px-6 py-4">
            <button @click="viewOnPage" class="border border-accent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent hover:bg-accent/10">
              {{ pick('View on page', '在页面中查看') }}
            </button>
            <button @click="close" class="border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary">
              {{ pick('Close', '关闭') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
