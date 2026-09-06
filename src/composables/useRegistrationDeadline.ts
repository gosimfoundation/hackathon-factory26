import { computed, onMounted, onUnmounted, ref } from 'vue'

// Registration remains available for the full September 8 calendar day in Beijing.
export const REGISTRATION_CLOSES_AT = '2026-09-09T00:00:00+08:00'
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
