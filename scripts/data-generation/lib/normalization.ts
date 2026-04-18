export function normalizeScoresTo100(rawCounts: number[]): number[] {
  const total = rawCounts.reduce((sum: number, count: number) => sum + count, 0);
  
  if (total === 0) {
    return rawCounts.map(() => 0);
  }

  const result: number[] = [];
  const decimalParts: number[] = [];

  for (const count of rawCounts) {
    const percentage = (count / total) * 100;
    const floor = Math.floor(percentage);
    const decimal = percentage - floor;
    result.push(floor);
    decimalParts.push(decimal);
  }

  const currentSum = result.reduce((sum: number, s: number) => sum + s, 0);
  const remainder = 100 - currentSum;

  const indexedDecimals = decimalParts.map((d, i) => ({ decimal: d, index: i }));
  indexedDecimals.sort((a, b) => b.decimal - a.decimal);

  for (let i = 0; i < remainder; i++) {
    const originalIndex = indexedDecimals[i].index;
    result[originalIndex]++;
  }

  return result;
}