<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

// 第一讲打底，后五讲各讲一条参赛路径。具体时间待定，确定后在本页公布。
const sessions = [
  {
    number: '01',
    group: 'platform',
    zhTitle: 'Hello ARC!',
    enTitle: 'Hello ARC!',
    zhSubtitle: '比赛系统简介',
    enSubtitle: 'An introduction to the competition system',
    zhNote: '比赛跑在哪、题目长什么样、怎么提交、分数怎么来。先把场地认全，后面几讲才好听。',
    enNote: 'Where the competition runs, what a challenge looks like, how you submit, and where the score comes from. Get the ground under you before the rest of the sessions build on it.',
  },
  {
    number: '02',
    group: 'path',
    zhTitle: '自行编写的 Agent',
    enTitle: 'Your own agent',
    zhSubtitle: '参考实现',
    enSubtitle: 'Reference implementation',
    zhNote: '从零搭一个 Agent 来打这场比赛，需要哪些部件、接口怎么对。',
    enNote: 'Building an agent from scratch for this competition: which parts you need and how they meet the platform.',
  },
  {
    number: '03',
    group: 'path',
    zhTitle: 'Octos Agent OS',
    enTitle: 'Octos Agent OS',
    zhSubtitle: '开源 · 参考实现',
    enSubtitle: 'Open source · Reference implementation',
    zhNote: '用开源的 Octos Agent OS 打比赛的一条完整路径。',
    enNote: 'One complete route through the competition using the open-source Octos Agent OS.',
    url: 'https://github.com/octos-org/arc-adapter',
  },
  {
    number: '04',
    group: 'path',
    zhTitle: 'HAgency Software Factory',
    enTitle: 'HAgency Software Factory',
    zhSubtitle: '开源 · 参考实现',
    enSubtitle: 'Open source · Reference implementation',
    zhNote: '用开源的 HAgency Software Factory 系统打比赛的一条完整路径。',
    enNote: 'One complete route through the competition using the open-source HAgency Software Factory.',
    url: 'https://github.com/onewesong/hafleet-arc',
  },
  {
    number: '05',
    group: 'path',
    zhTitle: 'Claude Code',
    enTitle: 'Claude Code',
    zhSubtitle: '参考实现',
    enSubtitle: 'Reference implementation',
    zhNote: '用 Claude Code 打比赛的一条完整路径。',
    enNote: 'One complete route through the competition using Claude Code.',
  },
  {
    number: '06',
    group: 'path',
    zhTitle: 'Codex',
    enTitle: 'Codex',
    zhSubtitle: '参考实现',
    enSubtitle: 'Reference implementation',
    zhNote: '用 Codex 打比赛的一条完整路径。',
    enNote: 'One complete route through the competition using Codex.',
  },
]

// 三场答疑按主题分，覆盖六讲之外参赛者真正会卡住的三块：平台、路径、交付。
const officeHours = [
  {
    number: '01',
    zhTitle: '平台与规则',
    enTitle: 'Platform and rules',
    zhNote: 'ARC-Bench 怎么用、沙箱与模型网关、报名与组队、赛制与时间点。第 01 讲之后仍不清楚的，都在这一场问。',
    enNote: 'Using ARC-Bench, the sandbox and the model gateway, registration and teams, the format and its dates. Whatever session 01 left unclear belongs here.',
  },
  {
    number: '02',
    zhTitle: 'Harness 与 Agent',
    enTitle: 'Harnesses and agents',
    zhNote: '五条参考路径上的具体问题——自研 Agent、Octos、HAgency、Claude Code、Codex 的选型、搭建与踩过的坑。',
    enNote: 'The specifics of the five reference routes — choosing between your own agent, Octos, HAgency, Claude Code, and Codex, building on one, and what tends to go wrong.',
  },
  {
    number: '03',
    zhTitle: '提交与评分',
    enTitle: 'Submission and scoring',
    zhNote: '提交物到底要交什么、生产轨迹怎么留、三项指标怎么算、申诉走什么流程。安排在初赛 9 月 30 日截止之前。',
    enNote: 'What the submission package actually contains, how to keep a production trace, how the three metrics are computed, and how appeals work. Scheduled well before the qualifier closes on September 30.',
  },
]

