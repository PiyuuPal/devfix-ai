import type { AnalysisRequest, AnalysisResult, TechType } from '@/types/analysis';

/**
 * Offline knowledge base used while no backend is configured.
 * Each rule matches common error signatures and builds a structured result.
 */

interface RuleContext {
  request: AnalysisRequest;
  match: RegExpMatchArray;
  evidence: string;
}

interface MockRule {
  id: string;
  pattern: RegExp;
  build: (ctx: RuleContext) => AnalysisResult;
}

const ERROR_LINE = /(error|exception|failed|fatal|cannot|unable|invariant|refused|not found|denied)/i;

/** Picks the most relevant lines from the pasted log to show as evidence. */
export function extractEvidence(errorText: string, maxLines = 3): string {
  const lines = errorText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  const firstHit = lines.findIndex((l) => ERROR_LINE.test(l));
  const start = firstHit === -1 ? 0 : firstHit;
  return lines.slice(start, start + maxLines).join('\n');
}

const RULES: MockRule[] = [
  {
    id: 'metro-unresolved-module',
    pattern: /unable to resolve module ['"`]?([@\w./-]+)['"`]?/i,
    build: ({ match, evidence }) => {
      const pkg = match[1];
      const isRelative = pkg.startsWith('.');
      return {
        title: `Unable to resolve module '${pkg}'`,
        rootCause: isRelative
          ? `Metro cannot find the file '${pkg}'. The import path is wrong, the file was renamed/moved, or its extension is not one Metro resolves.`
          : `The package '${pkg}' is not installed in node_modules, or Metro's cache still points to an old dependency graph.`,
        explanation:
          'Metro builds a dependency graph starting from your entry file. When an import cannot be mapped to a file on disk, bundling stops with this error.',
        evidence,
        solution: isRelative
          ? [
              { title: 'Check the import path and filename casing (macOS is case-insensitive, CI is not).' },
              { title: 'If you use path aliases, confirm they exist in tsconfig.json "paths".' },
              { title: 'Restart Metro with a clean cache', command: 'npx expo start --clear' },
            ]
          : [
              {
                title: 'Install the package with SDK-compatible versions',
                command: `npx expo install ${pkg}`,
              },
              { title: 'If it contains native code, rebuild the app', command: 'npx expo run:ios   # or run:android' },
              { title: 'Restart Metro with a clean cache', command: 'npx expo start --clear' },
            ],
        verification: [
          'Metro finishes bundling without the red error screen.',
          `The screen that imports '${pkg}' renders correctly.`,
        ],
        confidence: 'high',
        additionalInfo: isRelative
          ? undefined
          : 'Expo Go only bundles certain native modules. Libraries with custom native code need a development build.',
      };
    },
  },
  {
    id: 'expo-native-module-missing',
    pattern: /(?:cannot find native module|native module cannot be null)(?:\s*['"`](\w+)['"`])?/i,
    build: ({ match, evidence }) => ({
      title: `Native module ${match[1] ? `'${match[1]}' ` : ''}is missing from the binary`,
      rootCause:
        'The JavaScript code calls a native module that is not compiled into the app you are running — usually because you are in Expo Go, or the dev build was made before the library was installed.',
      explanation:
        'Installing a library with native code changes the native project. The JS bundle updates instantly, but the native binary only changes after a rebuild.',
      evidence,
      solution: [
        { title: 'Verify the package version matches your SDK', command: 'npx expo install --check' },
        { title: 'Create a fresh development build', command: 'npx expo run:android   # or run:ios' },
        { title: 'Or build in the cloud', command: 'npx eas-cli@latest build --profile development' },
      ],
      verification: ['The app launches without the native module error.', 'The feature using the module works.'],
      confidence: 'high',
      additionalInfo: 'Never edit ios/ or android/ by hand when using Continuous Native Generation — use config plugins.',
    }),
  },
  {
    id: 'android-version-downgrade',
    pattern: /INSTALL_FAILED_VERSION_DOWNGRADE/i,
    build: ({ evidence }) => ({
      title: 'Android installation failed: version downgrade',
      rootCause:
        'The device already has the app installed with a higher versionCode than the build you are trying to install.',
      explanation: 'Android refuses to install an older versionCode over a newer one to protect user data.',
      evidence,
      solution: [
        { title: 'Uninstall the existing app', command: 'adb uninstall <your.package.name>' },
        { title: 'Install and run again', command: 'npx expo run:android' },
      ],
      verification: ['The build installs and launches on the device.'],
      confidence: 'high',
    }),
  },
  {
    id: 'android-sdk-location',
    pattern: /SDK location not found|ANDROID_HOME|ANDROID_SDK_ROOT/i,
    build: ({ evidence }) => ({
      title: 'Android SDK location not found',
      rootCause: 'Gradle cannot locate the Android SDK because ANDROID_HOME is not set.',
      explanation: 'Gradle reads the SDK path from the ANDROID_HOME environment variable or android/local.properties.',
      evidence,
      solution: [
        {
          title: 'Export ANDROID_HOME in your shell profile (~/.zshrc)',
          command: 'export ANDROID_HOME=$HOME/Library/Android/sdk\nexport PATH=$PATH:$ANDROID_HOME/platform-tools',
        },
        { title: 'Reload the shell and rebuild', command: 'source ~/.zshrc && npx expo run:android' },
      ],
      verification: ['echo $ANDROID_HOME prints the SDK path.', 'Gradle build completes.'],
      confidence: 'high',
    }),
  },
  {
    id: 'gradle-build-failed',
    pattern: /(execution failed for task|could not find method|gradle build failed|BUILD FAILED)/i,
    build: ({ evidence }) => ({
      title: 'Gradle build failed',
      rootCause:
        'A Gradle task failed — most often due to a dependency version mismatch, a stale Gradle cache, or an incompatible JDK.',
      explanation:
        'Gradle compiles native Android code for every library. One incompatible library or JDK version is enough to fail the whole build.',
      evidence,
      solution: [
        { title: 'Check that dependencies match the Expo SDK', command: 'npx expo install --fix' },
        { title: 'Use JDK 17 (required by current React Native)', command: 'java -version' },
        { title: 'Regenerate the native project', command: 'npx expo prebuild --clean --platform android' },
        { title: 'Rebuild', command: 'npx expo run:android' },
      ],
      verification: ['BUILD SUCCESSFUL is printed.', 'The app installs on the emulator/device.'],
      confidence: 'medium',
      additionalInfo: 'Run with --stacktrace (cd android && ./gradlew assembleDebug --stacktrace) to see the failing library.',
    }),
  },
  {
    id: 'cocoapods',
    pattern: /(cocoapods|pod install|could not find compatible versions for pod|the following build commands failed)/i,
    build: ({ evidence }) => ({
      title: 'iOS CocoaPods / Xcode build error',
      rootCause:
        'The installed Pods do not match the versions required by your native dependencies, or Xcode is building with stale derived data.',
      explanation:
        'CocoaPods links native iOS libraries. When package.json changes but Pods are not reinstalled, Xcode compiles mismatched code.',
      evidence,
      solution: [
        { title: 'Check dependencies match the Expo SDK', command: 'npx expo install --fix' },
        { title: 'Regenerate the iOS project and Pods', command: 'npx expo prebuild --clean --platform ios' },
        { title: 'Clear Xcode derived data', command: 'rm -rf ~/Library/Developer/Xcode/DerivedData' },
        { title: 'Rebuild', command: 'npx expo run:ios' },
      ],
      verification: ['Pod install finishes without errors.', 'Xcode prints "Build Succeeded".'],
      confidence: 'medium',
      additionalInfo: 'On Apple Silicon, make sure CocoaPods is installed with Homebrew or a native Ruby, not under Rosetta.',
    }),
  },
  {
    id: 'typescript-assignable',
    pattern: /(TS\d{4}|type ['"`].+['"`] is not assignable to type)/i,
    build: ({ evidence }) => ({
      title: 'TypeScript type mismatch',
      rootCause: 'A value is used where TypeScript expects a different type — commonly a possibly-undefined value or a wrong prop type.',
      explanation:
        'TypeScript checks types at compile time. The app may still run, but the compiler is warning about a real bug risk.',
      evidence,
      solution: [
        { title: 'Read the full error — the last "Type X is not assignable to Y" line is the real mismatch.' },
        { title: 'Narrow undefined values before use (e.g. `if (!value) return;` or `value ?? fallback`).' },
        { title: 'Re-run the type checker', command: 'npx tsc --noEmit' },
      ],
      verification: ['npx tsc --noEmit exits with no errors.'],
      confidence: 'medium',
    }),
  },
  {
    id: 'network-request-failed',
    pattern: /network request failed/i,
    build: ({ evidence }) => ({
      title: 'Network request failed',
      rootCause:
        'The app could not reach the server — usually localhost is used from a device/emulator, the server is down, or plain HTTP is blocked.',
      explanation:
        'On a device, "localhost" means the phone itself. Android emulators use 10.0.2.2 for the host machine, and iOS blocks non-HTTPS traffic by default.',
      evidence,
      solution: [
        { title: 'Replace localhost with your computer’s LAN IP (or 10.0.2.2 on Android emulator).' },
        { title: 'Check the server is reachable from the device browser.' },
        { title: 'Prefer HTTPS endpoints (ngrok or a deployed backend for testing).' },
      ],
      verification: ['The request returns a response in the app.', 'No "Network request failed" in the logs.'],
      confidence: 'medium',
    }),
  },
  {
    id: 'text-outside-text',
    pattern: /text strings must be rendered within a <Text> component/i,
    build: ({ evidence }) => ({
      title: 'Text rendered outside a <Text> component',
      rootCause:
        'A raw string (or a value like 0 from `count && <View/>`) is rendered directly inside a <View>.',
      explanation: 'On native, every piece of text must be wrapped in <Text>. Conditional `&&` with numbers is the usual culprit.',
      evidence,
      solution: [
        { title: 'Wrap plain strings in <Text>.' },
        { title: 'Replace `count && <Item />` with `count > 0 ? <Item /> : null`.' },
      ],
      verification: ['The red screen disappears and the component renders.'],
      confidence: 'high',
    }),
  },
  {
    id: 'backend-port',
    pattern: /(EADDRINUSE|ECONNREFUSED)/i,
    build: ({ match, evidence }) => {
      const inUse = match[1].toUpperCase() === 'EADDRINUSE';
      return {
        title: inUse ? 'Port already in use' : 'Connection refused',
        rootCause: inUse
          ? 'Another process is already listening on the port your server tries to bind.'
          : 'Nothing is listening at the host/port the client is connecting to (service down, wrong port, or wrong host).',
        explanation: inUse
          ? 'Only one process can bind a port. A previous server instance is often still running in the background.'
          : 'ECONNREFUSED means the TCP connection was actively rejected — the target machine is reachable but the port is closed.',
        evidence,
        solution: inUse
          ? [
              { title: 'Find the process using the port', command: 'lsof -i :<port>' },
              { title: 'Stop it (replace PID)', command: 'kill -9 <PID>' },
              { title: 'Or start your server on another port', command: 'PORT=3001 npm start' },
            ]
          : [
              { title: 'Confirm the service is running', command: 'lsof -i :<port>' },
              { title: 'Check host/port in your env config (DB_HOST, API_URL...).' },
              { title: 'In Docker, use the service name instead of localhost.' },
            ],
        verification: ['The server starts and logs that it is listening.', 'A request (curl) succeeds.'],
        confidence: 'high',
      };
    },
  },
  {
    id: 'undefined-property',
    pattern: /cannot read propert(y|ies) of (undefined|null)(?: \(reading ['"`](\w+)['"`]\))?/i,
    build: ({ match, evidence }) => ({
      title: `Cannot read properties of ${match[2]}${match[3] ? ` (reading '${match[3]}')` : ''}`,
      rootCause: `Code accesses ${match[3] ? `'${match[3]}'` : 'a property'} on a value that is ${match[2]} at runtime — typically data that has not loaded yet or an unexpected API response shape.`,
      explanation: 'JavaScript throws when you access a property on undefined/null. The stack trace’s first app frame shows where.',
      evidence,
      solution: [
        { title: 'Open the first stack frame from your own code (not node_modules).' },
        { title: 'Guard the access with optional chaining: `obj?.prop`.' },
        { title: 'Validate API responses before using them.' },
      ],
      verification: ['The same action no longer throws.', 'Add a test for the empty/null case.'],
      confidence: 'medium',
    }),
  },
];

const GENERIC_STEPS: Record<TechType, AnalysisResult['solution']> = {
  'react-native': [
    { title: 'Restart Metro with a clean cache', command: 'npx expo start --clear' },
    { title: 'Reinstall dependencies', command: 'rm -rf node_modules && npm install' },
  ],
  expo: [
    { title: 'Diagnose project configuration', command: 'npx expo-doctor' },
    { title: 'Align package versions with your SDK', command: 'npx expo install --fix' },
  ],
  android: [
    { title: 'Clean the Gradle build', command: 'cd android && ./gradlew clean' },
    { title: 'Rebuild the app', command: 'npx expo run:android' },
  ],
  ios: [
    { title: 'Regenerate iOS project', command: 'npx expo prebuild --clean --platform ios' },
    { title: 'Rebuild the app', command: 'npx expo run:ios' },
  ],
  backend: [
    { title: 'Run the server with verbose logging and reproduce the request.' },
    { title: 'Check environment variables and service dependencies (DB, cache, queues).' },
  ],
};

function genericResult(request: AnalysisRequest, evidence: string): AnalysisResult {
  const firstLine = evidence.split('\n')[0]?.trim() || 'Unrecognized error';
  return {
    title: firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine,
    rootCause:
      'This error does not match a known pattern in the offline knowledge base. Below are general recovery steps for this platform.',
    explanation:
      'Start from the first error line in the log — later errors are often side effects of the first one.',
    evidence,
    solution: [
      { title: 'Search the exact first error line in the library’s GitHub issues.' },
      ...GENERIC_STEPS[request.tech],
    ],
    verification: ['Reproduce the original steps and confirm the error is gone.'],
    confidence: 'low',
    additionalInfo: 'Add more context (code snippet, package versions, steps to reproduce) for a more precise answer.',
  };
}

export function buildMockAnalysis(request: AnalysisRequest): AnalysisResult {
  const evidence = extractEvidence(request.errorText);
  for (const rule of RULES) {
    const match = request.errorText.match(rule.pattern);
    if (match) return rule.build({ request, match, evidence });
  }
  return genericResult(request, evidence);
}

/** Ready-to-paste samples for demos and manual testing. */
export const SAMPLE_ERRORS: { label: string; tech: TechType; text: string }[] = [
  {
    label: 'Metro bundler',
    tech: 'react-native',
    text: "error: Unable to resolve module 'react-native-gesture-handler' from 'App.tsx': react-native-gesture-handler could not be found within the project.",
  },
  {
    label: 'Gradle',
    tech: 'android',
    text: "FAILURE: Build failed with an exception.\n* What went wrong:\nExecution failed for task ':app:mergeDebugResources'.",
  },
  {
    label: 'CocoaPods',
    tech: 'ios',
    text: '[!] CocoaPods could not find compatible versions for pod "React-Core":\n  In Podfile:\n    React-Core (from `../node_modules/react-native/`)',
  },
  {
    label: 'TypeScript',
    tech: 'react-native',
    text: "src/App.tsx:12:7 - error TS2322: Type 'undefined' is not assignable to type 'string'.",
  },
  {
    label: 'Backend',
    tech: 'backend',
    text: 'Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1817:16)',
  },
];
