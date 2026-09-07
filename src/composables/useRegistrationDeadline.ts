import { computed, onMounted, onUnmounted, ref } from 'vue'

// Registration remains available through 23:59 on September 7 in Beijing.
export const REGISTRATION_CLOSES_AT = '2026-09-08T00:00:00+08:00'
const registrationClosesAtMs = Date.parse(REGISTRATION_CLOSES_AT)

export function registrationIsClosed(now = Date.now()): boolean {
  return now >= registrationClosesAtMs
}

export function useRegistrationDeadline() {
  const now = ref(Date.now())
  let timer: number | undefined

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = Date.now()
    }, 30_000)
  })

  onUnmounted(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })

  return {
    isClosed: computed(() => now.value >= registrationClosesAtMs),
  }
}
