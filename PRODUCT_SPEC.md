# ProfileRank — Product Specification

## 1. Product vision
ProfileRank is a career-brand optimization platform that helps professionals turn their LinkedIn profile and resume into recruiter-ready assets, then gives them a practical weekly action plan for visibility and job growth.

**Positioning:** Turn your professional profile into a recruiter-ready asset.

ProfileRank is inspired by the category and workflows popularized by career-growth platforms, but uses its own brand, scoring model, UX and content.

## 2. Target users
- Early career: improve positioning, discoverability and credibility.
- Mid-career: sharpen specialization, quantify impact and improve inbound opportunities.
- Senior/leadership: strengthen executive positioning, authority and proof.

## 3. MVP modules
1. **Profile Analyzer** — profile input, section scoring, weaknesses and prioritized fixes.
2. **Profile Makeover** — rewrite guidance for headline, About, experience and skills.
3. **Resume Analyzer** — resume readiness checks and improvement suggestions.
4. **Content Assistant** — post ideas, hooks, weekly calendar and engagement prompts.
5. **Action Plan** — converts recommendations into a simple 7-day execution plan.
6. **Dashboard** — score, progress, quick wins and recent activity.

## 4. Information architecture
- Dashboard
- Profile Analyzer
- Resume
- Content
- Action Plan
- Settings

## 5. Screen-by-screen architecture
### Screen 01 — Landing
Hero, value proposition, score preview, product modules, trust/value points and primary CTA: Analyze my profile.

### Screen 02 — Profile input
Two modes: paste profile text or use a public profile URL. The MVP does not scrape LinkedIn or request credentials; URL input is treated as a convenience field and the user can paste profile content for analysis.

### Screen 03 — Analysis loading
Progress state explaining that ProfileRank is evaluating positioning, searchability, proof and completeness.

### Screen 04 — Results overview
Large overall score, recruiter-readiness status, score delta opportunity, category breakdown and top three quick wins.

### Screen 05 — Section detail
Headline, About, Experience, Skills, Positioning, Searchability and Credibility cards. Each card contains current assessment, why it matters, suggested action and example rewrite.

### Screen 06 — Makeover workspace
Before/after editor with recommendation chips, tone selector and copy action. Future versions can connect an LLM for personalized generation.

### Screen 07 — Resume
Upload/paste resume, score, ATS/readability checks, missing proof and rewrite suggestions.

### Screen 08 — Content assistant
Content pillars, post ideas, hooks, weekly calendar, comment prompts and CTA suggestions.

### Screen 09 — Action plan
7-day checklist prioritized by impact and effort. Progress is persisted locally in the MVP.

### Screen 10 — Settings
Profile preferences, target role, experience level, privacy note and local-data reset.

## 6. Scoring model
Initial score is a deterministic client-side heuristic so the MVP works without a backend.

- Positioning — 20 points
- Headline — 15 points
- About — 15 points
- Experience — 15 points
- Skills — 10 points
- Searchability — 10 points
- Credibility/proof — 15 points

Score bands:
- 0–49: Needs work
- 50–69: Developing
- 70–84: Recruiter-ready
- 85–100: Highly optimized

The scoring engine is intentionally replaceable so a future backend/AI evaluator can use the same contract.

## 7. MVP data model
```text
Profile
  name
  targetRole
  level
  headline
  about
  experience
  skills
  score
  categoryScores[]
  recommendations[]

Action
  id
  title
  impact
  effort
  completed
```

## 8. Privacy and trust
- Never ask for a LinkedIn password.
- No LinkedIn scraping is performed by this static MVP.
- Pasted profile content is analyzed in-browser.
- LocalStorage is used only for demo persistence.
- A production backend must use explicit consent, encryption, access controls and data deletion.

## 9. Future technical architecture
**Frontend:** Next.js/React or equivalent.
**API:** Node/TypeScript service.
**Database:** PostgreSQL.
**AI layer:** structured profile evaluation + rewrite generation.
**Auth:** OAuth/email authentication.
**Storage:** encrypted object storage for resumes where required.
**Analytics:** product events for onboarding completion, analysis, rewrite usage and action-plan completion.

## 10. Core product events
`landing_cta_clicked`, `profile_analysis_started`, `profile_analysis_completed`, `recommendation_opened`, `rewrite_copied`, `resume_analysis_started`, `content_idea_generated`, `action_completed`.

## 11. Roadmap
### Phase 1 — MVP
Static web app, deterministic analyzer, polished dashboard, makeover guidance, content ideas and local action tracking.

### Phase 2 — AI personalization
LLM-powered rewrites, role-specific scoring, resume parsing and personalized content generation.

### Phase 3 — Account + history
Authentication, saved profiles, score history, resume versions and progress analytics.

### Phase 4 — Growth platform
Expert review marketplace, templates, deeper career intelligence and integrations.

## 12. Definition of done for MVP
- Responsive landing page.
- Working profile analysis flow.
- Results dashboard with category scores.
- Actionable recommendations.
- Working makeover copy interaction.
- Resume and content modules represented in the product shell.
- 7-day action plan with local persistence.
- No credential collection or misleading scraping claims.
- GitHub Pages compatible static deployment.
