'use strict';

// Validates the npm tarball contents via `npm pack --dry-run --json`.
// Fails if the published package would include test/ files, a stray .tgz,
// or any other path we never want shipped. Run in CI.
//   node test/tarball-check.js

const { execSync } = require('child_process');

let data;
try {
  const out = execSync('npm pack --dry-run --json', { encoding: 'utf8' });
  data = JSON.parse(out);
} catch (e) {
  console.error('FAIL: could not run/read `npm pack --dry-run --json`');
  console.error(e.stderr || e.message);
  process.exit(1);
}

const files = data.flatMap((d) => (d.files || []).map((f) => f.path));
const forbidden = (p) =>
  p.startsWith('test/') ||
  p.endsWith('.tgz') ||
  p === '.gitignore' ||
  p === '.npmignore';

const bad = files.filter(forbidden);
if (bad.length) {
  console.error('FAIL: tarball includes files it should not ship:');
  for (const p of bad) console.error('  - ' + p);
  process.exit(1);
}

console.log(`ok: tarball clean — ${files.length} files, no test/ or stray artifacts`);
