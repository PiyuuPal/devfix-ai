# devfix-server

The backend for [`devfix-react-native`](https://www.npmjs.com/package/devfix-react-native) and the DevFix AI app. It takes an error log and returns a structured diagnosis: root cause, explanation, evidence, ordered fix steps with commands, and how to verify the fix.

It works with Anthropic (Claude), OpenAI or OpenRouter, using your own API key. The key stays on the machine running the server. It never goes into an app.

## Run it

Requires Node.js 22.9+.

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # in the folder you start it from
npx devfix-server                             # http://localhost:3000
```

The server reads `.env` from the current folder. You can also export the variables in your shell.

## Configuration

Set **one** key. If several are set, the first one found in this order wins:

| Provider | Variable | Default model |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | `claude-opus-5-5` |
| OpenRouter | `OPENROUTER_API_KEY` | `openai/gpt-6.1-sol` |
| OpenAI | `OPENAI_API_KEY` | `gpt-6.1-sol` |

| Variable | Default | |
|---|---|---|
| `AI_PROVIDER` | (first key found) | `anthropic`, `openrouter` or `openai` |
| `AI_MODEL` | provider default | Any model id the provider accepts |
| `PORT` | `3000` | |
| `RATE_LIMIT` | `20` | Max `/analyze` requests per IP per 10 minutes |

## API

### `POST /analyze`

```bash
curl -X POST localhost:3000/analyze -H 'Content-Type: application/json' \
  -d '{"tech":"expo","errorText":"Unable to resolve module expo-camera","language":"auto"}'
```

| Field | Type | |
|---|---|---|
| `tech` | `react-native` \| `expo` \| `android` \| `ios` \| `backend` | Required |
| `errorText` | string, 10–10,000 chars | Required |
| `context` | string, up to 2,000 chars | Optional |
| `language` | `auto` \| `typescript` \| `javascript` \| `kotlin` \| `java` \| `swift` \| `objective-c` \| `python` \| `go` \| `other` | Required |
| `explanationLanguage` | `english` \| `hinglish` | Default `english` |

Returns:

```json
{
  "title": "…",
  "rootCause": "…",
  "explanation": "…",
  "evidence": "…",
  "solution": [{ "title": "…", "description": "…", "command": "…" }],
  "verification": ["…"],
  "confidence": "high",
  "additionalInfo": "…"
}
```

Errors come back as `{ "error": "message" }`: `400` for an invalid body, `422` when the model refuses the input, `429` when rate limited (with `Retry-After`), and `5xx` for provider failures.

### `GET /health`

Returns `{ "ok": true }`.

## Security

- The error log is treated as untrusted data in the prompt.
- Bodies are capped at 64 KB, and requests are rate limited per IP. The limiter is in memory, so use a shared store if you run more than one instance.
- If the client disconnects, the AI call is cancelled, so you aren't billed for an answer nobody reads.
- There is no authentication. That's fine on your own machine. If you host it publicly, add auth in front of it, because anyone with the URL can spend your API credit up to the rate limit.

## Deploy

On Render, Railway or Fly.io: build with `npm install && npm run build`, start with `npm start`, and set your key as an environment variable.
