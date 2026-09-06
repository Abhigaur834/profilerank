# ProfileRank AI setup

The analyzer now supports a real server-side AI endpoint at `/api/analyze` and automatically falls back to the local analyzer when the endpoint is unavailable.

## Deploying the AI endpoint

GitHub Pages can host the static frontend, but it cannot run the Node serverless function in `api/analyze.js`. Deploy the repository to a serverless host that supports Node functions (for example Vercel or Netlify), or host the API separately.

Set these environment variables on the API deployment:

- `OPENAI_API_KEY` — your provider key. Never put this in `app.js`, HTML, or a public GitHub file.
- `AI_MODEL` — optional; defaults to `gpt-4o-mini`.
- `ALLOWED_ORIGIN` — optional browser origin restriction.

The browser sends only the target role and pasted profile to `/api/analyze`. The API calls the model and returns structured JSON. No LinkedIn password or LinkedIn scraping is used.

## Current behavior

1. User selects a target role and pastes profile content.
2. ProfileRank calls `/api/analyze`.
3. If configured, the server returns AI scoring, section analysis, role-specific rewrites, keywords, and a 7-day action plan.
4. If the API is unavailable, the product remains usable with the deterministic local analyzer.

For production, add authentication, rate limiting, request logging with sensitive text excluded, abuse protection, and a database before opening the endpoint publicly.
