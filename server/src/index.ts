#!/usr/bin/env node
import express, { type NextFunction, type Request, type Response } from 'express';

import { analyze, HttpError, KEY_VARS, resolveProvider } from './analyze.js';
import { AnalyzeRequestSchema } from './schema.js';

// Load .env from the directory it's started in (works for `npm run dev` and `npx devfix-server`).
try {
  process.loadEnvFile();
} catch {
  // no .env file; rely on the real environment
}

const { provider, model } = resolveProvider();
if (!process.env[KEY_VARS[provider]]) {
  console.warn(`⚠️  ${KEY_VARS[provider]} is not set. Add it to a .env file here or export it in your shell.`);
}

const PORT = Number(process.env.PORT) || 3000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT) || 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Railway/Fly proxies
app.use(express.json({ limit: '64kb' }));

// Native apps don't need CORS; this lets the Expo web build call the API too.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return void res.sendStatus(204);
  next();
});

// Minimal in-memory per-IP limiter so a leaked URL can't run up the AI bill.
// Use a shared store (Redis) if you run more than one instance.
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip ?? 'unknown';
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }
  if (++entry.count > RATE_LIMIT) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return void res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
}, RATE_WINDOW_MS).unref();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/analyze', rateLimit, async (req, res) => {
  const parsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
  }

  // Stop paying for the AI call if the user taps Cancel in the app.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  const started = Date.now();
  try {
    const result = await analyze(parsed.data, abort.signal);
    console.log(`analyze ok tech=${parsed.data.tech} confidence=${result.confidence} ${Date.now() - started}ms`);
    res.json(result);
  } catch (e) {
    if (abort.signal.aborted) return;
    if (e instanceof HttpError) {
      console.warn(`analyze failed ${e.status}: ${e.message}`);
      return void res.status(e.status).json({ error: e.message });
    }
    console.error('analyze crashed', e);
    res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`DevFix AI server listening on http://localhost:${PORT} (provider=${provider}, model=${model})`);
});