const purposes = [
  {
    zhTitle: '讲清楚',
    enTitle: 'Make it clear',
    zhDesc: 'Harness Engineering 被谈论得远多于被实践。专家把比赛系统和几条主流技术路径当场讲透，比自己啃文档快。',
    enDesc: 'Harness Engineering is talked about far more than it is practised. An expert walking through the system and the main technical routes gets you there faster than reading the documentation alone.',
  },
  {
    zhTitle: '答疑',
    enTitle: 'Answer questions',
    zhDesc: '组织者与参赛者之间的直接通道。规则、平台、评分上拿不准的，当场问，当场答。',
    enDesc: 'A direct line between the organizers and the participants. Anything you are unsure about in the rules, the platform, or the scoring — ask it live and get an answer live.',
  },
  {
    zhTitle: '连接',
    enTitle: 'Connect',
    zhDesc: '参赛者之间也需要一个碰面的地方。同一道题，别人走的是哪条路，值得听。',
    enDesc: 'Participants need somewhere to meet each other too. Same challenge, different routes — the other teams are worth listening to.',
  },
]
</script>

<template>
  <article class="py-32 bg-bg-primary min-h-screen">
    <div class="max-w-3xl mx-auto px-6 bootcamp-content">
      <router-link to="/" class="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors mb-12">← {{ isEn ? 'Back to Home' : '返回首页' }}</router-link>

      <h1 class="heading-serif text-4xl md:text-5xl text-text-primary mb-4">{{ isEn ? 'Bootcamp' : '研习营' }}</h1>
      <p class="text-text-tertiary mb-2">{{ isEn ? 'September 7 – 20, 2026 · Online video sessions' : '2026 年 9 月 7 日 – 9 月 20 日 · 线上视频会议' }}</p>
      <p class="text-text-muted text-sm mb-12">{{ isEn ? 'Six teaching sessions and three office hours, each under an hour. Encouraged, never required.' : '六讲课程，三场答疑，每场一小时以内。鼓励参加，但不作要求。' }}</p>

      <p class="lede">{{ isEn ? 'The bootcamp is scaffolding, not a gate. The organizers invite technical experts to explain what you need to know to compete, and to answer questions on the spot. Every session is optional — skipping it costs you nothing in the standings, and attending all nine earns you nothing either. It is here because we would rather you spend the qualifier building than working out how the pieces fit.' : '研习营是脚手架，不是门槛。组织者邀请技术专家，把打这场比赛需要知道的东西讲清楚，把问题当场答掉。每一讲都可以不参加——不参加不影响成绩，全部参加也不加分。它存在的理由只有一个：让你在初赛的时间里用来搭东西，而不是用来搞清楚零件怎么装。' }}</p>

      <section>
        <h2>{{ isEn ? '1. How it runs' : '1. 怎么进行' }}</h2>
        <ul>
          <li><strong>{{ isEn ? 'Format' : '形式' }}</strong> — {{ isEn ? 'Zoom or Tencent Meeting. The link for each session is published here before it starts.' : 'Zoom 或腾讯会议。每一讲的会议链接会在开始前发布在本页。' }}</li>
          <li><strong>{{ isEn ? 'Length' : '时长' }}</strong> — {{ isEn ? 'each session is kept under one hour, talk and questions together.' : '每一讲控制在一小时以内，讲解和答疑都在这一小时里。' }}</li>
          <li><strong>{{ isEn ? 'Shape' : '结构' }}</strong> — {{ isEn ? 'the six teaching sessions are led by an invited expert and close with live questions; the three office hours are questions from the first minute.' : '六讲课程由受邀专家主讲，末尾现场答疑；三场答疑从第一分钟起就是提问。' }}</li>
          <li><strong>{{ isEn ? 'Recordings' : '录像' }}</strong> — {{ isEn ? 'every session is recorded and made available afterwards, so a clash with your timezone is not a problem.' : '每一讲都提供录像，事后可以回看——时区对不上不影响。' }}</li>
        </ul>
        <p class="muted">{{ isEn ? 'The bootcamp runs before the qualifier, not alongside it: it closes on September 20 and the qualifier opens on September 21. Nothing here is scored, so you can treat the two weeks as preparation and arrive at the qualifier already fluent in the tooling.' : '研习营在初赛之前，不与初赛并行：9 月 20 日结营，初赛 9 月 21 日开赛。研习营不计分，这两周就是备赛——把工具练熟了再上初赛。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '2. What it is for' : '2. 它想做成的三件事' }}</h2>
        <ol>
          <li v-for="p in purposes" :key="p.enTitle"><strong>{{ isEn ? p.enTitle : p.zhTitle }}</strong> — {{ isEn ? p.enDesc : p.zhDesc }}</li>
        </ol>
      </section>

      <section>
        <h2>{{ isEn ? '3. The six sessions' : '3. 六讲课程' }}</h2>
        <p>{{ isEn ? 'The first session covers the ground everyone stands on. The remaining five each walk one route through the competition — you do not need all five. Pick the one closest to how you intend to compete, and treat the others as a look at what the teams beside you are doing.' : '第一讲讲的是所有人都要站的地方。后五讲各走一条参赛路径——你并不需要五条都听。挑离你打算怎么打最近的那一条，其余的就当看看隔壁队伍在做什么。' }}</p>

        <ul class="sessionlist">
          <li v-for="s in sessions" :key="s.number">
            <div class="session-head">
              <span class="session-no">{{ s.number }}</span>
              <div>
                <strong>{{ isEn ? s.enTitle : s.zhTitle }}</strong>
                <a v-if="s.url" :href="s.url" target="_blank" rel="noopener noreferrer" class="session-sub session-link">
                  {{ isEn ? s.enSubtitle : s.zhSubtitle }} ↗
                </a>
                <span v-else class="session-sub">{{ isEn ? s.enSubtitle : s.zhSubtitle }}</span>
              </div>
              <span class="session-tba">{{ isEn ? 'Time TBA' : '时间待定' }}</span>
            </div>
            <span class="block">{{ isEn ? s.enNote : s.zhNote }}</span>
          </li>
        </ul>

        <p class="muted">{{ isEn ? 'All six fall between September 7 and 20. Exact dates and times are still being settled and go up on this page once fixed — no time here is final until it is announced.' : '六讲都安排在 9 月 7 日至 20 日之间。具体日期与时间仍在敲定，确定后公布在本页——公布之前，这里的时间都不作数。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '4. Three office hours' : '4. 三场答疑' }}</h2>
        <p>{{ isEn ? 'The teaching sessions run one way; the office hours run the other. There is no talk prepared — you bring the questions and the organizers answer them live. Each one has a theme so that the right people are in the room, but a question that lands in the wrong session still gets answered rather than deferred.' : '课程是单向的，答疑是反过来的：没有准备好的讲稿，你带问题来，组织者当场答。每一场设一个主题，是为了让对的人在场；问题问错了场，也照样当场答，不会被推到下一场。' }}</p>

        <ul class="sessionlist">
          <li v-for="oh in officeHours" :key="oh.number">
            <div class="session-head">
              <span class="session-no">{{ isEn ? 'OH' : '答疑' }}&nbsp;{{ oh.number }}</span>
              <div>
                <strong>{{ isEn ? oh.enTitle : oh.zhTitle }}</strong>
              </div>
              <span class="session-tba">{{ isEn ? 'Time TBA' : '时间待定' }}</span>
            </div>
            <span class="block">{{ isEn ? oh.enNote : oh.zhNote }}</span>
          </li>
        </ul>

        <p class="muted">{{ isEn ? 'The three office hours also fall between September 7 and 20, interleaved with the teaching sessions. Times are posted here once fixed.' : '三场答疑同样安排在 9 月 7 日至 20 日之间，与六讲课程穿插进行。时间确定后公布在本页。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '5. Do I have to attend?' : '5. 必须参加吗？' }}</h2>
        <p>{{ isEn ? 'No. The bootcamp is encouraged but never required, and attendance is not part of the scoring in any form. Registration for the series is complete once your team account and team record are created; the bootcamp sits outside that.' : '不必。研习营鼓励参加，但从不作要求，出席情况也不以任何形式计入评分。创建队伍账号和队伍资料后即完成报名，研习营在这之外。' }}</p>
        <p>{{ isEn ? 'If you already know how you intend to build your harness, going straight to the qualifier is a perfectly good plan. If you do not, session 01 is the one to watch.' : '如果你已经清楚自己的 Harness 打算怎么搭，直接去打初赛完全没问题。如果还不清楚，第 01 讲是最该看的那一讲。' }}</p>
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
.bootcamp-content .sessionlist { list-style: none; padding-left: 0; margin-top: 1.75rem; }
.bootcamp-content .sessionlist li { border-left: 2px solid var(--color-border); padding-left: 1rem; margin-bottom: 1.5rem; }
.bootcamp-content .session-head { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; }
.bootcamp-content .session-no { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .72rem; color: var(--color-accent); }
.bootcamp-content .session-head strong { color: var(--color-text-primary); font-weight: 600; }
.bootcamp-content .session-link { display: table; color: var(--color-text-tertiary); text-decoration: none; border-bottom: 1px solid var(--color-accent); transition: color .2s ease; }
.bootcamp-content .session-link:hover { color: var(--color-accent); }
.bootcamp-content .session-sub { display: block; font-size: .88rem; color: var(--color-text-tertiary); margin-top: .15rem; }
.bootcamp-content .session-tba { margin-left: auto; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-muted); border: 1px solid var(--color-border); padding: .15rem .45rem; white-space: nowrap; }
.bootcamp-content .sessionlist span.block { color: var(--color-text-muted); font-size: .92rem; line-height: 1.7; margin-top: .45rem; }
</style>
