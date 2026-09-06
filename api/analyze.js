const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function send(res, status, body) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(body);
}

function promptFor(role, profile) {
  return `You are ProfileRank, a senior career-brand analyst. Analyze the user's pasted professional profile for the target role: ${role}.
Return ONLY valid JSON matching this schema:
{
  "score": number,
  "summary": string,
  "sections": [{"name": string, "score": number, "reason": string, "actions": [string,string]}],
  "rewrites": {"headline": string, "about": string, "experienceBullets": [string,string,string]},
  "keywords": [string,string,string,string,string,string,string,string],
  "actionPlan": [{"day": string, "task": string, "why": string}]
}
Rules: scores 0-100; be specific to the target role; never invent employers, credentials, metrics or achievements. If evidence is missing, use placeholders like [metric] or explain what proof is needed. Headline should be concise and searchable. About should be 120-180 words. Experience bullets should use action + work + impact, but preserve only facts supported by the input. Give exactly 7 action-plan items and 8 keywords.

PROFILE:
${profile}`;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'AI backend is not configured yet.' });

  try {
    const { role, profile } = req.body || {};
    if (!profile || typeof profile !== 'string' || profile.trim().length < 30) {
      return send(res, 400, { error: 'Please provide at least 30 characters of profile text.' });
    }
    if (profile.length > 12000) return send(res, 413, { error: 'Profile text is too long. Keep it under 12,000 characters.' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You produce structured, evidence-based career analysis. Never fabricate facts.' },
          { role: 'user', content: promptFor((role || 'Operations Manager').trim(), profile.trim()) }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return send(res, 502, { error: data?.error?.message || 'AI provider request failed.' });
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return send(res, 502, { error: 'AI provider returned an empty response.' });

    let result;
    try { result = JSON.parse(content); } catch { return send(res, 502, { error: 'AI provider returned invalid structured data.' }); }
    return send(res, 200, { ...result, provider: 'openai', model: MODEL });
  } catch (error) {
    return send(res, 500, { error: 'Unexpected server error.' });
  }
};
