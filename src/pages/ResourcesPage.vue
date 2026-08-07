<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

const links = [
  {
    zhName: 'ARC 中文文章《需求编译：让需求从文档走向"源代码"》',
    enName: 'Introductory article (Chinese): "Requirement Compilation"',
    url: 'https://mp.weixin.qq.com/s/AQSjEMdhEZZRetgQyVclGw',
    zhNote: 'CoPhi 课题组公众号，2026 年 7 月 6 日。有图有例子，最好的入门读物。',
    enNote: 'Published by the CoPhi group, July 6, 2026. The gentlest introduction, with diagrams and worked examples.',
  },
  {
    zhName: 'ARC 代码仓库',
    enName: 'ARC source repository',
    url: 'https://github.com/code-philia/agentic-requirement-compiler',
    zhNote: '开源，MIT 许可。README 覆盖流水线说明、需求模型、CLI 用法和 ARC-Bench 集成。',
    enNote: 'Open source under MIT. The README covers the pipeline, requirement model, CLI usage, and ARC-Bench integration.',
  },
  {
    zhName: 'ARC-Bench 平台',
    enName: 'ARC-Bench platform',
    url: 'http://arc-bench.com',
    zhNote: '运行和可视化的地方。Quick Start 里有上传自定义 agent 的完整步骤。Research 页上有更多的论文和科研资料',
    enNote: 'Where things actually run. The Quick Start walks through uploading a custom agent bundle.',
  },
  {
    zhName: 'ARC 论文预印本（arXiv:2602.13723）',
    enName: 'ARC paper preprint (arXiv:2602.13723)',
    url: 'https://arxiv.org/abs/2602.13723',
    zhNote: '《Compiling Large Multi-Modal Requirement Documents into Runnable Software Systems: From an Agentic Test-Driven Perspective》，ISSTA 2026 录用。评测细节、DSL 文法和用户研究都在里面。',
    enNote: '"Compiling Large Multi-Modal Requirement Documents into Runnable Software Systems: From an Agentic Test-Driven Perspective," accepted to ISSTA 2026. Evaluation details, the DSL grammar, and the user study are all here.',
  },
  {
    zhName: '订票系统需求样例',
    enName: 'Ticket-booking requirement sample',
    url: 'https://github.com/code-philia/agentic-requirement-compiler/tree/main/example/ticketbooking-demo',
    zhNote: 'ARC 仓库内。requirements.yaml + requirements.md + 7 张界面参考图，是"需求文档该长什么样"的现成答案。',
    enNote: 'Inside the ARC repository. A requirements.yaml, a requirements.md, and seven reference screenshots — the fastest answer to "what should a requirement document look like?"',
  },
]
</script>

