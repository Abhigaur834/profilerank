# ProfileRank Data Model — Phase 2

## User
- id
- email
- name
- career_level
- target_role
- industry
- created_at
- updated_at

## Profile
- id
- user_id
- headline
- about
- experience
- skills
- source_text
- score
- analyzed_at

## Analysis
- id
- profile_id
- positioning_score
- headline_score
- about_score
- experience_score
- skills_score
- proof_score
- searchability_score
- recommendations_json
- created_at

## ActionItem
- id
- user_id
- title
- category
- priority
- status
- due_date
- completed_at

## ContentIdea
- id
- user_id
- pillar
- hook
- body_outline
- created_at

Production implementation should use server-side validation, authentication, encrypted storage, explicit consent, and deletion/export controls.
