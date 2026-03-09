module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: 'Create a beautiful modern SVG logo icon for "' + name + '" (Indonesian university student organization at Telkom University). Rules: viewBox="0 0 36 36" exactly. Dark background rect rx="10" fill="#0f0f0f". Use #E8001C red as main accent. Abstract geometric/symbolic shapes only, NO text or letters. Bold, simple, recognizable at small size. Return ONLY the raw SVG element, no markdown, no backticks, no explanation.'
        }]
      })
    });

    const data = await response.json();
    let svg = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content.trim() : '';

    // Strip markdown backticks if any
    svg = svg.replace(/```svg/gi, '').replace(/```/g, '').trim();

    // Extract just the SVG element
    const match = svg.match(/<svg[\s\S]*<\/svg>/i);
    if (!match) return res.status(500).json({ error: 'Invalid SVG', raw: svg });
    svg = match[0];

    // Add xmlns if missing
    if (!svg.includes('xmlns')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.send(svg);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
