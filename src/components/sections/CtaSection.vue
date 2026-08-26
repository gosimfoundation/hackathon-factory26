<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
import { useAuth } from '../../composables/useAuth'
const { t, pick } = useI18n()
const { isLoggedIn, promptAuth } = useAuth()

function handleRegistrationAccess() {
  if (!isLoggedIn.value) {
    promptAuth('login')
    return
  }
  document.querySelector('#teams')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section class="bg-[#82485f] py-20 text-white md:py-28">
    <div class="reveal mx-auto grid max-w-[1440px] gap-10 px-6 md:px-10 lg:grid-cols-[1fr_auto] lg:items-end xl:px-14">
      <div>
        <span class="font-mono text-xs uppercase tracking-[.12em]">{{ pick('11 / Register', '11 / 最终报名') }}</span>
        <h2 class="mt-8 max-w-[12ch] text-[clamp(2.75rem,6vw,6rem)] font-semibold leading-[1.16] tracking-[-.05em] md:leading-[1.12]">{{ t('cta.title') }}</h2>
        <p class="mt-8 max-w-2xl text-base font-medium leading-relaxed md:text-xl">{{ t('cta.tagline') }}</p>
        <p class="mono-label mt-4">{{ t('cta.location') }}</p>
      </div>
      <button type="button" @click="handleRegistrationAccess" class="inline-flex min-w-48 items-center justify-between border border-white bg-white px-6 py-4 text-xs font-semibold uppercase tracking-[.14em] text-[#4b1f3c] transition-colors hover:bg-transparent hover:text-white">
        {{ pick('Register / Sign In', '报名/登录') }} <span class="ml-8">↗</span>
      </button>
    </div>
  </section>
</template>
