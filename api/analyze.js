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

function localFallback(profile, role) {
  const text = String(profile || '');
  const l = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const numbers = (text.match(/\b\d+(?:\.\d+)?%?|₹\s?[\d,]+|\b\d+\+?\b/g) || []).length;
  const keywords = (l.match(/sales|revenue|growth|operations|strategy|leadership|customer|product|marketing|analytics|management|process|team/g) || []).length;
  const score = Math.min(94, Math.max(42, 55 + (/manager|director|lead|specialist|analyst|engineer|sales|marketing|product|operations/.test(l) ? 9 : 0) + (numbers ? 12 : 0) + (/skills|competenc|expertise/.test(l) ? 7 : 0) + (/about|i |i’m|i'm|lead|build|work/.test(l) ? 6 : 0) + (words > 100 ? 5 : 0) + (keywords >= 5 ? 6 : 0)));
  return {
    score,
    summary: `Profile analyzed for ${role}. Add specific, truthful outcomes and role-aligned keywords to improve recruiter readiness.`,
    provider: 'local-fallback',
    sections: [
      { name: 'Positioning', score: /manager|director|lead|operations|sales|product/.test(l) ? 84 : 62, reason: 'Clarify the target role and professional specialty.', actions: ['State your target function clearly.', 'Connect your specialty to a business outcome.'] },
      { name: 'Headline', score: /manager|director|lead|sales|operations|product/.test(l) ? 82 : 60, reason: 'Make the first line more searchable and outcome-led.', actions: ['Add role + specialty + outcome.', 'Use 1–2 target-role keywords naturally.'] },
      { name: 'About', score: /about|i |i’m|i'm|lead|build|work/.test(l) ? 78 : 52, reason: 'Lead with value, proof and direction.', actions: ['Open with a concise value proposition.', 'Add 2–3 quantified achievements.'] },
      { name: 'Experience', score: numbers ? 88 : 61, reason: 'Make impact easier to verify.', actions: ['Use action + work + impact.', 'Add scale, time, volume or percentage where truthful.'] },
      { name: 'Searchability', score: keywords >= 4 ? 84 : 62, reason: 'Increase alignment with target-role language.', actions: ['Use recruiter language naturally.', 'Prioritize role-specific skills.'] }
    ],
    rewrites: {
      headline: `${role} | ${keywords >= 2 ? 'Strategy, Operations & Growth' : 'Business Operations & Leadership'} | Driving measurable outcomes`,
      about: `I’m a ${role} focused on business growth, operational excellence and high-performing teams. I help turn complex goals into clear priorities, better execution and measurable outcomes. The strongest version of this profile should combine your functional expertise with evidence of scale, impact and leadership. Add 2–3 verified achievements to make the story more credible and differentiated. I’m especially interested in opportunities where I can combine strategic thinking, hands-on leadership and continuous improvement.`,
      experienceBullets: ['Drove measurable improvements in performance, efficiency and customer outcomes using the experience provided.', 'Led teams and cross-functional stakeholders to improve execution and accountability.', 'Built repeatable processes aligned to the target role — add the verified business impact.']
    },
    keywords: ['target role', 'leadership', 'operations', 'growth', 'strategy', 'measurable outcomes'].slice(0, keywords >= 4 ? 6 : 4),
    actionPlan: []
  };
}

function promptFor(role, profile) {
  return `You are ProfileRank, a senior career-brand analyst. Analyze the user's pasted professional profile for the target role: ${role}. Return ONLY valid JSON matching this schema: {"score":number,"summary":string,"sections":[{"name":string,"score":number,"reason":string,"actions":[string,string]}],"rewrites":{"headline":string,"about":string,"experienceBullets":[string,string,string]},"keywords":[string,string,string,string,string,string,string,string],"actionPlan":[{"day":string,"task":string,"why":string}]}. Scores are 0-100. Be specific. Never invent employers, credentials, metrics or achievements. If evidence is missing, use placeholders like [metric]. Headline should be concise and searchable. About should be 120-180 words. Experience bullets must preserve only facts supported by the input. Give exactly 7 action-plan items and 8 keywords.\n\nPROFILE:\n${profile}`;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(req, res, 204, {});
  if (req.method !== 'POST') return send(req, res, 405, { error: 'Method not allowed' });
  const { role, profile } = req.body || {};
  if (!profile || typeof profile !== 'string' || profile.trim().length < 30) return send(req, res, 400, { error: 'Please provide at least 30 characters of profile text.' });
  if (profile.length > 12000) return send(req, res, 413, { error: 'Profile text is too long. Keep it under 12,000 characters.' });

  if (!process.env.OPENAI_API_KEY) return send(req, res, 200, localFallback(profile.trim(), (role || 'Operations Manager').trim()));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, temperature: 0.25, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: 'You produce structured, evidence-based career analysis. Never fabricate facts.' },
        { role: 'user', content: promptFor((role || 'Operations Manager').trim(), profile.trim()) }
      ] })
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
    return send(req, res, 200, localFallback(profile.trim(), (role || 'Operations Manager').trim()));
  }
};
