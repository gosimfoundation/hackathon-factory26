import { ref, provide, inject, watch, type InjectionKey, type Ref } from 'vue'
import en from '../i18n/en'
import zh from '../i18n/zh'

type Messages = Record<string, any>
type Locale = 'en' | 'zh'

const I18N_KEY: InjectionKey<{
  locale: Ref<Locale>
  t: (key: string) => any
  pick: <T>(english: T, chinese: T) => T
  roleLabel: (role?: string) => string
  trackLabel: (track?: string) => string
  toggleLocale: () => void
}> = Symbol('i18n')

const messages: Record<Locale, Messages> = { en, zh }

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj) ?? path
}

export function provideI18n() {
  const savedLocale = typeof window !== 'undefined' ? window.localStorage.getItem('oaic-locale') : null
  const locale = ref<Locale>(savedLocale === 'en' || savedLocale === 'zh' ? savedLocale : 'zh')

  if (typeof document !== 'undefined') {
    watch(locale, (value) => {
      document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en'
      document.title = value === 'zh'
        ? '2026 OAIC 智能体工厂国际黑客松和大奖赛系列'
        : '2026 OAIC International Hackathon for Agentic Factory and Grand Challenge Series'
      const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (description) {
        description.content = value === 'zh'
          ? '2026 OAIC 智能体工厂国际黑客松和大奖赛系列——9月1日至10月17日，线上举行，并在深圳 GOSIM 大会迎来终场。'
          : '2026 OAIC International Hackathon for Agentic Factory and Grand Challenge Series — Sep 1 to Oct 17, online with a finale at GOSIM Shenzhen.'
      }
      window.localStorage.setItem('oaic-locale', value)
    }, { immediate: true })
  }

  function t(key: string): any {
    return getNestedValue(messages[locale.value], key)
  }

  function pick<T>(english: T, chinese: T): T {
    return locale.value === 'zh' ? chinese : english
  }

  function roleLabel(role?: string): string {
    if (!role) return ''
    const labels: Record<string, string> = {
      'AI Engineer': 'AI 工程师',
      'Full-Stack Developer': '全栈开发者',
      'Frontend Developer': '前端开发者',
      'Backend Developer': '后端开发者',
      Researcher: '研究者',
      Designer: '设计师',
      'Product Manager': '产品经理',
      Student: '学生',
      'Startup Founder': '创业者',
      Other: '其他',
      Unset: '未设置',
    }
    return pick(role, labels[role] || role)
  }

  function trackLabel(track?: string): string {
    if (!track) return ''
    const ids = ['auth-session', 'repository-lifecycle', 'issues-forms', 'pull-request-review', 'actions-workflow', 'org-permissions-audit', 'compute-engine']
    const englishThemes = en.tracks.themes as Array<{ title: string }>
    const chineseThemes = zh.tracks.themes as Array<{ title: string }>
    const storedLabelIndex = englishThemes.findIndex((theme, index) =>
      theme.title === track || chineseThemes[index]?.title === track
    )
    const index = ids.indexOf(track) >= 0 ? ids.indexOf(track) : storedLabelIndex
    if (index >= 0) return (t('tracks.themes') as Array<{ title: string }>)[index]?.title || track
    return track
  }

  function toggleLocale() {
    locale.value = locale.value === 'en' ? 'zh' : 'en'
  }

  provide(I18N_KEY, { locale, t, pick, roleLabel, trackLabel, toggleLocale })
  return { locale, t, pick, roleLabel, trackLabel, toggleLocale }
}

export function useI18n() {
  const i18n = inject(I18N_KEY)
  if (!i18n) throw new Error('useI18n() called without provideI18n()')
  return i18n
}
