# Deployment Guide

## Prerequisites

- Node.js 20+
- npm
- A Supabase project (see [supabase-setup.md](supabase-setup.md))

## Build

```bash
npm install
npm run build
```

This produces a `dist/` directory with static files.

## GitHub Pages

1. Build the project
2. Push `dist/` contents to a `gh-pages` branch, or use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_SITE_URL: ${{ secrets.VITE_SITE_URL }}
          VITE_BASE_PATH: ${{ secrets.VITE_BASE_PATH }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Set secrets in your GitHub repo settings.

## Vercel

1. Connect your GitHub repo to Vercel
2. Vercel auto-detects Vite — no config needed
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `VITE_BASE_PATH` (`/` at the domain root, or for example `/oaic-harness-2026/` behind the shared hackathon gateway)

## Netlify

1. Connect your GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard

## Custom Domain

After deploying, configure your custom domain with your hosting provider. Update `VITE_SITE_URL` to match.

## Supabase Edge Functions (Optional)

If using the email notification system:

```bash
supabase functions deploy send_team_email
supabase secrets set SMTP_HOST=smtp.example.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=hackathon@example.com
supabase secrets set SMTP_PASS=your-smtp-password
supabase secrets set SITE_URL=https://your-hackathon.example.com
```
