const SITE_ORIGIN = 'https://tacocatteam.github.io';
const MODEL = '@cf/meta/llama-3.2-1b-instruct';
const FALLBACK_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const SPEECH_MODEL = '@cf/deepgram/aura-2-en';
const SPEECH_VOICE = 'luna';
const TEAM_DESCRIPTION = 'Team Tacocat is FIRST LEGO League robotics team #34043. We use research, engineering, coding, robotics, and teamwork to solve real-world problems. For the 2026–27 BIOGLOW season, our Innovation Project is a proposed school rain garden. We are exploring how a shallow planted area could slow runoff, help water soak into the ground, and support local biodiversity. The team has drafted model comparisons and is still working through site choice, testing, plants, and a full garden plan. Meow!';
const TEAM_QUESTION = /\b(?:team\s+taco\s*cat|team\s+tacocat|your\s+team|about\s+(?:the\s+)?team|who\s+(?:is|are)\s+(?:team\s+)?taco\s*cat)\b/i;
const PI_DESCRIPTION = 'TacoChat is the website assistant, not a Raspberry Pi. A Raspberry Pi appeared in an earlier water-monitoring concept; the current BIOGLOW project focuses on a proposed rain garden. Meow!';
const PI_QUESTION = /\braspberry\s*pi\b|\b(?:which|what)\s+pi\b|\bpi\s+model\b/i;
const IDENTITY_DESCRIPTION = 'I am TacoChat, the official chatbot for the Tacocat Team, how can I help';
const GREETING = /^\s*(?:hello|hi|hey)(?:\s+(?:there|tacochat))?[!?.,]*\s*$/i;
const IDENTITY_QUESTION = /\b(?:(?:who|what)\s+(?:are|r)\s+(?:you|u)|who\s+(?:you|u)\s+(?:are|r))\b/i;
const SHORT_ANSWERS = {
  do: 'DO stands for dissolved oxygen, the oxygen available in water for fish, insects, and other aquatic organisms to breathe. It can change with temperature, water movement, plant activity, and decomposition. Meow!',
  ph: 'pH describes how acidic or basic water is. It is one possible measurement when comparing water samples, but the rain-garden model has no published results yet. Meow!',
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
    const result = await env.AI.run(SPEECH_MODEL, {
      text,
      speaker: SPEECH_VOICE,
      encoding: 'mp3'
    }, { returnRawResponse: true });
    if (result instanceof Response) {
      const audioHeaders = headers(origin, result.headers.get('Content-Type') || 'audio/mpeg');
      audioHeaders['Cache-Control'] = 'no-store';
      return new Response(result.body, { status: result.status, headers: audioHeaders });
    }
    const audioHeaders = headers(origin, 'audio/mpeg');
    audioHeaders['Cache-Control'] = 'no-store';
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
    if (request.method === 'GET') return json({ ok: true, name: 'TacoChat AI', model: 'Llama 3.2 1B with Gemma 4 fallback', release: 'rain-garden-v2' }, 200, origin);
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);
    if (origin && origin !== SITE_ORIGIN) return json({ error: 'Origin not allowed.' }, 403, origin);
    if (url.pathname === '/speech') return speechResponse(request, env, origin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Please send valid JSON.' }, 400, origin); }

    const message = String(body.message || '').trim();
    if (!message) return json({ error: 'Please enter a message.' }, 400, origin);
    if (message.length > 300) return json({ error: 'Please keep your message under 300 characters.' }, 400, origin);
    if (GREETING.test(message)) {
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
            content: 'You are TacoChat, the official chatbot for FIRST LEGO League team #34043. The current 2026–27 BIOGLOW Innovation Project is a proposed school rain garden. Team Tacocat is exploring how runoff can be slowed and allowed to soak into suitable soil while native plants support biodiversity. The engineering notebook proposes three model setups: an empty control, grass and soil, and a layered garden with plants, soil, sand, and gravel. A full garden location, drainage, plants, and results are not confirmed. Earlier Great Swamp water monitoring was a previous concept, not the current project. Answer any question directly, including general knowledge and follow-ups. Be especially helpful about Team Tacocat, rain gardens, runoff, native plants, biodiversity, and fair model tests. Never invent team history, measurements, test results, dates, construction progress, or approvals. Use clear student-friendly language, usually 2–4 short sentences, and end with Meow!'
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
    } catch (primaryError) {
      console.warn('Primary Workers AI model unavailable', primaryError);
      try {
        const fallback = await env.AI.run(FALLBACK_MODEL, {
          messages: [
            { role: 'system', content: 'You are TacoChat, the friendly assistant for FIRST LEGO League team #34043. Their current 2026–27 BIOGLOW project is a proposed school rain garden to slow runoff and support native plants and biodiversity. The full garden and test results are not confirmed. Answer the user directly in 2–4 clear, student-friendly sentences. Do not invent team facts. End with Meow!' },
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.35,
          chat_template_kwargs: { enable_thinking: false }
        });
        let reply = String(fallback.response || fallback.choices?.[0]?.message?.content || '').trim();
        if (!reply) throw new Error('Fallback returned no text');
        if (!/meow!?$/i.test(reply)) reply += ' Meow!';
        return json({ reply, fallback: true }, 200, origin);
      } catch (fallbackError) {
        console.error('Both Workers AI models unavailable', fallbackError);
        return json({ error: 'TacoChat is temporarily unavailable. Please try again soon. Meow!' }, 503, origin);
      }
    }
  }
};
