export function renderProgressBar(current: number, total: number, width: number = 20): string {
  const percent = total === 0 ? 1 : Math.min(1, current / total);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const filledStr = '█'.repeat(filled);
  const emptyStr = '░'.repeat(empty);
  return `[${filledStr}${emptyStr}] ${current}/${total}`;
}
