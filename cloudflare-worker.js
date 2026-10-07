const SITE_ORIGIN = 'https://tacocatteam.github.io';
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const TOPICS = /taco ?cat|first lego|\bfll\b|robot|great swamp|wetland|water|quality|sensor|raspberry pi|\bph\b|conductivity|\btds\b|dissolved oxygen|temperature|salt|runoff|stream|ecosystem|environment/i;

function headers(origin = '') {
  const result = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
  if (!origin || origin === SITE_ORIGIN) result['Access-Control-Allow-Origin'] = SITE_ORIGIN;
  return result;
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      return origin && origin !== SITE_ORIGIN
        ? new Response(null, { status: 403 })
        : new Response(null, { status: 204, headers: headers(origin) });
    }
    if (request.method === 'GET') return json({ ok: true, name: 'TacoChat AI', model: 'Gemma 4' }, 200, origin);
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);
    if (origin && origin !== SITE_ORIGIN) return json({ error: 'Origin not allowed.' }, 403, origin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Please send valid JSON.' }, 400, origin); }

    const message = String(body.message || '').trim();
    if (!message) return json({ error: 'Please enter a message.' }, 400, origin);
    if (message.length > 300) return json({ error: 'Please keep your message under 300 characters.' }, 400, origin);
    if (/^hello[!.?]*$/i.test(message)) {
      return json({ reply: 'Hello, how can I help you today', filtered: true }, 200, origin);
    }
    if (!TOPICS.test(message)) {
      return json({ reply: "Sorry, but I haven't learned that yet. Meow!", filtered: true }, 200, origin);
    }

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          {
            role: 'system',
            content: 'You are TacoChat, the friendly website assistant for Team Tacocat, FIRST LEGO League team #34043, and its Great Swamp Water Watch project. Answer only about Team Tacocat, FIRST LEGO League, the Great Swamp and wetlands, environmental protection, road-salt runoff, water quality, or the planned Raspberry Pi monitoring system using pH, conductivity/TDS, dissolved oxygen, and water temperature. The sensors have not been deployed and there are no live readings. Never invent team history, results, dates, measurements, or deployment progress. If unsure, say you have not learned that yet. Use clear student-friendly language, answer in 2-4 short sentences, and always end with Meow!'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 180,
        temperature: 0.35,
        chat_template_kwargs: { enable_thinking: false }
      });
      let reply = String(result.response || result.choices?.[0]?.message?.content || '').trim();
      if (!reply) reply = "Sorry, I couldn't answer that right now. Meow!";
      if (!/meow!?$/i.test(reply)) reply += ' Meow!';
      return json({ reply }, 200, origin);
    } catch {
      return json({ error: 'TacoChat is temporarily unavailable. Please try again soon. Meow!' }, 503, origin);
    }
  }
};
