#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key) {
    console.warn('INDEXNOW_KEY is not configured; skipping verification file generation.');
    return;
  }

  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error('INDEXNOW_KEY must be 8-128 characters using letters, numbers, or dashes.');
  }

  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(scriptDirectory, '..', `${key}-indexnow.txt`);

  await writeFile(outputPath, `${key}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log('IndexNow verification file prepared.');
}

try {
  await main();
} catch (error) {
  console.error(`IndexNow setup failed: ${error.message}`);
  process.exitCode = 1;
}
