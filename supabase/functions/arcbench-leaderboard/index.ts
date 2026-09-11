const ARCBENCH_API = "https://arc-bench.com/api/competitions"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { ...corsHeaders, Allow: "GET" } },
    )
  }

  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 20)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
    : 20

  try {
    const competitionsResponse = await fetch(ARCBENCH_API, { signal: AbortSignal.timeout(10_000) })
    if (!competitionsResponse.ok) throw new Error(`ARC-Bench returned ${competitionsResponse.status}`)
    const competitions = await competitionsResponse.json()
    const competition = competitions.find((item: { is_public: boolean; task_count: number }) => item.is_public && item.task_count > 0)
    if (!competition) throw new Error("No public ARC-Bench competition available")
    const upstream = await fetch(`${ARCBENCH_API}/leaderboard?track=all&competition_id=${encodeURIComponent(competition.id)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) throw new Error(`ARC-Bench returned ${upstream.status}`)

    const payload = await upstream.json()
    if (!Array.isArray(payload)) throw new Error("ARC-Bench returned an invalid payload")

    return Response.json({ competition: { id: competition.id, title: competition.title }, updatedAt: new Date().toISOString(), entries: payload.slice(0, limit) }, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("Failed to load ARC-Bench leaderboard", error)
    return Response.json(
      { error: "Leaderboard temporarily unavailable" },
      { status: 502, headers: corsHeaders },
    )
  }
})
