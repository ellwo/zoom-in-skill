'use strict';

// Asserts package.json version and skills/zoom-in/SKILL.md frontmatter version
// match. Run in CI and before publish so the npm-published version and the
// version `npx zoom-in --version` reports can never drift.
//   node test/version-sync.js

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const skillPath = path.join(__dirname, '..', 'skills', 'zoom-in', 'SKILL.md');
const skill = fs.readFileSync(skillPath, 'utf8');

const m = skill.match(/^---[\s\S]*?^version:\s*(\S+)/m);
if (!m) {
  console.error('FAIL: no `version:` field found in skills/zoom-in/SKILL.md frontmatter');
  process.exit(1);
}
const skillVersion = m[1].trim().replace(/^["']|["']$/g, '');

if (pkg.version !== skillVersion) {
  console.error(`FAIL: version mismatch — package.json=${pkg.version}, SKILL.md=${skillVersion}`);
  console.error('Bump both together so `npx zoom-in --version` and the npm release agree.');
  process.exit(1);
}

console.log(`ok: versions in sync — ${pkg.version}`);
