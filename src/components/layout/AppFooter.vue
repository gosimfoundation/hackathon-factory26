<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <footer class="bg-[#111310] border-t border-white/15 py-10 text-white">
    <div class="max-w-[1440px] mx-auto px-6 md:px-10 xl:px-14">
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <div class="text-2xl font-semibold tracking-[-.05em]">OAIC <span class="text-[#c788a1]">/</span> SOFTWARE FACTORY</div>
          <div class="mt-3 max-w-xl text-white/45 text-xs">{{ t('footer.copyright') }}</div>
        </div>
        <div class="flex items-center gap-6">
          <a href="http://arc-bench.com" target="_blank" rel="noopener" class="font-mono text-xs uppercase tracking-[.12em] text-white/60 hover:text-white transition-colors">
            {{ t('footer.mainSite') }}
          </a>
          <router-link :to="{ path: '/', hash: '#teams' }" class="font-mono text-xs uppercase tracking-[.12em] text-[#dca6b9] hover:text-white transition-colors">
            {{ t('footer.register') }} ↗
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>
