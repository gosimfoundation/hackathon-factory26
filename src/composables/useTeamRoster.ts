import { supabase } from '../lib/supabase'

export interface TeamMemberDraft {
  name: string
  githubId: string
  email: string
  professionalBackground: string
  affiliation: string
  ageRange: string
}

export const teamMemberAgeRanges = ['18-22', '23-28', '29-35', '36+'] as const

export type TeamRosterValidationIssue =
  | 'member-count'
  | 'required-fields'
  | 'invalid-email'
  | 'duplicate-email'
  | null

export function emptyTeamMember(): TeamMemberDraft {
  return {
    name: '',
    githubId: '',
    email: '',
    professionalBackground: '',
    affiliation: '',
    ageRange: '',
  }
}

export function registrationContactAsMember(input: {
  name: string
  githubId: string
  email: string
  professionalBackground: string
  location: string
  organization: string
  ageRange: string
}): TeamMemberDraft {
  return {
    name: input.name.trim(),
    githubId: input.githubId.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''),
    email: input.email.trim(),
    professionalBackground: input.professionalBackground.trim(),
    affiliation: [input.location.trim(), input.organization.trim()].filter(Boolean).join(' / '),
    ageRange: input.ageRange,
  }
}

export function validateTeamRoster(members: TeamMemberDraft[]): TeamRosterValidationIssue {
  if (members.length < 1 || members.length > 20) return 'member-count'

  const emails = new Set<string>()
  for (const member of members) {
    if (
      !member.name.trim()
      || !member.email.trim()
      || !member.professionalBackground.trim()
      || !member.affiliation.trim()
      || !teamMemberAgeRanges.includes(member.ageRange as typeof teamMemberAgeRanges[number])
    ) return 'required-fields'

    const email = member.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'invalid-email'
    if (emails.has(email)) return 'duplicate-email'
    emails.add(email)
  }

  return null
}

export async function fetchTeamRoster(teamId: string): Promise<{ members: TeamMemberDraft[]; error: string }> {
  const { data, error } = await supabase
    .from('team_members')
    .select('name,github_id,email,professional_background,affiliation,age_range,is_primary_contact,position')
    .eq('team_id', teamId)
    .order('position', { ascending: true })

  if (error) return { members: [], error: error.message }

  return {
    members: (data || []).map(row => ({
      name: row.name || '',
      githubId: row.github_id || '',
      email: row.email || '',
      professionalBackground: row.professional_background || '',
      affiliation: row.affiliation || '',
      ageRange: row.age_range || '',
    })),
    error: '',
  }
}

export async function replaceTeamRoster(teamId: string, members: TeamMemberDraft[]): Promise<{ ok: boolean; error: string }> {
  const validationIssue = validateTeamRoster(members)
  if (validationIssue) return { ok: false, error: validationIssue }

  const payload = members.map(member => ({
    name: member.name.trim(),
    githubId: member.githubId.trim(),
    email: member.email.trim(),
    professionalBackground: member.professionalBackground.trim(),
    affiliation: member.affiliation.trim(),
    ageRange: member.ageRange,
  }))
  const { error } = await supabase.rpc('replace_team_members', {
    p_team_id: teamId,
    p_members: payload,
  })
  return { ok: !error, error: error?.message || '' }
}
