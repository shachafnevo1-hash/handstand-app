/**
 * Supabase Edge Function: ai-check
 *
 * Acts as a server-side proxy for the Anthropic API so the key is never
 * exposed in the client bundle. Deploy with:
 *   supabase functions deploy ai-check
 *
 * Set the secret once:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: `Look at this image. Is this person doing ANY kind of handstand, inverted position, or physical workout/exercise?

Respond with ONLY a JSON object. No extra text before or after.

If a handstand or inverted position is detected, analyze their form and return:
{"detected": true, "type": "handstand", "confidence": "high", "message": "Great handstand!", "starRating": 4, "formFeedback": ["arms fully locked — great!", "slight banana back — tuck your hips under", "legs together and pointed"], "formScore": 80}

If no handstand, return:
{"detected": false, "confidence": "high", "message": "No handstand detected. Make sure your full body is visible.", "starRating": 0, "formFeedback": [], "formScore": 0}

Rules:
- type: "handstand" | "wall_handstand" | "inverted" | "workout" | "none"
- starRating: 1-5 integer based on overall form quality (5 = perfect straight line, arms locked, hollow body; 1 = very bent arms/back)
- formScore: 0-100 integer overall form quality percentage
- formFeedback: array of up to 4 specific coaching cues. Each cue should be concise (under 10 words). Check for: banana back (arched lower back), bent elbows, shoulders not over wrists, legs apart or bent, head looking at hands (should be neutral/between arms). Phrase positively where possible.`,
            },
          ],
        }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: anthropicRes.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Pass the raw Anthropic response straight back; client parses it the same way
    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
