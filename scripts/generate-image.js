/**
 * generate-image.js
 * Usage: node scripts/generate-image.js "your prompt here" output-filename.png
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually — no dotenv dependency needed
const envPath = path.join(__dirname, '../.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) envVars[k.trim()] = v.join('=').trim();
  });
}

const API_KEY = envVars.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const prompt  = process.argv[2];
const outName = process.argv[3] || 'generated.png';

if (!API_KEY || API_KEY === 'PASTE_NEW_KEY_HERE') {
  console.error('❌  No API key. Add GOOGLE_AI_API_KEY to .env');
  process.exit(1);
}
if (!prompt) {
  console.error('❌  Usage: node scripts/generate-image.js "prompt" filename.png');
  process.exit(1);
}

const body = JSON.stringify({
  instances: [{ prompt }],
  parameters: { sampleCount: 1, aspectRatio: '1:1' },
});

// API key goes in a header — never the querystring (querystring keys leak via
// server access logs, proxies, and HTTP Referer headers).
const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages';

console.log(`⏳  Generating: "${prompt}"\n`);

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type':   'application/json',
    'x-goog-api-key': API_KEY,
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (json.error) {
        console.error('❌  API error:', json.error.message);
        process.exit(1);
      }

      // Imagen returns predictions[].bytesBase64Encoded
      const b64 = json.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) {
        console.error('❌  No image in response:\n', JSON.stringify(json, null, 2));
        process.exit(1);
      }

      const outDir  = path.join(__dirname, '../assets/generated');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      console.log(`✅  Saved to: assets/generated/${outName}`);
    } catch (e) {
      console.error('❌  Parse error:', e.message);
      console.error('Raw response:\n', data.slice(0, 800));
    }
  });
});

req.on('error', e => console.error('❌  Request error:', e.message));
req.write(body);
req.end();
