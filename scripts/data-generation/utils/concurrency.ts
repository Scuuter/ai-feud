/**
 * concurrency.ts — Generic worker-pool concurrency utility.
 *
 * Runs up to `concurrency` async tasks at a time. As each task
 * finishes a worker immediately picks up the next one — no idle slots.
 * Preserves result order matching the input tasks array.
 *
 * @param tasks      Array of zero-argument async factory functions.
 * @param concurrency Maximum number of tasks running simultaneously.
 * @param onProgress Optional callback fired after each task completes.
 *                   Receives (completedCount, totalCount).
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
      completed++;
      onProgress?.(completed, tasks.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
