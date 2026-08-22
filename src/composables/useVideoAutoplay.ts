import { onMounted, onUnmounted } from 'vue'

/**
 * Safari blocks autoplay even with muted+playsinline.
 * This forces .play() and falls back to showing the poster
 * as a background image if the video won't play.
 */
export function useVideoAutoplay() {
  const retryTimers: number[] = []

  function handleVideos() {
    document.querySelectorAll('video[autoplay]').forEach((v) => {
      const video = v as HTMLVideoElement

      // WebKit can evaluate autoplay before Vue's muted property is reflected
      // as an attribute, so set both forms explicitly before retrying playback.
      video.defaultMuted = true
      video.muted = true
      video.playsInline = true
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')

      if (video.poster) {
        video.style.backgroundImage = `url(${video.poster})`
        video.style.backgroundSize = 'cover'
        video.style.backgroundPosition = 'center'
      }

      if (video.paused && !video.ended) {
        void video.play().catch(() => {
          // The poster remains visible until autoplay is allowed.
        })
      }
    })
  }

  function resumeVisibleVideos() {
    if (document.visibilityState === 'visible') handleVideos()
  }

  function handleInteraction() {
    handleVideos()
  }

  onMounted(() => {
    handleVideos()
    retryTimers.push(window.setTimeout(handleVideos, 500))
    retryTimers.push(window.setTimeout(handleVideos, 2000))

    // Recover after tab suspension, history restoration, or an autoplay block.
    document.addEventListener('visibilitychange', resumeVisibleVideos)
    window.addEventListener('focus', handleVideos)
    window.addEventListener('pageshow', handleVideos)
    document.addEventListener('click', handleInteraction, { once: true, passive: true })
    document.addEventListener('touchstart', handleInteraction, { once: true, passive: true })
    document.addEventListener('scroll', handleInteraction, { once: true, passive: true })
  })

  onUnmounted(() => {
    retryTimers.forEach(window.clearTimeout)
    document.removeEventListener('visibilitychange', resumeVisibleVideos)
    window.removeEventListener('focus', handleVideos)
    window.removeEventListener('pageshow', handleVideos)
    document.removeEventListener('click', handleInteraction)
    document.removeEventListener('touchstart', handleInteraction)
    document.removeEventListener('scroll', handleInteraction)
  })
}
