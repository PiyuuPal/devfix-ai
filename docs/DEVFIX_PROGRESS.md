# DevFix AI — Implementation Log

Running log of what was built, why, and how to test it. Update this file with every change.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19.2 · Expo Router (typed routes) · TypeScript strict · React Compiler

---

## Folder structure

```
src/
├── app/                          # Expo Router routes ONLY
│   ├── _layout.tsx               # Root Stack, providers, dark nav theme, splash gating
│   ├── index.tsx                 # Welcome screen (shown once, then redirects to /home)
│   ├── analyzing.tsx             # Loading state + error state (retry / edit)
│   ├── result/[id].tsx           # Analysis Result
│   └── (tabs)/
│       ├── _layout.tsx           # Bottom tabs: Home / History / Settings
│       ├── home.tsx              # Input form
│       ├── history.tsx           # Saved analyses + search
│       └── settings.tsx          # Theme, history, app info
├── components/
│   ├── ui/                       # Reusable design-system components (barrel: index.ts)
│   │   AppText, Badge, Card, CodeBlock, CopyButton, GradientButton, Icon,
│   │   IconButton, Screen, ScreenHeader, SearchBar, SectionCard, Select/SelectSheet,
│   │   StateView, TextArea
│   ├── home/TechSelector.tsx
│   ├── analysis/AnalyzingIndicator.tsx, SolutionSteps.tsx
│   ├── history/HistoryItem.tsx
│   └── settings/SettingsRow.tsx  # SettingsRow + SettingsGroup
├── constants/options.ts          # Tech, language, theme option lists + labels
├── context/AppProvider.tsx       # Settings, history, pending request (persisted)
├── hooks/useCopy.ts              # Clipboard + "Copied" feedback
├── services/
│   ├── analysisService.ts        # Single entry point: mock OR your backend
│   ├── mockAnalyses.ts           # Offline knowledge base + sample errors
│   ├── persistence.ts            # Load/save history & settings (JSON)
│   ├── storage.ts                # Native: expo-sqlite/kv-store
│   └── storage.web.ts            # Web: localStorage
├── theme/                        # colors.ts (palettes), tokens.ts, index.ts (useColors, makeStyles)
├── types/                        # analysis.ts, settings.ts
└── utils/                        # validation.ts, format.ts, confirm.ts
```

Rules followed: every file in `src/app/` is a screen; everything else lives outside it.

---

## Log

### Step 0 — Setup
- Confirmed Expo SDK 57; checked the SDK 57 docs for `expo-symbols`, `expo-sqlite`, `expo-clipboard` and `expo-linear-gradient`.
- Installed with `npx expo install expo-linear-gradient expo-clipboard expo-sqlite` (adds the `expo-sqlite` config plugin to `app.json`).
- Removed the unused starter-template files (explore tab, themed-text/view, animated-icon, app-tabs, etc.). They're still in git history.

### Step 1 — Foundation (types, theme, services)
- **Types** (`src/types`): `TechType`, `CodeLanguage`, `Confidence`, `AnalysisRequest`, `AnalysisResult`, `SolutionStep`, `HistoryEntry`, `AppSettings`.
  `AnalysisResult` matches the JSON format from the AI prompt: title, rootCause, explanation, evidence, solution, verification, confidence, additionalInfo.
- **Theme**: two dark palettes, **Dark** (navy) and **Midnight** (pure black for OLED). Both use a blue→purple gradient `#4F6BFF → #8B5CF6`.
  `makeStyles((colors) => StyleSheet.create(...))` gives each component theme-aware, memoized styles.
- **Mock analyzer** (`mockAnalyses.ts`): 11 regex rules, including Metro unresolved module, missing native module, Gradle, INSTALL_FAILED_VERSION_DOWNGRADE, ANDROID_HOME, CocoaPods/Xcode, TypeScript, network request failed, text outside `<Text>`, EADDRINUSE/ECONNREFUSED, and "cannot read properties of undefined".
  If no rule matches, it returns generic per-platform steps with `confidence: low`. Evidence is pulled from the first error-like lines of the input.
