# 2026 OAIC International Hackathon for Agentic Factory and Grand Challenge Series

Official website for the **2026 OAIC International Hackathon for Agentic Factory and Grand Challenge Series**, running September 1–October 17, 2026 online and concluding at GOSIM Shenzhen.

The application is a Vue 3 + TypeScript + Vite site with bilingual public content, Supabase authentication, team registration, project submissions, invitations, announcements, and administrative tools. It was migrated from the earlier Paris hackathon sites and the reusable hackathon kit, then rewritten for the 2026 event.

## Local development

Requirements: Node.js 20+ and a Supabase project.

```bash
npm ci
cp .env.example .env
npm run dev
```

Set these values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=http://localhost:5173
VITE_BASE_PATH=/
```

## Supabase

Apply the SQL in [`docs/supabase-setup.md`](docs/supabase-setup.md), including all migrations under `supabase/migrations/`. The 2026 migration adds team harness selection and one submission per team per competition round.

Registration is complete only after a participant creates or joins a team. Team-size limits are intentionally not enforced until organizers confirm the policy.

## Content source

Public event copy lives in:

- `src/i18n/en.ts`
- `src/i18n/zh.ts`

Confirmed event data is also summarized in `config/event.example.yaml`. Unknown items—team size, registration deadline, participation fee, judging weights, public contact details, and unconfirmed sponsors—are intentionally not published.

## Build

```bash
npm run build
```

The deployable static output is written to `dist/`. See [`docs/deployment.md`](docs/deployment.md) for hosting options.

## Stack

- Vue 3 and TypeScript
- Vite 8 and Tailwind CSS 4
- Supabase Auth, Database, Realtime, Storage, and Edge Functions
- Playwright browser-testing dependency

## License

MIT
