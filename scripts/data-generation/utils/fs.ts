import fs from 'node:fs';
import path from 'node:path';

export async function loadJson<T>(filepath: string): Promise<T> {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

/** Synchronous variant of loadJson — use only when an async context is unavailable (e.g. inside Array.filter). */
export function loadJsonSync<T>(filepath: string): T {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJson(filepath: string, data: unknown): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/** Returns true if the file or directory at the given path exists. */
export function fileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

export function ensureDir(dirpath: string): void {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

/**
 * Returns a versioned file path (e.g. foo-v2.json, foo-v3.json) to avoid
 * overwriting an existing file. If basePath does not yet exist, returns basePath as-is.
 */
export function getNextVersionPath(basePath: string): string {
  if (!fs.existsSync(basePath)) return basePath;
  const ext = path.extname(basePath);
  const base = basePath.slice(0, -ext.length);
  let v = 2;
  while (fs.existsSync(`${base}-v${v}${ext}`)) {
    v++;
  }
  return `${base}-v${v}${ext}`;
}

/**
 * Creates and returns the next numbered run sub-directory under debugBase.
 * e.g. <debugBase>/<topicId>-run-1, -run-2, …
 * The caller MUST pass a debugBase derived from its own __dirname to avoid
 * process.cwd() portability issues.
 */
export function getNextDebugRunDir(topicId: string, debugBase: string): string {
  ensureDir(debugBase);
  let run = 1;
  while (fs.existsSync(path.join(debugBase, `${topicId}-run-${run}`))) {
    run++;
  }
  const runDir = `${topicId}-run-${run}`;
  ensureDir(path.join(debugBase, runDir));
  return runDir;
}