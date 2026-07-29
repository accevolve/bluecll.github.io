#!/usr/bin/env node

function printUsage() {
  console.log([
    'Usage:',
    '  INDEXNOW_KEY=... node scripts/submit-indexnow.mjs [--dry-run] <url>...',
    '  INDEXNOW_KEY=... node scripts/submit-indexnow.mjs --submit <url>...',
    '',
    'Only explicit https://jsontool.cn URLs are accepted. Without --submit, no request is sent.'
  ].join('\n'));
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSubmit = args.includes('--submit');
  const explicitlyDryRun = args.includes('--dry-run');
  const wantsHelp = args.includes('--help') || args.includes('-h');
  const unknownOptions = args.filter((arg) => arg.startsWith('-') && !['--submit', '--dry-run', '--help', '-h'].includes(arg));
  const inputUrls = args.filter((arg) => !arg.startsWith('-'));

  if (wantsHelp) {
    printUsage();
    return;
  }

  if (unknownOptions.length > 0) {
    throw new Error(`Unknown option: ${unknownOptions[0]}`);
  }
  if (shouldSubmit && explicitlyDryRun) {
    throw new Error('Choose either --submit or --dry-run, not both.');
  }

  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    throw new Error('INDEXNOW_KEY is required.');
  }
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error('INDEXNOW_KEY must be 8-128 characters using letters, numbers, or dashes.');
  }
  if (inputUrls.length === 0) {
    printUsage();
    throw new Error('At least one URL is required.');
  }

  const normalizedUrls = [...new Set(inputUrls.map((input) => {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.hostname !== 'jsontool.cn' || url.port) {
      throw new Error(`URL must use https://jsontool.cn: ${input}`);
    }
    if (url.username || url.password || url.hash) {
      throw new Error(`URL must not contain credentials or a fragment: ${input}`);
    }
    return url.href;
  }))];
  if (normalizedUrls.length > 10000) {
    throw new Error('IndexNow accepts at most 10,000 URLs per request.');
  }

  if (!shouldSubmit) {
    console.log(`Dry run passed for ${normalizedUrls.length} URL(s); no request was sent.`);
  } else {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'jsontool.cn',
        key,
        keyLocation: `https://jsontool.cn/${key}-indexnow.txt`,
        urlList: normalizedUrls
      })
    });

    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`IndexNow request failed with HTTP ${response.status}.`);
    }

    console.log(`IndexNow accepted ${normalizedUrls.length} URL(s) with HTTP ${response.status}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`IndexNow submission failed: ${error.message}`);
  process.exitCode = 1;
}