- **analysisService.ts**: uses the mock when `EXPO_PUBLIC_ANALYSIS_API_URL` is unset. Otherwise it POSTs to `<url>/analyze`, with a 30s timeout, cancellation, and validation of the response (`parseResult`).
- **Persistence**: history (max 50) and settings are stored as JSON, using SQLite KV on native and localStorage on web.

### Step 2 — Reusable UI components
- `Icon`: semantic names mapped to SF Symbols on iOS and Material Symbols on Android and web.
- `GradientButton` (primary gradient / secondary outline, loading and disabled states), `Card`, `SectionCard`, `Badge`, `CodeBlock` (horizontal scroll, selectable, copy), `CopyButton`, `TextArea` (label, optional tag, counter, inline error), `Select` + `SelectSheet` (bottom-sheet radio list), `SearchBar`, `StateView` (empty, error and not-found), `Screen` (safe area, keyboard avoiding, 720px max width), `ScreenHeader`.

### Step 3 — Navigation
- Root `Stack` (no native headers; custom `ScreenHeader`) → `(tabs)` with Home / History / Settings.
- The splash screen stays visible until persisted settings and history have loaded, so there's no flash of default state.
- `app.json`: name `DevFix AI`, `userInterfaceStyle: dark`, splash/background `#0B1020`.

### Step 4 — Home
- Tech selector (React Native, Expo, Android, iOS, Backend), a monospace error input with tech-specific placeholder examples, optional context, a code-language picker, and **Explain Error**.
- Validation: the error text is required, needs at least 10 characters, and is capped at 10,000. Context is capped at 2,000. Errors show inline, are announced to screen readers, and re-validate live only after the first submit.
- "Try a sample" chips fill in demo errors.
- A "Demo mode" badge shows while the mock analyzer is active.

### Step 5 — Analyzing (loading + error)
- Rotating gradient arc (Reanimated). It stays static when the system's Reduce Motion setting is on.
- **Cancel** aborts the request. On failure, the error state offers **Try Again** and **Edit Error**.
- On success, the analysis is saved to history and the screen replaces itself with `/result/[id]`.

### Step 6 — Analysis Result
- Badges for tech, confidence (green/amber/red) and language; then the title and time.
- Sections: Root Cause, Explanation, Evidence, Solution (numbered steps with copyable commands), All Commands, Verify the Fix, Additional Info, Your Input.
- **Copy All** copies a Markdown report; **Copy Fix** copies the numbered steps. A not-found state appears for deleted or invalid ids.

### Step 7 — History & Settings
- History: searches across title, error text, root cause and tech, with a deferred value so typing stays smooth. Long-press deletes after a confirm. There are two empty states: no history yet, and no search matches.
- Settings: Theme (Dark/Midnight), Clear History (with confirm), analysis engine info, app version, and a secure-key info card.

### Step 8 — Verification
- `npx tsc --noEmit` passes.
- `npx expo lint` passes. ESLint was not configured before; `expo lint` added `eslint.config.js`, `eslint` and `eslint-config-expo`.
- `npx expo export --platform ios --platform web` bundles successfully.
- The mock analyzer was smoke-tested against every sample, and each one maps to the expected rule.

### Step 9 — Backend (`server/`)
- A separate Node + TypeScript project in `server/` (Express 5, `@anthropic-ai/sdk`, zod). It's excluded from the app's `tsconfig.json` and ESLint.
- `POST /analyze` validates the body with zod (same limits as the app), calls Claude (`claude-opus-5-5`, effort `medium`) with **structured outputs**, and returns `AnalysisResult` JSON. `GET /health` is a liveness check.
- Hinglish: when `explanationLanguage` is `hinglish`, the prompt asks for prose fields in Roman-script Hinglish and keeps commands and log lines in English.
- Safety: the API key lives only in `server/.env`. There's a per-IP rate limit (default 20 requests per 10 minutes), a 64 KB body limit, and the error log is treated as untrusted data in the prompt. Server-side refusal fallback (`fallbacks: "default"`) is enabled.
- If the app cancels, the server aborts the Claude call so it isn't billed for an answer nobody reads.
- App changes: the request timeout went from 30s to 60s (the server gives up at 50s), and the app now shows the server's `error` message. 429 is retryable.

