# devfix-react-native

Dev-only "Explain with AI" for React Native and Expo runtime errors.

When your app throws in development, a 🩺 button appears. Tap it to see the error, then **Explain with AI** to get the root cause, a step-by-step fix with commands, and how to verify it.

- Works only in `__DEV__`. In release builds `<DevFix>` just renders its children.
- No native code, so it works in Expo Go and dev builds.
- Bring your own key: the AI call goes to [`devfix-server`](https://www.npmjs.com/package/devfix-server) running on **your** machine with **your** API key (Anthropic, OpenAI or OpenRouter). No key is ever inside the app.

## Quick start

```bash
# 1. In any folder on your computer: add a key and start the server
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npx devfix-server

# 2. In your app
npx expo install devfix-react-native
```

```tsx
// 3. Wrap your root layout
<DevFix>
  <Stack />
</DevFix>
```

Throw an error and tap 🩺. The sections below cover each step in detail.

Requires React 19+ and React Native 0.79+. The server needs Node.js 22.9+.

## 1. Start the server (on your computer)

```bash
# in any folder, with your key in the environment or a .env file there
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npx devfix-server        # listens on :3000
```

Any one of these keys works. If several are set, the first one found wins, in this order:

| Provider | Variable | Default model |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | `claude-opus-5-5` |
| OpenRouter | `OPENROUTER_API_KEY` | `openai/gpt-6.1-sol` |
| OpenAI | `OPENAI_API_KEY` | `gpt-6.1-sol` |

Set `AI_PROVIDER` to force a provider and `AI_MODEL` to change the model. See the [devfix-server README](https://www.npmjs.com/package/devfix-server) for every option.

## 2. Add the package to your app

```bash
npx expo install devfix-react-native
```

```tsx
// app/_layout.tsx (Expo Router) or App.tsx
import { DevFix } from 'devfix-react-native';

export default function RootLayout() {
  return (
    <DevFix>
      <Stack />
    </DevFix>
  );
}
```

That's it. Throw an error and tap 🩺.

## How the server is found

In Expo projects, DevFix uses the same host as Metro (`expoConfig.hostUri`) with port 3000. A phone on the same Wi‑Fi works with no config.

| Setup | What to do |
|---|---|
| Expo, LAN (default) | Nothing |
| `expo start --tunnel` | Pass `serverUrl` (e.g. an ngrok URL for port 3000) |
| `expo start --localhost` on Android | `adb reverse tcp:3000 tcp:3000` |
| Bare React Native | Pass `serverUrl`, e.g. `http://192.168.1.5:3000` |

## Props

| Prop | Default | |
|---|---|---|
| `serverUrl` | Metro host + `serverPort` | Full URL of devfix-server |
| `serverPort` | `3000` | |
| `tech` | `'expo'` | `'react-native' \| 'expo' \| 'android' \| 'ios' \| 'backend'` |
| `language` | `'english'` | `'english' \| 'hinglish'` |
| `captureConsoleErrors` | `true` | Also capture `console.error` (React warnings, failed requests you log) |
| `enabled` | `__DEV__` | |

## What gets captured

- Uncaught JS errors (global handler). LogBox still shows as usual.
- Render crashes. `<DevFix>` includes an error boundary with **Explain with AI** and **Try again**.
- `console.error` calls (optional).
- Anything you report yourself:

```ts
import { reportError } from 'devfix-react-native';

try { await riskyThing(); } catch (e) { reportError(e); }
```

To protect a single screen, wrap it in `<DevFixErrorBoundary>`.

## Privacy

The error message, stack trace, component stack, platform and React Native version are sent to the devfix-server URL you configure, and from there to the AI provider you configured. Source files are not sent.
