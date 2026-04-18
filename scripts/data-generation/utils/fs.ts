import fs from 'node:fs';

export async function loadJson<T>(filepath: string): Promise<T> {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

export function writeJson(filepath: string, data: unknown): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

export function ensureDir(dirpath: string): void {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}