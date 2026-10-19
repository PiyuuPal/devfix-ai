/** Error with an HTTP status the route can return as-is. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// The app's own timeout is 60s; stay under it and let the user tap "Try Again"
// instead of retrying here.
export const AI_TIMEOUT_MS = 50_000;

export function logUsage(model: string, input: number, output: number, pricePerMTok?: { input: number; output: number }) {
  const cost = pricePerMTok ? ` ~$${((input * pricePerMTok.input + output * pricePerMTok.output) / 1_000_000).toFixed(4)}` : '';
  console.log(`usage model=${model} in=${input} out=${output}${cost}`);
}
