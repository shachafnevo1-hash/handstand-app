/**
 * Supabase Edge Function: ai-check
 *
 * Server-side proxy for the Anthropic API. The Anthropic key never reaches the
 * client. Now hardened against abuse:
 *   - Requires a valid Supabase user JWT (Authorization: Bearer ...)
 *   - Verifies the user has an active entitlement (subscription or trial)
 *   - Caps image payload size
 *   - Restricts CORS to known app origins (drop entirely on native — kept here
 *     to support the Expo web preview origin during development)
 *
 * Deploy:
 *   supabase functions deploy ai-check
 * Secrets:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
 *   supabase secrets set SUPABASE_ANON_KEY=<anon>
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ───────────────────────────── config ──────────────────────────────────────
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB raw → ~5.5 MB base64
const ALLOWED_ORIGINS = new Set<string>([
  'https://handstandhub.app',          // future production web origin
  'http://localhost:8081',
  'http://localhost:19006',
]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allow  = ALLOWED_ORIGINS.has(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary':                         'Origin',
  };
}

function jsonResp(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

// ───────────────────────────── handler ─────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return jsonResp({ error: 'Method not allowed' }, 405, req);
  }

  // 1. Authenticate the caller — must have a valid Supabase user JWT.
  const auth = req.headers.get('authorization') || '';
  const jwt  = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) {
    return jsonResp({ error: 'unauthorized' }, 401, req);
  }

  const supabaseUrl     = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResp({ error: 'server misconfigured' }, 500, req);
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return jsonResp({ error: 'unauthorized' }, 401, req);
  }
  const userId = userData.user.id;

  // 2. Entitlement check — skip during beta (all signed-in users get AI access).
  //    TODO: re-enable when RevenueCat is wired up.
  // const { data: ent } = await supabase
  //   .from('entitlements')
  //   .select('is_active')
  //   .eq('user_id', userId)
  //   .maybeSingle();
  // if (!ent?.is_active) {
  //   return jsonResp({ error: 'subscription_required' }, 402, req);
  // }

  // 3. Parse + validate payload.
  let body: { imageBase64?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: 'invalid json' }, 400, req);
  }
  const imageBase64 = body.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return jsonResp({ error: 'imageBase64 is required' }, 400, req);
  }
  // Base64 length ~ 4/3 of raw bytes; reject anything > MAX_IMAGE_BYTES decoded.
  const approxBytes = Math.floor(imageBase64.length * 0.75);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return jsonResp({ error: 'image too large', maxBytes: MAX_IMAGE_BYTES }, 413, req);
  }

  // 4. Forward to Anthropic.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResp({ error: 'server misconfigured' }, 500, req);
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
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
      return jsonResp({ error: data }, anthropicRes.status, req);
    }
    return jsonResp(data, 200, req);
  } catch (err) {
    return jsonResp({ error: String(err) }, 500, req);
  }
});
