# ProfileRank production setup

## Current architecture

- Frontend: existing static app.
- API: Vercel serverless functions under `/api`.
- AI: OpenAI API called only from the server; the browser never receives the API key.
- Database/Auth: Supabase Auth + Postgres schema in `supabase/schema.sql`.

GitHub Pages is useful for the prototype, but it is static hosting and does not execute the `/api` functions. GitHub's own documentation also says Pages is not intended to operate a commercial SaaS. Move the public app to a production host such as Vercel before collecting customer data or charging users.

## 1. Deploy the repository to Vercel

Import `Abhigaur834/profilerank` into Vercel and deploy the `main` branch.

The included `vercel.json` configures the API functions.

Set these server environment variables in Vercel:

- `OPENAI_API_KEY` — required for live AI.
- `AI_MODEL` — optional, defaults to `gpt-4o-mini`.
- `ALLOWED_ORIGIN` — set to the final frontend origin.

Never put `OPENAI_API_KEY` in frontend JavaScript.

## 2. Create the Supabase project

Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.

Enable:

- Email/password or magic-link authentication.
- Google OAuth if desired.

Use only the public Supabase URL and anon key in the browser. Never expose the service-role key.

## 3. Connect the frontend

The current frontend keeps the existing demo flow as a safe fallback. The production auth/database adapter should be enabled once the Supabase project values and production frontend URL are known.

Required browser values:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 4. Production domain

Recommended final setup:

`app.profilerank.com` → Vercel frontend/API

Supabase → authentication + database

OpenAI → server-side AI analysis

GitHub → source control/CI

## 5. Before launch

- Configure OAuth callback URLs.
- Add email verification/password reset.
- Add rate limiting and abuse protection to `/api/analyze`.
- Store every completed analysis against the authenticated user.
- Add privacy policy and terms.
- Add account deletion/data export.
- Add billing only after the free flow is stable.
- Remove unverified marketing claims such as user-count/testimonial claims unless substantiated.
