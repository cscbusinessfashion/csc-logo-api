export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Create a beautiful modern SVG logo icon for "${name}" (Indonesian university student organization at Telkom University). Rules: viewBox="0 0 36 36" exactly. Dark background rect rx="10" fill="#0f0f0f". Use #E8001C red as main accent. Abstract geometric/symbolic shapes only, NO text or letters. Bold, simple, recognizable at small size. Return ONLY the raw SVG element, no markdown.`
        }]
      })
    });

    const data = await response.json();
    const svg = data.content?.[0]?.text?.trim() || '';
    if (!svg.includes('<svg')) return res.status(500).json({ error: 'Invalid SVG' });

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
