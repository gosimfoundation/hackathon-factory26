<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { assetUrl } from '../../composables/api'
const { t, pick } = useI18n()
const confirmed = computed(() => t('sponsors.confirmed') as any[])
</script>

<template>
  <section id="sponsors" class="bg-bg-secondary py-20 md:py-28">
    <div class="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-14">
      <div class="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div class="reveal">
          <span class="section-kicker">{{ pick('08 / Partners & Experts', '08 / 合作方与专家') }}</span>
          <h2 class="mt-8 text-4xl font-semibold tracking-[-0.055em] text-text-primary md:text-6xl">{{ t('sponsors.title') }}</h2>
        </div>
        <div class="reveal reveal-delay-1">
          <div class="grid gap-4 sm:grid-cols-2">
            <a
              v-for="(item, i) in confirmed"
              :key="item.id"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${item.name} — ${pick('visit website', '访问网站')}`"
              class="sponsor-logo-card group border border-border bg-bg-card transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div class="flex h-32 items-center justify-center bg-white px-7 py-5">
                <div class="sponsor-logo-lockup">
                  <template v-if="item.logo">
                    <img
                      :src="assetUrl(item.logo)"
                      :alt="item.name"
                      class="sponsor-logo"
                    />
                    <span v-if="item.id === 'qiwoo'" class="sponsor-qiwoo-wordmark">{{ item.name }}</span>
                  </template>
                  <span v-else class="sponsor-text-logo">{{ item.name }}</span>
                </div>
              </div>
              <div class="grid grid-cols-[2.25rem_1fr_auto] border-t border-border px-4 py-4">
                <span class="font-mono text-xs text-accent">0{{ i + 1 }}</span>
                <div>
                  <h3 class="text-sm font-semibold leading-snug text-text-primary">{{ item.name }}</h3>
                  <p class="mono-label mt-1 text-text-muted">{{ item.role }}</p>
                </div>
                <span class="text-base text-text-muted transition-colors group-hover:text-accent" aria-hidden="true">↗</span>
              </div>
            </a>
          </div>
          <p class="mono-label mt-6 text-text-muted">{{ t('sponsors.pending') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sponsor-logo-lockup {
  align-items: center;
  display: flex;
  gap: 1rem;
  height: 4.75rem;
  justify-content: center;
  width: min(100%, 16rem);
}

.sponsor-logo {
  height: 3.5rem;
  max-width: 100%;
  object-fit: contain;
  flex: 0 0 auto;
  width: auto;
}

.sponsor-qiwoo-wordmark,
.sponsor-text-logo {
  color: #0f172a;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  font-weight: 650;
  letter-spacing: -.03em;
  line-height: 1.15;
  text-align: center;
}

.sponsor-qiwoo-wordmark {
  text-align: left;
}
</style>
