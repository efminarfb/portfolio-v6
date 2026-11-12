# portfolio-v6 — Dark Portfolio

Personal site for Sadaf Al Selim, built from the MotionSites "Dark Portfolio" (Seoyeon) design language.

- `index.html` — the whole site: styles and script inline, no framework, no build step.
- `api/lead.js` — optional Vercel function that writes enquiries using the Supabase service key.
- `assets/` — portrait and Klienera screenshots.

## Form

Posts to Supabase table `public.portfolio_leads` (insert-only for the anon key). If the
Vercel function is present and `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set in the
project, the browser can post to `/api/lead` instead; the direct path works everywhere.

## Deploy

GitHub Pages: serve the repo root from `main`. Vercel: import the repo, framework preset **Other**.
