const SITE_ORIGIN = 'https://tacocatteam.github.io';
const MODEL = '@cf/meta/llama-3.2-1b-instruct';
const SPEECH_MODEL = '@cf/myshell-ai/melotts';
const TEAM_DESCRIPTION = 'Team Tacocat is FIRST LEGO League robotics team #34043, made up of creative students who use robotics, coding, research, engineering, and teamwork to solve real-world problems. Our current Innovation Project, Great Swamp Water Watch, explores how a Raspberry Pi and water-quality sensors can measure pH, conductivity and TDS, dissolved oxygen, and water temperature. We want to turn these measurements into clear, understandable information that helps people learn about the Great Swamp, recognize changes in water quality, and understand why protecting wetlands and wildlife matters. Meow!';
const TEAM_QUESTION = /\b(?:team\s+taco\s*cat|team\s+tacocat|your\s+team|about\s+(?:the\s+)?team|who\s+(?:is|are)\s+(?:team\s+)?taco\s*cat)\b/i;
const PI_DESCRIPTION = 'TacoChat is the website assistant, not a Raspberry Pi. Team Tacocat\u2019s Great Swamp Water Watch system is designed to use a Raspberry Pi 3B+ to collect and organize information from its water-quality sensors. Meow!';
const PI_QUESTION = /\braspberry\s*pi\b|\b(?:which|what)\s+pi\b|\bpi\s+model\b/i;
const IDENTITY_DESCRIPTION = 'I am TacoChat, the official chatbot for the Tacocat Team, how can I help';
const IDENTITY_QUESTION = /^\s*(?:who|what)\s+(?:are|r)\s+(?:you|u)[!?.,]*\s*$/i;
const SHORT_ANSWERS = {
  do: 'DO stands for dissolved oxygen, the oxygen available in water for fish, insects, and other aquatic organisms to breathe. It can change with temperature, water movement, plant activity, and decomposition. Meow!',
  ph: 'pH describes how acidic or basic water is. Team Tacocat plans to track it as one of four water-quality measurements. Meow!',
  tds: 'TDS stands for total dissolved solids, an estimate of the dissolved substances in water. It is often estimated using conductivity. Meow!'
};

function headers(origin = '', contentType = 'application/json; charset=utf-8') {
  const result = {
    'Content-Type': contentType,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
  if (!origin || origin === SITE_ORIGIN) result['Access-Control-Allow-Origin'] = SITE_ORIGIN;
  return result;
}

function decodeBase64Audio(value) {
  const encoded = String(value).replace(/^data:audio\/[^;]+;base64,/, '');
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function speechResponse(request, env, origin) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Please send valid JSON.' }, 400, origin); }
  const text = String(body.text || '').trim();
  if (!text) return json({ error: 'Please provide text to read.' }, 400, origin);
  if (text.length > 900) return json({ error: 'Speech text is too long.' }, 400, origin);

  try {
    const result = await env.AI.run(SPEECH_MODEL, { prompt: text, lang: 'en' });
    const audioHeaders = headers(origin, 'audio/wav');
    audioHeaders['Cache-Control'] = 'no-store';
    if (result instanceof Response) {
      return new Response(result.body, { status: result.status, headers: audioHeaders });
    }
    if (result instanceof ReadableStream || result instanceof ArrayBuffer || ArrayBuffer.isView(result)) {
      return new Response(result, { headers: audioHeaders });
    }
    const encodedAudio = typeof result === 'string' ? result : result?.audio;
    if (!encodedAudio) throw new Error('No audio returned');
    return new Response(decodeBase64Audio(encodedAudio), { headers: audioHeaders });
  } catch {
    return json({ error: 'TacoChat voice is temporarily unavailable.' }, 503, origin);
  }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return origin && origin !== SITE_ORIGIN
        ? new Response(null, { status: 403 })
        : new Response(null, { status: 204, headers: headers(origin) });
    }
    if (request.method === 'GET') return json({ ok: true, name: 'TacoChat AI', model: 'Llama 3.2 1B', release: 'llama-1b-v4' }, 200, origin);
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);
    if (origin && origin !== SITE_ORIGIN) return json({ error: 'Origin not allowed.' }, 403, origin);
    if (url.pathname === '/speech') return speechResponse(request, env, origin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Please send valid JSON.' }, 400, origin); }

    const message = String(body.message || '').trim();
    if (!message) return json({ error: 'Please enter a message.' }, 400, origin);
    if (message.length > 300) return json({ error: 'Please keep your message under 300 characters.' }, 400, origin);
    if (/^hello[!.?]*$/i.test(message)) {
      return json({ reply: 'Hello, how can I help you today', hardcoded: true }, 200, origin);
    }
    if (IDENTITY_QUESTION.test(message)) {
      return json({ reply: IDENTITY_DESCRIPTION, hardcoded: true }, 200, origin);
    }
    if (PI_QUESTION.test(message)) {
      return json({ reply: PI_DESCRIPTION, hardcoded: true }, 200, origin);
    }
    if (TEAM_QUESTION.test(message)) {
      return json({ reply: TEAM_DESCRIPTION, hardcoded: true }, 200, origin);
    }
    const shortAnswer = SHORT_ANSWERS[message.toLowerCase().replace(/[^a-z0-9]/g, '')];
    if (shortAnswer) return json({ reply: shortAnswer, hardcoded: true }, 200, origin);
    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          {
            role: 'system',
            content: 'You are TacoChat, the official chatbot for the Tacocat Team and the friendly website assistant for FIRST LEGO League team #34043 and its Great Swamp Water Watch project. You are not a Raspberry Pi. The project is designed to use a Raspberry Pi 3B+, never a Raspberry Pi 4 Model B. Answer any question directly, including general knowledge questions, short terms, abbreviations, follow-up questions, and phrases such as "your team." Do not reject or redirect a question merely because it is unrelated to Team Tacocat. Give especially helpful answers about Team Tacocat, FIRST LEGO League, the Great Swamp and wetlands, environmental protection, road-salt runoff, water quality, and the planned Raspberry Pi 3B+ monitoring system using pH, conductivity/TDS, dissolved oxygen (DO), and water temperature. The sensors have not been deployed and there are no live readings. Never invent team history, results, dates, measurements, hardware models, or deployment progress; clearly say when team-specific information is unknown. Use clear student-friendly language, usually answer in 2-4 short sentences, and always end with Meow!'
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