### Step 10 — Dev package `devfix-react-native` (`packages/devfix-react-native/`)
- An npm-ready RN/Expo package. Other developers wrap their app in `<DevFix>`. In `__DEV__` it captures errors and shows a floating 🩺 button that opens an "Explain with AI" panel. In production it only renders children.
- Captures uncaught JS errors via `ErrorUtils` (then forwards them to the previous handler, so LogBox still works), render crashes (a built-in error boundary with Explain / Try again), `console.error` (optional), and `reportError(e)` for manual reports. Duplicate reports within 5s are merged.
- BYOK: it calls `devfix-server` on the developer's own machine. The URL is auto-derived from Metro's host (`expo-constants` `expoConfig.hostUri`, an optional peer) on port 3000, or set with `serverUrl`.
- No native code and no extra dependencies, just RN core components. Store notifications are deferred one tick, so `console.error` during render can't loop.
- The server is now publishable as **`devfix-server`** (an `npx` bin). It loads `.env` from the current folder via `process.loadEnvFile()`, and the Anthropic client is created lazily so the key from `.env` is picked up.
- This app uses the package itself (dev only) through a tsconfig path alias, `devfix-react-native` → `packages/devfix-react-native/src`, wired in `src/app/_layout.tsx`.
- Verified: package `tsc` build, app `tsc`, ESLint, and Metro dev and prod Android bundles.

### Step 11 — Multiple AI providers + end-to-end test (2026-10-15)
- The server supports **Anthropic** (`ANTHROPIC_API_KEY`, default `claude-opus-5-5`), **OpenRouter** (`OPENROUTER_API_KEY`, default `openai/gpt-6.1-sol`) and **OpenAI** (`OPENAI_API_KEY`, default `gpt-6.1-sol`). Override with `AI_PROVIDER` / `AI_MODEL`. Code lives in `server/src/providers/`, and both providers validate output against the same zod schema.
- The server logs tokens and an estimated cost per call, and logs the provider's real error reason (the app gets a friendly message).
- `npm run smoke` (`server/scripts/smoke.ts`) runs 7 real-world cases against a running server.
- **Results via OpenRouter → `openai/gpt-6.1-sol`:**
  - Smoke test 7/7: correct diagnosis, runnable commands, natural Hinglish, and `low` confidence on vague input. Each case took 15–32s and cost about $0.005–0.011.
  - App flow on the Android emulator (Home → Explain → Result) worked.
  - The `devfix-react-native` render-crash flow on the emulator (LogBox → DevFix screen → 🩺 → Explain with AI) worked and gave the correct diagnosis.
- Fixes found during the test:
  - Stack traces are now stripped of Metro bundle URLs and capped at 15 frames, cutting input tokens from 3,399 to 818 for the same crash.
  - A deduplicated error now keeps its most informative source (error boundary over console), so the panel shows "boundary · fatal".

### Step 12 — npm publish readiness (2026-10-19)
- Both packages are now publishable at **v0.1.0**: `"private": true` removed, MIT `LICENSE` added, and `prepublishOnly` runs typecheck → tests → build. Both names were free on npm when checked.
- `devfix-server` has its own README (providers, config, API, security) for its npm page. The SDK README now has a quick start and lists all three providers, not just Anthropic.
- `cleanStack` moved from `client.ts` to `stack.ts` so it can be tested without React Native.
- **Unit tests** (`node:test`, no new dependencies), run with `npm test` in each package:
  - SDK (10): stack cleaning and frame cap, store add/dedupe/source upgrade, the 20-error cap, deferred notifications, and panel state. Uses Node's `--experimental-strip-types` (Node 22.6+).
  - Server (10): request and result schema limits, and provider/model resolution from env vars. Uses `tsx`.
- Root `.gitignore` now ignores `.env`. Root `tsconfig.json` excludes `packages/*/test` and `packages/*/lib`.
- **Verified from tarballs** (`npm pack`), not the repo:
  - `devfix-server` installed in an empty folder and run through its bin: it loads `.env`, `/health` returns ok, an invalid body returns 400, and a bad key returns a clean 500.
  - `devfix-react-native` installed in a fresh `create-expo-app` (Expo SDK 58, RN 0.88): `tsc` passes, and Android dev and release bundles build. Metro resolves `src/` via the `react-native` field.
