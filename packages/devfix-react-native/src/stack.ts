const MAX_FRAMES = 15;

/**
 * Dev stack frames carry the full Metro bundle URL, e.g.
 * "at Foo (http://10.0.2.2:8081/node_modules/expo-router/entry.bundle//&platform=…:220752:24)".
 * Those positions point into the generated bundle, so they only cost tokens. Keep the
 * function and source-file names and drop the rest.
 */
export function cleanStack(stack: string): string {
  const lines = stack
    .split('\n')
    .map((line) => line.replace(/\s*\(?https?:\/\/[^\s)]*\)?/g, '').trimEnd())
    .filter(Boolean);
  const [head, ...frames] = lines;
  const kept = frames.slice(0, MAX_FRAMES);
  if (frames.length > kept.length) kept.push(`    … ${frames.length - kept.length} more frames`);
  return [head, ...kept].join('\n');
}
