import type { AnalysisResult } from '@/types/analysis';

export function timeAgo(timestamp: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - timestamp) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function collectCommands(result: AnalysisResult): string[] {
  return result.solution.map((s) => s.command).filter((c): c is string => !!c);
}

/** Plain-text version of the fix steps, for "Copy Fix". */
export function formatFix(result: AnalysisResult): string {
  return result.solution
    .map((s, i) => {
      const lines = [`${i + 1}. ${s.title}`];
      if (s.description) lines.push(`   ${s.description}`);
      if (s.command) lines.push(...s.command.split('\n').map((c) => `   $ ${c}`));
      return lines.join('\n');
    })
    .join('\n');
}

/** Full Markdown report, for "Copy All". */
export function formatReport(result: AnalysisResult): string {
  const parts = [
    `# ${result.title}`,
    `Confidence: ${result.confidence}`,
    `## Root cause\n${result.rootCause}`,
    result.explanation && `## Explanation\n${result.explanation}`,
    result.evidence && `## Evidence\n\`\`\`\n${result.evidence}\n\`\`\``,
    `## Solution\n${formatFix(result)}`,
    result.verification.length > 0 && `## Verification\n${result.verification.map((v) => `- ${v}`).join('\n')}`,
    result.additionalInfo && `## Additional info\n${result.additionalInfo}`,
  ];
  return parts.filter(Boolean).join('\n\n');
}