- Still to do before `npm publish`: add `repository`/`homepage`/`author` once the GitHub repo exists, and set the copyright holder in both `LICENSE` files.
- Known: the release bundle still contains the inactive panel code (about 10 KB), because `<DevFix>` decides at runtime.

### Publishing (manual)
```bash
npm login
cd server && npm publish                                      # prepublishOnly: typecheck + test + build
cd ../packages/devfix-react-native && npm publish --access public
```

---

## How to run

```bash
npx expo start            # dev server
npx expo run:ios          # rebuild native app (needed: new native modules were added)
npx expo run:android
```

> New native modules were added (expo-sqlite, expo-clipboard, expo-linear-gradient), so **existing dev builds must be rebuilt**.

## Troubleshooting

### `:react-native-worklets:buildCMakeDebug[arm64-v8a]` FAILED — `libreactnative.so ... missing`
**Cause:** the disk filled up during an earlier build and left a half-extracted entry in Gradle's transforms cache, which Gradle kept reusing.
**Fix (2026-10-15):**
```bash
cd android && ./gradlew --stop
rm -rf ~/.gradle/caches/*/transforms
rm -rf ../node_modules/react-native-worklets/android/.cxx ../node_modules/react-native-screens/android/.cxx app/.cxx
cd .. && npx expo run:android
```
Keep at least 10–15 GB free for Android builds, and set `ANDROID_HOME=$HOME/Library/Android/sdk` in `~/.zshrc`.

## Manual test checklist

| Scenario | How |
|---|---|
| Validation | Tap **Explain Error** with an empty input, or under 10 characters |
| Loading / cancel | Submit anything, then tap **Cancel** during analysis |
| Error state | Include `#simulate-error` in the error text |
| Low-confidence fallback | Paste text that matches no rule |
| Empty history | Fresh install, or Settings → Clear History |
| Search, no matches | Search for nonsense in History |
| Theme | Settings → Theme → Midnight |
| Accessibility | Enable VoiceOver / TalkBack and large text |

## Backend — run & deploy

```bash
cd server
npm install
cp .env.example .env        # add ONE key: ANTHROPIC_API_KEY, OPENROUTER_API_KEY or OPENAI_API_KEY
npm run dev                 # http://localhost:3000, auto-reloads
```

Point the app at it in the project-root `.env`, then restart Metro with `npx expo start --clear`:

| Where the app runs | `EXPO_PUBLIC_ANALYSIS_API_URL` |
|---|---|
| iOS simulator / web | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical phone (same Wi-Fi) | `http://<your-mac-LAN-IP>:3000` |
| Production | `https://<your-deployed-server>` (HTTPS required for release builds) |

Test without the app:
```bash
curl -X POST localhost:3000/analyze -H 'Content-Type: application/json' \
  -d '{"tech":"expo","errorText":"Unable to resolve module expo-camera","language":"auto","explanationLanguage":"hinglish"}'
```

Deploy (Render, Railway, Fly.io etc.): root directory `server`, build `npm install && npm run build`, start `npm start`, and set the `ANTHROPIC_API_KEY` env var in the dashboard.

## Security — no secrets in the app

- The app never calls an AI provider directly and has no API key. Only `server/` holds `ANTHROPIC_API_KEY`, and `server/.env` is git-ignored.
- `EXPO_PUBLIC_*` values are bundled into the app, so put only the **public URL** there, never a key.
- The URL is public once shipped. The rate limiter is the cost guard; add auth (e.g. user login tokens) before a wide launch.

## Publishing the dev package (when ready)

Both `package.json` files have `"private": true` to prevent accidental publishing. When you're ready:
```bash
cd server && npm run build && npm publish                      # remove "private" first
cd packages/devfix-react-native && npm run build && npm publish
```
Both names (`devfix-server`, `devfix-react-native`) were free on npm as of 2026-10-15.

## Next steps / ideas
- Deploy `server/` and set the production URL in EAS env vars.
- Stream the answer so text appears progressively instead of after the full wait.
- Shared rate-limit store (Redis) if the server runs more than one instance.
- Swipe-to-delete in History; share a result.
- Unit tests for `validation.ts`, `format.ts` and `mockAnalyses.ts`.
