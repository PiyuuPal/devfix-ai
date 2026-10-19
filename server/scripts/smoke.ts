/**
 * End-to-end check against a running server with a real API key.
 *   npm run dev            # terminal 1
 *   npm run smoke          # terminal 2  (SERVER_URL defaults to http://localhost:3000)
 * Each case costs a few cents. Full responses are written to scripts/smoke-results.json.
 */
import { writeFileSync } from 'node:fs';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

interface Case {
  name: string;
  body: Record<string, unknown>;
  /** Words the root cause or fix should mention if the diagnosis is right. */
  expect: RegExp;
  expectConfidence?: ('high' | 'medium' | 'low')[];
}

const cases: Case[] = [
  {
    name: 'Metro: unresolved module',
    body: {
      tech: 'expo',
      language: 'typescript',
      errorText: `Android Bundling failed 1203ms node_modules/expo-router/entry.js (1102 modules)
Unable to resolve "expo-camera" from "src/app/scan.tsx"
  1 | import { useState } from 'react';
> 2 | import { CameraView, useCameraPermissions } from 'expo-camera';
    |                                                   ^`,
    },
    expect: /expo install|install/i,
    expectConfidence: ['high'],
  },
  {
    name: 'Native module missing from dev build',
    body: {
      tech: 'expo',
      language: 'auto',
      context: 'Just installed expo-camera with npx expo install and reloaded the app.',
      errorText: `ERROR  Error: Cannot find native module 'ExpoCamera', js engine: hermes
    at requireNativeModule (node_modules/expo-modules-core/src/requireNativeModule.ts:28:11)
    at anonymous (node_modules/expo-camera/build/ExpoCamera.js:2:1)`,
    },
    expect: /rebuild|development build|run:android|run:ios|eas build/i,
    expectConfidence: ['high', 'medium'],
  },
  {
    name: 'Gradle: JDK version',
    body: {
      tech: 'android',
      language: 'kotlin',
      errorText: `FAILURE: Build failed with an exception.
* What went wrong:
A problem occurred configuring project ':app'.
> Could not resolve all files for configuration ':app:classpath'.
   > Dependency requires at least JVM runtime version 17. This build uses a Java 11 JVM.`,
    },
    expect: /jdk|java 17|jvm|JAVA_HOME/i,
    expectConfidence: ['high'],
  },
  {
    name: 'React: text outside <Text> (Hinglish)',
    body: {
      tech: 'react-native',
      language: 'typescript',
      explanationLanguage: 'hinglish',
      errorText: `ERROR  Error: Text strings must be rendered within a <Text> component.
This error is located at:
    at RCTView
    at View
    at CartBadge (src/components/CartBadge.tsx:12:5)
    at Header (src/components/Header.tsx:30:9)`,
      context: 'CartBadge renders {count && <Text>{count}</Text>}',
    },
    expect: /Text|count|&&|ternary|\?/i,
    expectConfidence: ['high'],
  },
  {
    name: 'TypeError with stack',
    body: {
      tech: 'react-native',
      language: 'typescript',
      errorText: `TypeError: Cannot read property 'map' of undefined
    at ProductList (src/screens/ProductList.tsx:24:22)
    at renderWithHooks (node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:7023:18)`,
      context: 'products comes from a fetch() in useEffect, initial state is useState()',
    },
    expect: /undefined|initial|\[\]|optional|\?\./i,
    expectConfidence: ['high', 'medium'],
  },
  {
    name: 'iOS: CocoaPods',
    body: {
      tech: 'ios',
      language: 'auto',
      errorText: `[!] CocoaPods could not find compatible versions for pod "ExpoModulesCore":
  In Podfile:
    ExpoModulesCore (from \`../node_modules/expo-modules-core\`)
Specs satisfying the \`ExpoModulesCore\` dependency were found, but they required a higher minimum deployment target.`,
    },
    expect: /deployment target|ios\.deploymentTarget|expo-build-properties|prebuild/i,
    expectConfidence: ['high', 'medium'],
  },
  {
    name: 'Vague input (should be low confidence)',
    body: { tech: 'react-native', language: 'auto', errorText: 'app is crashing on startup sometimes, no logs' },
    expect: /log|adb logcat|crash|reproduce/i,
    expectConfidence: ['low', 'medium'],
  },
];

const results: unknown[] = [];
let passed = 0;

for (const c of cases) {
  const started = Date.now();
  process.stdout.write(`• ${c.name} … `);
  try {
    const res = await fetch(`${SERVER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c.body),
    });
    const data = await res.json();
    const ms = Date.now() - started;
    if (!res.ok) {
      console.log(`❌ HTTP ${res.status}: ${data.error}`);
      results.push({ case: c.name, ms, status: res.status, data });
      continue;
    }
    const haystack = [data.rootCause, data.explanation, ...data.solution.flatMap((s: Record<string, string>) => [s.title, s.description, s.command])].join(' ');
    const diagnosisOk = c.expect.test(haystack);
    const confidenceOk = !c.expectConfidence || c.expectConfidence.includes(data.confidence);
    const ok = diagnosisOk && confidenceOk && data.solution.length > 0;
    if (ok) passed++;
    console.log(
      `${ok ? '✅' : '⚠️'} ${(ms / 1000).toFixed(1)}s · ${data.confidence} · ${data.solution.length} steps` +
        (diagnosisOk ? '' : ' · diagnosis missed expected keywords') +
        (confidenceOk ? '' : ` · unexpected confidence`),
    );
    console.log(`    → ${data.title}`);
    results.push({ case: c.name, ms, ok, data });
  } catch (e) {
    console.log(`❌ ${(e as Error).message} (is the server running at ${SERVER_URL}?)`);
    results.push({ case: c.name, error: (e as Error).message });
  }
}

const out = new URL('./smoke-results.json', import.meta.url);
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`\n${passed}/${cases.length} passed. Full responses: ${out.pathname}`);
process.exit(passed === cases.length ? 0 : 1);
