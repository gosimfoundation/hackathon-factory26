<script setup lang="ts">
import { useI18n } from '../../composables/useI18n'
import { emptyTeamMember, teamMemberAgeRanges, type TeamMemberDraft } from '../../composables/useTeamRoster'

const members = defineModel<TeamMemberDraft[]>({ required: true })
const { pick } = useI18n()

function addMember() {
  if (members.value.length >= 19) return
  members.value = [...members.value, emptyTeamMember()]
}

function removeMember(index: number) {
  members.value = members.value.filter((_, memberIndex) => memberIndex !== index)
}
</script>

<template>
  <div class="space-y-4">
    <p v-if="!members.length" class="border border-dashed border-border px-4 py-3 text-xs leading-relaxed text-text-muted">
      {{ pick('If this is a one-person team, you can skip this section.', '如果目前只有一位成员，可以跳过这一部分。') }}
    </p>

    <article v-for="(member, index) in members" :key="index" class="border border-border bg-bg-secondary/40 p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h5 class="text-sm font-semibold text-text-primary">{{ pick(`Member ${index + 2}`, `成员 ${index + 2}`) }}</h5>
        <button type="button" @click="removeMember(index)" class="text-xs text-text-muted transition-colors hover:text-accent-red">
          {{ pick('Remove', '删除') }}
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('Name', '姓名') }} <span class="text-accent-red">*</span></label>
          <input v-model.trim="member.name" type="text" required class="w-full border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary placeholder-input-placeholder transition-colors focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('GitHub username (optional)', 'GitHub 账号（选填）') }}</label>
          <input v-model.trim="member.githubId" type="text" placeholder="octocat" class="w-full border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary placeholder-input-placeholder transition-colors focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('Email', '邮箱') }} <span class="text-accent-red">*</span></label>
          <input v-model.trim="member.email" type="email" required placeholder="member@example.com" class="w-full border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary placeholder-input-placeholder transition-colors focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('Professional background', '专业背景') }} <span class="text-accent-red">*</span></label>
          <input v-model.trim="member.professionalBackground" type="text" required :placeholder="pick('e.g. Computer science student', '例如：计算机专业学生')" class="w-full border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary placeholder-input-placeholder transition-colors focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('Location / organization', '地区 / 单位') }} <span class="text-accent-red">*</span></label>
          <input v-model.trim="member.affiliation" type="text" required :placeholder="pick('e.g. Shenzhen / XX University', '例如：深圳 / XX 大学')" class="w-full border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary placeholder-input-placeholder transition-colors focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-text-secondary">{{ pick('Age range', '年龄段') }} <span class="text-accent-red">*</span></label>
          <select v-model="member.ageRange" required class="w-full appearance-none border border-input-border bg-input-bg px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent/50 focus:outline-none">
            <option value="">{{ pick('Select age range', '选择年龄段') }}</option>
            <option v-for="range in teamMemberAgeRanges" :key="range" :value="range">{{ range }}</option>
          </select>
        </div>
      </div>
    </article>

    <button type="button" :disabled="members.length >= 19" @click="addMember" class="w-full border border-dashed border-accent/45 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50">
      ＋ {{ pick('Add another member', '添加一名队员') }}
    </button>
    <p class="text-xs text-text-muted">{{ pick(`${members.length + 1} / 20 team members`, `当前 ${members.length + 1} / 20 名成员`) }}</p>
  </div>
</template>
