<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { assetUrl } from '../composables/api'

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

const announcementUrl = 'https://mp.weixin.qq.com/s?__biz=Mzg5MTc2NzA1MQ==&mid=2247486424&idx=1&sn=7d64c4cf0948de75d895c57dc810a477&scene=21#wechat_redirect'

// 两个半天，六讲课程。第一条技术路线：测试驱动与需求编译。
const meetings = [
  { date: '2026.9.10', id: '160444306', password: '216857' },
  { date: '2026.9.11', id: '198246412', password: '517088' },
]

const sessions = [
  {
    number: '01',
    day: '9/10',
    zhTitle: '基于智能体的测试驱动开发',
    enTitle: 'Agent-driven test-driven development',
  },
  {
    number: '02',
    day: '9/10',
    zhTitle: '模型选择与预算分析',
    enTitle: 'Model selection and budget analysis',
  },
  {
    number: '03',
    day: '9/10',
    zhTitle: '可视化的需求编译',
    enTitle: 'Visual requirement compilation',
  },
  {
    number: '04',
    day: '9/11',
    zhTitle: '需求编译中的人机交互实践',
    enTitle: 'Human-agent interaction in requirement compilation',
  },
  {
    number: '05',
    day: '9/11',
    zhTitle: '版本管理与智能体调试',
    enTitle: 'Version control and agent debugging',
  },
  {
    number: '06',
    day: '9/11',
    zhTitle: '需求的增量迭代与演化',
    enTitle: 'Incremental iteration and evolution of requirements',
  },
]

const resources = [
  {
    zhTitle: '第二课课堂录像',
    enTitle: 'Session 2 recording',
    url: 'https://www.bilibili.com/video/BV1h3YE6WEyz/',
    icon: 'video',
    zhNote: '9 月 11 日下午 13:30（北京时间）开启线上授课和实践，课后录像发布在这里。',
    enNote: 'Teaching and hands-on practice began 13:30 Beijing time on September 11; the recording is posted here afterwards.',
  },
  {
    zhTitle: '第一课课堂录像',
    enTitle: 'Session 1 recording',
    url: 'https://www.bilibili.com/video/BV1a5Yu68EcS/',
    icon: 'video',
    zhNote: '9 月 10 日下午 13:30（北京时间）开启线上授课和实践，课后录像发布在这里。',
    enNote: 'Teaching and hands-on practice began 13:30 Beijing time on September 10; the recording is posted here afterwards.',
  },
  {
    zhTitle: '第一课课程材料和 Lab',
    enTitle: 'Session 1 materials and labs',
    url: 'https://github.com/code-philia/agentic-software-engineering-hackathon',
    icon: 'github',
    zhNote: '第一课课堂材料与课程 lab 都在这个仓库里。',
    enNote: 'Session materials and the course labs live in this repository.',
  },
  {
    zhTitle: '竞赛 / 练习平台 ARC-Bench',
    enTitle: 'Competition and practice platform: ARC-Bench',
    url: 'https://arc-bench.com/',
    icon: 'platform',
    zhNote: '比赛与日常练习都在 ARC-Bench 上进行。注册方式见下。',
    enNote: 'Both the competition and everyday practice run on ARC-Bench. Registration steps are below.',
  },
  {
    zhTitle: 'API 用量查询',
    enTitle: 'API usage meter',
    url: 'https://meter.arc-bench.com/user',
    icon: 'meter',
    zhNote: '用你的 API key 进入，查看当前用量。',
    enNote: 'Sign in with your API key to check your current usage.',
  },
  {
    zhTitle: '课程交流讨论区',
    enTitle: 'Course discussion board',
    url: 'https://bbs.qiwoo.edu.cn/t/topic/15',
    icon: 'qiwoo',
    zhNote: '课程相关的问题在这里问。',
    enNote: 'Questions about the sessions go here.',
  },
  {
    zhTitle: '赛事交流讨论区',
    enTitle: 'Competition discussion board',
    url: 'https://bbs.qiwoo.edu.cn/t/topic/16',
    icon: 'qiwoo',
    zhNote: '赛事规则、平台与提交相关的问题在这里问。',
    enNote: 'Questions about the rules, the platform, and submissions go here.',
  },
]

const registrationSteps = [
  { zh: '进入 arc-bench.com 首页', en: 'Open the arc-bench.com home page' },
  { zh: '点击右上角 Register', en: 'Click Register in the top right' },
  { zh: '选择 Hackathon account', en: 'Choose Hackathon account' },
  { zh: '使用黑客松官网报名时填写的邮箱注册并登录', en: 'Register and sign in with the email address you used for the hackathon registration' },
  { zh: '登录后点击右上角的用户名缩写图标，进入个人空间', en: 'Once signed in, click the initials avatar in the top right to open your personal space' },
  { zh: '在左侧查看并复制 API key', en: 'Find and copy your API key in the left-hand panel' },
]
</script>

