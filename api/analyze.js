const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

const allowedOrigins = new Set([
  'https://abhigaur834.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080'
]);

function send(req, res, status, body) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

function extractEvidence(profile) {
  const text = String(profile || '').trim();
  const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const metrics = [...new Set(text.match(/(?:\d+(?:\.\d+)?%|₹\s?[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\+?\s*(?:years?|months?|people|agents|members|customers|projects?|accounts?|clients?|reps?|employees?)\b)/gi) || [])];
  const teams = [...new Set((text.match(/(?:managed|led|built|coached|mentored|supervised)[^.\n]{0,100}(?:team|agents|members|people|reps|employees)/gi) || []))].slice(0, 5);
  const achievements = lines.filter(x => /\b(increased|improved|reduced|grew|delivered|achieved|generated|saved|built|launched|led|managed|drove|raised|cut|optimized|exceeded|reached)\b/i.test(x)).slice(0, 10);
  const skills = [...new Set((text.match(/\b(sales|revenue|operations|strategy|leadership|management|analytics|marketing|product|customer experience|process improvement|coaching|recruitment|project management|business development|account management|crm|forecasting)\b/gi) || []).map(x => x.toLowerCase()))].slice(0, 15);
  return { headlineCandidate: lines[0] || '', metrics, teams, achievements, skills, wordCount: text.split(/\s+/).filter(Boolean).length };
}

function localFallback(profile, role) {
  const text = String(profile || '').trim();
  const e = extractEvidence(text);
  const roleText = role || 'Operations Manager';
  const hasEvidence = e.metrics.length + e.achievements.length > 0;
  const score = Math.max(40, Math.min(94, 56 + (e.metrics.length ? 12 : 0) + (e.achievements.length >= 3 ? 10 : e.achievements.length ? 5 : 0) + (e.skills.length >= 4 ? 8 : 3) + (e.wordCount >= 120 ? 5 : 0)));
  const evidenceText = e.achievements[0] || e.teams[0] || e.metrics[0] || 'No specific measurable achievement was found in the supplied profile.';
  return {
    score,
    summary: hasEvidence
      ? `Your profile already shows evidence of ${e.skills.slice(0, 3).join(', ') || 'relevant professional experience'}. The biggest opportunity is to make that evidence more visible for ${roleText}, especially ${e.metrics.length ? 'by connecting your metrics to business outcomes' : 'by adding verified outcomes to the responsibilities you describe'}.`
      : `Your profile gives us a starting point, but it contains limited outcome evidence for ${roleText}. The biggest improvement is to add specific, truthful results to the work you describe.`,
    evidence: e,
    sections: [
      { name: 'Positioning', score: e.headlineCandidate.toLowerCase().includes(roleText.toLowerCase()) ? 84 : 68, reason: `Your opening says “${e.headlineCandidate.slice(0, 110)}”. It should make your target ${roleText} positioning clearer without changing your actual experience.`, actions: [`Align your opening with ${roleText} using experience already present in the profile.`, 'Keep the positioning specific to your actual function and seniority.'] },
      { name: 'Headline', score: e.headlineCandidate ? 72 : 55, reason: `The current opening is “${e.headlineCandidate.slice(0, 110)}”. It can surface your strongest evidence and target-role language earlier.`, actions: ['Lead with your real specialty, scope and strongest verified outcome.', 'Do not add a metric unless you can support it.'] },
      { name: 'About', score: e.wordCount >= 80 ? 76 : 58, reason: e.achievements.length ? `Your profile contains evidence such as “${e.achievements[0].slice(0, 130)}”. Your About should connect that proof to the value you bring. : 'Your supplied profile has limited About-style context, so your value proposition is difficult to distinguish from generic role descriptions.', actions: ['Open with the professional value demonstrated by your actual experience.', 'Bring 1–2 verified achievements into the first half of the section.'] },
      { name: 'Experience', score: e.metrics.length ? 86 : 62, reason: e.metrics.length ? `You already provide measurable evidence (${e.metrics.slice(0, 3).join(', ')}). The next step is connecting each number to the work that caused it.` : 'Your experience is mostly responsibility-led. Add the scale, result or change created by the work where you have evidence.', actions: ['Turn responsibility statements into action + scope + verified outcome.', 'Use [metric] only where the actual number is not yet available.'] },
      { name: 'Searchability', score: Math.min(90, 58 + e.skills.length * 2), reason: `Detected role-relevant language: ${e.skills.slice(0, 8).join(', ') || 'limited role-specific keywords'}. These should be concentrated around the target role rather than added as a generic keyword list.`, actions: [`Prioritize keywords that genuinely match ${roleText}.`, 'Mirror terminology already supported by your experience.'] }
    ],
    rewrites: {
      headline: e.skills.length ? `${roleText} | ${e.skills.slice(0, 2).map(x => x.replace(/\b\w/g, c => c.toUpperCase())).join(' & ')} | ${e.metrics[0] ? `Proven ${e.metrics[0]} impact` : 'Team & Business Execution'}` : `${roleText} | ${e.teams.length ? 'Team Leadership' : 'Business Operations'} | Evidence-led professional`,
      about: e.achievements.length
        ? `I’m a ${roleText} with experience in ${e.skills.slice(0, 4).join(', ') || 'business execution'}. My background includes ${e.achievements.slice(0, 2).join(' ')}${e.metrics.length ? ` Key evidence includes ${e.metrics.slice(0, 3).join(', ')}.` : ''} I focus on translating priorities into consistent execution, stronger team performance and measurable business outcomes. The strongest version of this profile should continue to build on the experience already demonstrated here, while making scope, ownership and results easier for recruiters to understand.`
        : `I’m a ${roleText} with experience in ${e.skills.slice(0, 4).join(', ') || 'business execution'}. My profile currently shows responsibilities more clearly than outcomes, so I would position my experience around the work I actually own, the teams or processes I influence, and the verified results I have delivered. I focus on clear execution, continuous improvement and measurable business outcomes.`,
      experienceBullets: [
        e.achievements[0] ? `Built on your existing evidence: ${e.achievements[0]}` : `Led ${roleText.toLowerCase()} responsibilities across the scope described in the profile; add the verified business outcome here.`,
        e.teams[0] ? `Used the leadership scope already stated in your profile: ${e.teams[0]}. Add the verified performance or business result.` : 'Owned the responsibilities described in the profile and improved execution; add the verified scale or outcome.',
        e.metrics[0] ? `Connect the verified result ${e.metrics[0]} directly to the initiative, process or leadership action that produced it.` : 'Add a verified metric, volume, timeframe or before/after result to the strongest experience bullet.'
      ]
    },
    keywords: [...new Set([roleText.toLowerCase(), ...e.skills])].slice(0, 8),
    actionPlan: [
      { day: 'DAY 1', task: `Clarify your ${roleText} positioning`, why: 'Use the strongest role and experience evidence already present.' },
      { day: 'DAY 2', task: 'Rewrite the headline around your real specialty', why: 'Move your most relevant evidence into the first line.' },
      { day: 'DAY 3', task: 'Strengthen the About with proof', why: 'Connect your experience to outcomes instead of generic claims.' },
      { day: 'DAY 4', task: 'Quantify the top three experience bullets', why: 'Add only verified numbers, scale or outcomes.' },
      { day: 'DAY 5', task: 'Prioritize target-role skills', why: `Focus on skills already supported by your experience and relevant to ${roleText}.` },
      { day: 'DAY 6', task: 'Add missing credibility evidence', why: 'Use projects, achievements or credentials that are actually true.' },
      { day: 'DAY 7', task: 'Re-score after edits', why: 'Measure whether the changes improved the evidence gaps.' }
    ],
    provider: 'local-evidence-fallback'
  };
}

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'number' },
    summary: { type: 'string' },
    evidence: {
      type: 'object', additionalProperties: false,
      properties: {
        roleSignals: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'array', items: { type: 'string' } },
        leadershipSignals: { type: 'array', items: { type: 'string' } },
        skills: { type: 'array', items: { type: 'string' } },
        missingEvidence: { type: 'array', items: { type: 'string' } }
      }, required: ['roleSignals','achievements','metrics','leadershipSignals','skills','missingEvidence']
    },
    sections: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { name: {type:'string'}, score:{type:'number'}, reason:{type:'string'}, actions:{type:'array',items:{type:'string'}} }, required:['name','score','reason','actions'] } },
    rewrites: { type: 'object', additionalProperties: false, properties: { headline:{type:'string'}, about:{type:'string'}, experienceBullets:{type:'array',items:{type:'string'}} }, required:['headline','about','experienceBullets'] },
    keywords: { type:'array', items:{type:'string'} },
    actionPlan: { type:'array', items:{ type:'object', additionalProperties:false, properties:{day:{type:'string'},task:{type:'string'},why:{type:'string'}}, required:['day','task','why'] } }
  }, required:['score','summary','evidence','sections','rewrites','keywords','actionPlan']
};

function promptFor(role, profile) {
  return `You are ProfileRank's evidence-first career intelligence engine. Target role: ${role}.\n\nCRITICAL RULE: analyze THIS profile, not a generic ${role} persona. Every recommendation must be traceable to text in the supplied profile. First extract evidence, then diagnose gaps, then rewrite.\n\nRules:\n- Never invent employers, titles, dates, metrics, credentials, technologies, responsibilities or achievements.\n- Preserve the user's actual career story.\n- Quote or closely reference supplied evidence when explaining weaknesses.\n- If evidence is missing, explicitly call it a gap and use [metric], [scope], [result] placeholders only in rewrite suggestions.\n- Do not claim that a metric exists unless it appears in the profile.\n- Distinguish responsibilities from achievements.\n- Compare the evidence in this profile against what a recruiter hiring for ${role} would need to understand.\n- Scores must reflect this exact profile and explain the score using profile-specific evidence.\n- Rewrites must be grounded in supplied facts, not generic career language.\n- Return 5-7 sections, 6-10 keywords, and exactly 7 action-plan items.\n\nPROFILE:\n${profile}`;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(req, res, 204, {});
  if (req.method !== 'POST') return send(req, res, 405, { error: 'Method not allowed' });
  const { role, profile } = req.body || {};
  const targetRole = (role || 'Operations Manager').trim();
  if (!profile || typeof profile !== 'string' || profile.trim().length < 30) return send(req, res, 400, { error: 'Please provide at least 30 characters of profile text.' });
  if (profile.length > 12000) return send(req, res, 413, { error: 'Profile text is too long. Keep it under 12,000 characters.' });

  if (!process.env.OPENAI_API_KEY) return send(req, res, 200, localFallback(profile, targetRole));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.15,
        response_format: { type: 'json_schema', json_schema: { name: 'profilerank_analysis', strict: true, schema } },
        messages: [
          { role: 'system', content: 'You are an evidence-first career analyst. Personalization and factual grounding are more important than sounding polished. Never fabricate.' },
          { role: 'user', content: promptFor(targetRole, profile.trim()) }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) return send(req, res, 502, { error: data?.error?.message || 'AI provider request failed.' });
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return send(req, res, 502, { error: 'AI provider returned an empty response.' });
    let result;
    try { result = JSON.parse(content); } catch { return send(req, res, 502, { error: 'AI provider returned invalid structured data.' }); }
    return send(req, res, 200, { ...result, provider: 'openai', model: MODEL });
  } catch (error) {
    console.error('ProfileRank API error:', error);
    return send(req, res, 200, localFallback(profile, targetRole));
  }
};