<template>
  <article class="py-32 bg-bg-primary min-h-screen">
    <div class="max-w-3xl mx-auto px-6 resources-content">
      <router-link to="/" class="inline-flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors mb-12">← {{ isEn ? 'Back to Home' : '返回首页' }}</router-link>

      <h1 class="heading-serif text-4xl md:text-5xl text-text-primary mb-4">{{ isEn ? 'Start Here' : '资料都在这儿' }}</h1>
      <p class="text-text-tertiary mb-12">{{ isEn ? 'ARC, ARC-Bench, and requirement compilation — explained in one place.' : 'ARC、ARC-Bench 与需求编译，一次讲清。' }}</p>

      <p class="lede">{{ isEn ? 'This series uses ARC-Bench, built at Shanghai Jiao Tong University, as its main competition system. Material on ARC and ARC-Bench is scattered across several places — the article on WeChat, the code on GitHub, the platform at its own address, and the paper as a PDF. This page gathers it all in one place, in the order we suggest reading it. No prior background is assumed.' : '这次大赛采用上海交通大学ARC-Bench系统作为主要的比赛系统。有关ARC和ARC-Bench的相关资料散在好几个地方——文章在公众号，代码在 GitHub，平台是另一个网址，论文又是一份 PDF。这篇文章把它们收在一起，并按建议的阅读顺序排好。不需要任何前置知识。' }}</p>

      <section>
        <h2>{{ isEn ? '1. Three names, often confused' : '1. 三个名字，先分清' }}</h2>
        <p>{{ isEn ? 'Three terms come up constantly and get mixed together. They are not the same kind of thing.' : '有三个词经常一起出现，也经常被混为一谈。它们其实不是一类东西。' }}</p>
        <ul>
          <li><strong>{{ isEn ? 'Requirement compilation' : '需求编译' }}</strong> — {{ isEn ? 'an idea, or a way of working.' : '一种想法，一套做事的方法。' }}</li>
          <li><strong>ARC</strong> — {{ isEn ? 'a tool that implements that idea.' : '把这个想法实现出来的工具。' }}</li>
          <li><strong>ARC-Bench</strong> — {{ isEn ? 'the platform where that tool runs and shows its work.' : '让这个工具跑起来、并把过程展示出来的平台。' }}</li>
        </ul>
        <p>{{ isEn ? 'An analogy: requirement compilation is like the idea of writing programs in a high-level language. ARC is the compiler. ARC-Bench is the machine you run the compiler on, with a screen attached.' : '打个比方：需求编译好比"用高级语言写程序"这个想法，ARC 是那个编译器，ARC-Bench 是你运行编译器的那台机器，外加一块显示器。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '2. What problem is being solved' : '2. 它想解决什么问题' }}</h2>
        <p>{{ isEn ? 'The common way to write code with AI today is prompt-centric: you write a long description, the model infers the structure on its own, and it produces code in one or a few broad passes. This works for small things. As requirements grow, the model drifts — and when the result is wrong, it is hard to say which sentence was the one that was underspecified.' : '今天用 AI 写代码，主流做法是以提示词为中心：你写一大段描述，模型自己去猜结构，然后一次或几次生成出代码。东西小的时候没问题。需求一多就容易跑偏，而且出了错很难说清到底是哪句话没讲明白。' }}</p>
        <p>{{ isEn ? 'Requirement compilation takes a different view, borrowed from compilers:' : '需求编译换了个视角，这个视角是从编译器那里借来的：' }}</p>
        <ul>
          <li>{{ isEn ? 'Requirements are not just context. They are the source program.' : '需求不只是上下文，它就是源程序。' }}</li>
          <li>{{ isEn ? 'Tests are not just verification. They are executable constraints.' : '测试不只是验证手段，它是可执行的约束。' }}</li>
          <li>{{ isEn ? 'Traceability is not optional metadata. It is part of the contract.' : '追溯不是可有可无的元数据，它是契约的一部分。' }}</li>
        </ul>
        <p>{{ isEn ? 'In practice that means modelling the requirement document as a structured graph — each node carrying its dependencies, its scenarios, and optional references such as screenshots — and then compiling it in stages: design the interfaces first, generate tests from the scenarios, then write the implementation against those tests. Each ⟨node, stage⟩ pair leaves a git commit behind, so the chain from requirement to design to test to code stays traceable.' : '具体做法是把需求文档建模成一张有结构的图——每个需求节点带着自己的依赖、场景，以及截图之类的可选参考——然后分阶段编译：先设计接口，再从场景生成测试，最后照着测试写实现。每一个〈节点，阶段〉都会留下一次 git commit，于是需求 → 设计 → 测试 → 代码这条链始终可追溯。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '3. What ARC is' : '3. ARC 是什么' }}</h2>
        <p>{{ isEn ? 'ARC (Agentic Requirement Compiler) is the open-source implementation of that method — MIT licensed, Python 3.11+, currently offered as a command-line tool. Its pipeline runs in four stages: structured requirement modelling, interface design, test-first generation, and test-driven implementation.' : 'ARC（Agentic Requirement Compiler）是上面那套方法的开源实现——MIT 许可，Python 3.11+，目前以命令行工具的形式提供。它的流水线分四段：结构化需求建模、接口设计、测试先行生成、测试驱动实现。' }}</p>
        <p>{{ isEn ? 'If you only look at one thing in the repository, make it the ticket-booking sample under example/. It is a complete requirement document for a booking system, and it answers the question everyone asks first — what is ARC actually expecting me to write? — faster than the documentation does.' : '如果你只想看仓库里的一样东西，就看 example/ 下面的订票系统样例。那是一份完整的订票系统需求文档，它回答的正是所有人最先问的那个问题——我到底该给 ARC 写什么？——而且比读文档快。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '4. What ARC-Bench is' : '4. ARC-Bench 是什么' }}</h2>
        <p>{{ isEn ? 'ARC-Bench provides the container runtime, workspace lifecycle, event streaming, and the visualization layer. ARC does the actual requirement-to-project compilation inside that environment. You can package your own agent and upload it, then watch the run unfold rather than reading it out of a log afterwards.' : 'ARC-Bench 提供容器运行时、workspace 生命周期管理、事件流和可视化层，ARC 则在这个环境里完成从需求到项目的实际编译。你可以把自己的 agent 打包上传，然后看着它一步步跑，而不是事后从日志里往回读。' }}</p>
        <p>{{ isEn ? 'For teams in this series, this is where a harness gets run and submitted. The Quick Start on the platform has the full upload instructions.' : '对参加本系列赛事的队伍来说，这里就是 Harness 运行和提交的地方。平台上的 Quick Start 有完整的上传说明。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '5. The research behind it' : '5. 背后的研究' }}</h2>
        <p>{{ isEn ? 'The method is described in "Compiling Large Multi-Modal Requirement Documents into Runnable Software Systems: From an Agentic Test-Driven Perspective," accepted to ISSTA 2026 on June 25, 2026, from the CoPhi group at Shanghai Jiao Tong University. The evaluation covers six medium-sized web systems of 50 to 200 requirement scenarios each, plus 101 small mobile applications.' : '这套方法写在论文《Compiling Large Multi-Modal Requirement Documents into Runnable Software Systems: From an Agentic Test-Driven Perspective》里，2026 年 6 月 25 日被 ISSTA 2026 录用，来自上海交通大学 CoPhi 团队。评测覆盖了 6 个中型 Web 系统（每个 50–200 个需求场景）和 101 个小型移动应用。' }}</p>
        <p class="muted">{{ isEn ? 'The preprint is on arXiv (2602.13723) and is linked below. Note that the arXiv version is revised from time to time, so the numbers you read there may be slightly ahead of the ones quoted here.' : '预印本已在 arXiv 公开（2602.13723），链接见下方清单。注意 arXiv 上的版本会不定期修订，你读到的数字可能比这里引用的更新。' }}</p>
      </section>

      <section>
        <h2>{{ isEn ? '6. Where to start' : '6. 建议的上手顺序' }}</h2>
        <ol>
          <li><strong>{{ isEn ? 'Read the article' : '读文章' }}</strong> — {{ isEn ? 'about 30 minutes. It builds the concepts with pictures.' : '大约 30 分钟，用图把概念讲清楚。' }}</li>
          <li><strong>{{ isEn ? 'Open the sample' : '看样例' }}</strong> — {{ isEn ? 'see what a requirement document looks like before writing one.' : '在自己动手写之前，先看看需求文档长什么样。' }}</li>
          <li><strong>{{ isEn ? 'Run it locally' : '本地跑起来' }}</strong> — {{ isEn ? 'clone the repository and try the CLI on the sample.' : '克隆仓库，拿样例试一遍命令行。' }}</li>
          <li><strong>{{ isEn ? 'Move to the platform' : '上平台' }}</strong> — {{ isEn ? 'package your agent and upload it to ARC-Bench.' : '把 agent 打包上传到 ARC-Bench。' }}</li>
          <li><strong>{{ isEn ? 'Go deeper' : '再深入' }}</strong> — {{ isEn ? 'read the paper when you want the evaluation details.' : '想了解评测细节时，读论文。' }}</li>
        </ol>
        <p>{{ isEn ? 'To clone the repository:' : '克隆仓库的命令：' }}</p>
        <pre><code>git clone https://github.com/code-philia/agentic-requirement-compiler.git</code></pre>
      </section>

      <section>
        <h2>{{ isEn ? '7. The list' : '7. 资料清单' }}</h2>
        <ul class="linklist">
          <li v-for="link in links" :key="link.url">
            <a :href="link.url" target="_blank" rel="noopener">{{ isEn ? link.enName : link.zhName }}</a>
            <span class="block">{{ isEn ? link.enNote : link.zhNote }}</span>
          </li>
        </ul>
      </section>

      <p class="closing">{{ isEn ? 'If something you need is still missing from this page, tell us — the gap is ours to close, not yours to work around.' : '如果这页上还缺你需要的东西，告诉我们——该补的是我们，不该是你自己想办法绕过去。' }}</p>
    </div>
  </article>
</template>

<style scoped>
.resources-content section { border-top: 1px solid var(--color-border); padding-top: 2.5rem; margin-top: 2.5rem; }
.resources-content h2 { font-family: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif; color: var(--color-text-primary); font-size: 1.6rem; font-weight: 600; letter-spacing: -.035em; margin-bottom: 1rem; }
.resources-content p, .resources-content li { color: var(--color-text-secondary); line-height: 1.85; margin-bottom: .75rem; }
.resources-content ul, .resources-content ol { padding-left: 1.35rem; list-style: disc; }
.resources-content ol { list-style: decimal; }
.resources-content .lede { font-size: 1.075rem; color: var(--color-text-tertiary); line-height: 1.9; }
.resources-content .muted { color: var(--color-text-muted); font-size: .9rem; }
.resources-content .closing { border-top: 1px solid var(--color-border); padding-top: 2.5rem; margin-top: 2.5rem; color: var(--color-text-tertiary); }
.resources-content pre { background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: .85rem 1rem; overflow-x: auto; margin-bottom: .75rem; }
.resources-content code { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: .82rem; color: var(--color-text-secondary); }
.resources-content .linklist { list-style: none; padding-left: 0; }
.resources-content .linklist li { border-left: 2px solid var(--color-border); padding-left: 1rem; margin-bottom: 1.5rem; }
.resources-content .linklist a { color: var(--color-accent); text-decoration: none; font-weight: 600; }
.resources-content .linklist a:hover { text-decoration: underline; }
.resources-content .linklist span { color: var(--color-text-muted); font-size: .92rem; line-height: 1.7; margin-top: .3rem; }
</style>
