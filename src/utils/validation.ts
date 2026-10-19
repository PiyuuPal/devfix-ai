export const ERROR_TEXT_MIN = 10;
export const ERROR_TEXT_MAX = 10_000;
export const CONTEXT_MAX = 2_000;

export interface AnalysisFormErrors {
  errorText?: string;
  context?: string;
}

export function validateAnalysisForm(errorText: string, context: string): AnalysisFormErrors {
  const errors: AnalysisFormErrors = {};
  const trimmed = errorText.trim();
  if (!trimmed) {
    errors.errorText = 'Paste an error message, stack trace or log to analyze.';
  } else if (trimmed.length < ERROR_TEXT_MIN) {
    errors.errorText = `Add a bit more detail (at least ${ERROR_TEXT_MIN} characters).`;
  } else if (trimmed.length > ERROR_TEXT_MAX) {
    errors.errorText = `Error text is too long (max ${ERROR_TEXT_MAX.toLocaleString()} characters). Keep the most relevant part.`;
  }
  if (context.trim().length > CONTEXT_MAX) {
    errors.context = `Context is too long (max ${CONTEXT_MAX.toLocaleString()} characters).`;
  }
  return errors;
}

export const hasErrors = (errors: AnalysisFormErrors) => Object.values(errors).some(Boolean);