<template>
  <article class="py-32 bg-bg-primary min-h-screen">
    <div class="max-w-3xl mx-auto px-6 bootcamp-content">
      <router-link to="/" class="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors mb-12">← {{ isEn ? 'Back to Home' : '返回首页' }}</router-link>

      <h1 class="heading-serif text-4xl md:text-5xl text-text-primary mb-4">{{ isEn ? 'Bootcamp' : '研习营' }}</h1>
      <p class="text-text-tertiary mb-2">{{ isEn ? 'September 10 – 11, 2026 · 13:30 – 16:30 · Online' : '2026 年 9 月 10 – 11 日 · 下午 1:30 – 4:30 · 线上' }}</p>
      <p class="text-text-muted text-sm mb-12">{{ isEn ? 'Six sessions putting every participant on the same technical and resource footing.' : '六讲课程，把所有参赛者放到同一条技术与资源起跑线上。' }}</p>

      <p class="lede">
        <a :href="announcementUrl" target="_blank" rel="noopener noreferrer" class="inline-link">{{ isEn ? 'The Agentic Software Factory Hackathon' : '智能体软件工厂黑客松' }} ↗</a>
        {{ isEn
          ? ' opens on September 21. The competition asks participants to build software engineering agents that turn a precise requirements document into a running software system. To put everyone on the same technical and resource footing, the bootcamp offers six sessions covering the basic infrastructure of the competition, along with a set of technical routes to choose between.'
          : '将于 9 月 21 日举行。本次大赛旨在鼓励参赛者构建软件工程智能体，将明确的需求文档转化成可运行的软件系统。为了将所有参赛者放到一个统一的技术与资源起跑线上，本次大赛提供了六讲课程，帮助参赛的选手们了解赛事基本基础设施的使用，并且提供一系列技术路线供大家选择。' }}
      </p>

      <section>
        <h2>{{ isEn ? '1. When and how to join' : '1. 开课日期与参与方式' }}</h2>
        <p><strong>{{ isEn ? 'Dates' : '开课日期' }}</strong> — {{ isEn ? 'September 10 – 11, 2026, 13:30 – 16:30 Beijing time.' : '2026 年 9 月 10 – 11 日，下午 1:30 – 4:30（北京时间）。' }}</p>
        <p><strong>{{ isEn ? 'How to join' : '参与方式' }}</strong> — {{ isEn ? 'Tencent Meeting, a different room each day:' : '腾讯会议，两天各一个会议号：' }}</p>
        <ul class="meetinglist">
          <li v-for="m in meetings" :key="m.date">
            <span class="meeting-date">{{ m.date }}</span>
            <span class="meeting-detail">{{ isEn ? 'Tencent Meeting ID' : '腾讯会议号' }} <code>{{ m.id }}</code></span>
            <span class="meeting-detail">{{ isEn ? 'Password' : '密码' }} <code>{{ m.password }}</code></span>
          </li>
        </ul>
      </section>

      <section>
        <h2>{{ isEn ? '2. The six sessions' : '2. 六讲课程' }}</h2>
        <p>{{ isEn
          ? 'Beyond the competition principles, the evaluation, and the use of the infrastructure, we are starting with the first of the technical routes on offer: test-driven development and requirement compilation. The provisional syllabus:'
          : '除了讲解比赛原则、评估与基础设施使用，我们首先推出了本次比赛的技术路线之一：测试驱动与需求编译。暂定的讲授内容为：' }}</p>

        <ul class="sessionlist">
          <li v-for="s in sessions" :key="s.number">
            <div class="session-head">
              <span class="session-no">{{ s.number }}</span>
              <div>
                <strong>{{ isEn ? s.enTitle : s.zhTitle }}</strong>
              </div>
              <span class="session-tba">{{ s.day }}</span>
            </div>
          </li>
        </ul>

        <p class="muted">{{ isEn ? 'We hope prospective participants will follow along hands-on, and we welcome your feedback whenever something does not work.' : '我们期待拟参赛的选手能动手实践，如果有问题也欢迎向我们及时反馈。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '3. Course material index' : '3. 课程资料索引' }}</h2>

        <ul class="sessionlist">
          <li v-for="r in resources" :key="r.url">
            <div class="session-head">
              <span class="res-icon" aria-hidden="true">
                <img v-if="r.icon === 'qiwoo'" :src="assetUrl('/sponsors/qiwoo.svg')" alt="" class="res-logo" />
                <svg v-else-if="r.icon === 'github'" viewBox="0 0 19 19" class="res-glyph"><path fill="currentColor" fill-rule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clip-rule="evenodd"/></svg>
                <svg v-else-if="r.icon === 'video'" viewBox="0 0 24 24" class="res-glyph res-stroke"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m10 9.5 4.5 2.5-4.5 2.5z"/></svg>
                <svg v-else-if="r.icon === 'meter'" viewBox="0 0 24 24" class="res-glyph res-stroke"><path d="M3.5 18a8.5 8.5 0 1 1 17 0"/><path d="m12 18 4-5.5"/></svg>
                <svg v-else viewBox="0 0 24 24" class="res-glyph res-stroke"><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5M13.5 15h4"/></svg>
              </span>
              <div>
                <strong>{{ isEn ? r.enTitle : r.zhTitle }}</strong>
                <a :href="r.url" target="_blank" rel="noopener noreferrer" class="session-sub session-link">{{ r.url }} ↗</a>
              </div>
            </div>
            <span class="block">{{ isEn ? r.enNote : r.zhNote }}</span>
          </li>
        </ul>
      </section>

      <section>
        <h2>{{ isEn ? '4. Registering on ARC-Bench' : '4. ARC-Bench 平台注册' }}</h2>
        <ol>
          <li v-for="step in registrationSteps" :key="step.en">{{ isEn ? step.en : step.zh }}</li>
        </ol>
        <p class="muted">{{ isEn ? 'The API key from your personal space is what signs you in to the usage meter at meter.arc-bench.com.' : '个人空间里的 API key，也是登录 meter.arc-bench.com 查询用量时使用的凭证。' }}</p>
      </section>

      <p class="closing">{{ isEn ? 'Questions the bootcamp did not answer are worth telling us about — an unanswered question is a gap in our material, not in your preparation.' : '研习营没答上的问题，欢迎告诉我们——问题没被答上，说明缺的是我们的材料，不是你的准备。' }}</p>
    </div>
  </article>
</template>

<style scoped>
.bootcamp-content section { border-top: 1px solid var(--color-border); padding-top: 2.5rem; margin-top: 2.5rem; }
.bootcamp-content h2 { font-family: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif; color: var(--color-text-primary); font-size: 1.6rem; font-weight: 600; letter-spacing: -.035em; margin-bottom: 1rem; }
.bootcamp-content p, .bootcamp-content li { color: var(--color-text-secondary); line-height: 1.85; margin-bottom: .75rem; }
.bootcamp-content ul, .bootcamp-content ol { padding-left: 1.35rem; list-style: disc; }
.bootcamp-content ol { list-style: decimal; }
.bootcamp-content .lede { font-size: 1.075rem; color: var(--color-text-tertiary); line-height: 1.9; }
.bootcamp-content .muted { color: var(--color-text-muted); font-size: .9rem; }
.bootcamp-content .closing { border-top: 1px solid var(--color-border); padding-top: 2.5rem; margin-top: 2.5rem; color: var(--color-text-tertiary); }
.bootcamp-content .inline-link { color: var(--color-text-primary); text-decoration: none; border-bottom: 1px solid var(--color-accent); transition: color .2s ease; }
.bootcamp-content .inline-link:hover { color: var(--color-accent); }
.bootcamp-content .sessionlist { list-style: none; padding-left: 0; margin-top: 1.75rem; }
.bootcamp-content .sessionlist li { border-left: 2px solid var(--color-border); padding-left: 1rem; margin-bottom: 1.5rem; }
.bootcamp-content .session-head { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; }
.bootcamp-content .session-no { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .72rem; color: var(--color-accent); }
.bootcamp-content .session-head strong { color: var(--color-text-primary); font-weight: 600; }
.bootcamp-content .session-link { display: table; color: var(--color-text-tertiary); text-decoration: none; border-bottom: 1px solid var(--color-accent); transition: color .2s ease; word-break: break-all; }
.bootcamp-content .session-link:hover { color: var(--color-accent); }
.bootcamp-content .session-sub { display: block; font-size: .88rem; color: var(--color-text-tertiary); margin-top: .15rem; }
.bootcamp-content .session-tba { margin-left: auto; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-muted); border: 1px solid var(--color-border); padding: .15rem .45rem; white-space: nowrap; }
.bootcamp-content .sessionlist span.block { color: var(--color-text-muted); font-size: .92rem; line-height: 1.7; margin-top: .45rem; }
.bootcamp-content .res-icon { display: inline-flex; align-items: center; justify-content: center; width: 1.35rem; height: 1.35rem; flex: none; align-self: flex-start; margin-top: .15rem; color: var(--color-text-tertiary); }
.bootcamp-content .sessionlist li:hover .res-icon { color: var(--color-accent); }
.bootcamp-content .res-glyph { width: 100%; height: 100%; }
.bootcamp-content .res-stroke { fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.bootcamp-content .res-logo { width: auto; height: 100%; object-fit: contain; }
.bootcamp-content .meetinglist { list-style: none; padding-left: 0; margin-top: 1rem; }
.bootcamp-content .meetinglist li { display: flex; align-items: baseline; gap: .75rem 1.25rem; flex-wrap: wrap; border-left: 2px solid var(--color-border); padding-left: 1rem; margin-bottom: 1rem; }
.bootcamp-content .meeting-date { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .8rem; color: var(--color-accent); }
.bootcamp-content .meeting-detail { font-size: .92rem; color: var(--color-text-muted); }
.bootcamp-content .meeting-detail code { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .92rem; color: var(--color-text-primary); letter-spacing: .04em; }
</style>
