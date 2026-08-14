import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const arcbenchUrl = Deno.env.get('ARCBENCH_SYNC_URL')
const arcbenchSecret = Deno.env.get('ARCBENCH_SYNC_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const inboundWebhookSecret = Deno.env.get('ARCBENCH_SYNC_INBOUND_SECRET')

if (!arcbenchUrl || !arcbenchSecret || !supabaseUrl || !serviceRoleKey || !inboundWebhookSecret) {
  throw new Error('ARC-Bench sync configuration is incomplete')
}

const admin = createClient(supabaseUrl, serviceRoleKey)

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function signature(body: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(arcbenchSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
}

async function send(eventId: string, eventType: string, data: Record<string, unknown>) {
  const body = JSON.stringify({ event_id: eventId, event_type: eventType, data })
  const response = await fetch(arcbenchUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-arcbench-signature': `sha256=${await signature(body)}`,
    },
    body,
  })
  if (!response.ok) {
    throw new Error(`ARC-Bench sync rejected ${eventType}: ${response.status} ${await response.text()}`)
  }
}

async function syncProfile(profile: Record<string, any>, eventId: string) {
  const { data, error } = await admin.auth.admin.getUserById(profile.id)
  if (error || !data.user) throw error ?? new Error(`Auth user ${profile.id} was not found`)
  await send(eventId, 'profile.upsert', {
    ...profile,
    email: data.user.email,
    email_confirmed_at: data.user.email_confirmed_at,
  })
}

async function syncTeam(team: Record<string, any>, eventId: string) {
  await send(eventId, 'team.upsert', team)
  const { data: members, error } = await admin.from('profiles').select('id').eq('team_id', team.id)
  if (error) throw error
  for (const member of members ?? []) {
    await send(`${eventId}:member:${member.id}`, 'team.membership.sync', {
      team_id: team.id,
      user_id: member.id,
      role: member.id === team.leader_id ? 'leader' : 'member',
      active: true,
    })
  }
}

async function backfill(batchId: string) {
  const { data: profiles, error: profileError } = await admin.from('profiles').select('*')
  if (profileError) throw profileError
  for (const profile of profiles ?? []) await syncProfile(profile, `backfill:${batchId}:profile:${profile.id}`)
  const { data: teams, error: teamError } = await admin.from('teams').select('*')
  if (teamError) throw teamError
  for (const team of teams ?? []) await syncTeam(team, `backfill:${batchId}:team:${team.id}`)
}

async function processSourceEvent(
  table: string,
  operation: string,
  record: Record<string, any> | null,
  oldRecord: Record<string, any> | null,
  eventId: string,
) {
  if (table === 'profiles' && record) {
    await syncProfile(record, `${eventId}:profile`)
    if (record.team_id) {
      const { data: team, error } = await admin.from('teams').select('*').eq('id', record.team_id).single()
      if (error) throw error
      await syncTeam(team, `${eventId}:team`)
    }
    if (oldRecord?.team_id && oldRecord.team_id !== record.team_id) {
      await send(`${eventId}:removed`, 'team.membership.sync', {
        team_id: oldRecord.team_id,
        user_id: record.id,
        active: false,
      })
    }
    return true
  }
  if (table === 'teams' && operation === 'DELETE' && record) {
    await send(eventId, 'team.delete', { id: record.id })
    return true
  }
  if (table === 'teams' && record) {
    await syncTeam(record, `${eventId}:team`)
    return true
  }
  return false
}

async function drainOutbox() {
  const lockToken = crypto.randomUUID()
  const { data: events, error } = await admin.rpc('claim_arcbench_sync_outbox', {
    p_lock_token: lockToken,
    p_limit: 25,
  })
  if (error) throw error

  const results = { delivered: 0, failed: 0 }
  for (const event of events ?? []) {
    try {
      const handled = await processSourceEvent(
        event.source_table,
        event.operation,
        event.record,
        event.old_record,
        `outbox:${event.id}`,
      )
      if (!handled) throw new Error(`Unsupported outbox table: ${event.source_table}`)
      const { error: updateError } = await admin
        .from('arcbench_sync_outbox')
        .update({
          delivered_at: new Date().toISOString(),
          lock_token: null,
          locked_at: null,
          attempts: (event.attempts ?? 0) + 1,
          last_error: null,
        })
        .eq('id', event.id)
        .eq('lock_token', lockToken)
      if (updateError) throw updateError
      results.delivered += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`ARC-Bench outbox event ${event.id} failed`, error)
      const { error: updateError } = await admin
        .from('arcbench_sync_outbox')
        .update({ attempts: (event.attempts ?? 0) + 1, last_error: message, lock_token: null, locked_at: null })
        .eq('id', event.id)
        .eq('lock_token', lockToken)
      if (updateError) throw updateError
      results.failed += 1
    }
  }
  return results
}

Deno.serve(async (request) => {
  try {
    if (request.headers.get('x-hackathon-sync-secret') !== inboundWebhookSecret) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
    const event = await request.json()
    if (event.backfill === true) {
      const batchId = typeof event.backfill_id === 'string' && event.backfill_id.trim()
        ? event.backfill_id.trim().slice(0, 48)
        : crypto.randomUUID()
      await backfill(batchId)
      const outbox = await drainOutbox()
      return Response.json({ accepted: true, backfill: true, backfill_id: batchId, outbox })
    }
    const table = String(event.table ?? '')
    const record = event.record as Record<string, any> | null
    const oldRecord = event.old_record as Record<string, any> | null
    if (table === 'arcbench_sync_outbox') {
      const outbox = await drainOutbox()
      return Response.json({ accepted: true, outbox })
    }

    // Backward-compatible direct profile/team webhooks while moving existing
    // Supabase projects to the durable outbox migration.
    const eventId = `${event.type ?? 'UPDATE'}:${table}:${record?.id ?? oldRecord?.id ?? crypto.randomUUID()}:${Date.now()}`
    const operation = String(event.operation ?? event.type ?? 'UPSERT').toUpperCase()
    const handled = await processSourceEvent(table, operation, record, oldRecord, eventId)
    return Response.json(handled ? { accepted: true } : { ignored: true })
  } catch (error) {
    console.error('ARC-Bench account sync failed', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
})
