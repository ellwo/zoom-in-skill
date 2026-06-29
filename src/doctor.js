'use strict';

const fs = require('fs');
const {
  CACHE_SKILL_DIR, bundledVersion, skillVersionAt, looksLikeOurSkill,
  isDir, isSymlink, exists, ok, warn, err, info, dim, paint,
} = require('./util');
const manifest = require('./manifest');

// `zoom-in doctor` — diagnose the local install.
// Checks the staged cache, the manifest, and every recorded install target
// (presence, symlink validity, copy integrity, version drift). Returns an
// exit code: 0 if healthy, 1 if any problem.
function runDoctor() {
  const v = bundledVersion();
  let problems = 0;
  let checks = 0;
  const problem = (m) => { err(m); problems++; };

  info(`zoom-in doctor — install health check (skill v${v})`);
  log('');

  // 1. Staged cache (~/.zoom-in/skills/zoom-in)
  checks++;
  if (!isDir(CACHE_SKILL_DIR)) {
    problem(`Staged cache missing: ${CACHE_SKILL_DIR}`);
    dim('  → run `npx zoom-in install` to (re)stage the skill');
  } else if (!looksLikeOurSkill(CACHE_SKILL_DIR)) {
    problem(`Staged cache at ${CACHE_SKILL_DIR} is not the zoom-in skill`);
  } else {
    const cacheVer = skillVersionAt(CACHE_SKILL_DIR) || v;
    ok(`Staged cache present (v${cacheVer}): ${CACHE_SKILL_DIR}`);
  }

  // 2. Manifest
  checks++;
  const m = manifest.read();
  if (!m.installs.length) {
    warn('No installs recorded in manifest — skill is not installed anywhere yet.');
    dim('  → run `npx zoom-in install`');
  } else {
    ok(`Manifest: ${m.installs.length} install(s) recorded at ~/.zoom-in/manifest.json`);
  }

  // 3. Each recorded install
  for (const rec of m.installs) {
    checks++;
    const label = `${rec.id} [${rec.scope}]`;

    if (!exists(rec.path) && !isSymlink(rec.path)) {
      problem(`${label}: missing on disk — ${rec.path}`);
      continue;
    }

    if (rec.method === 'link') {
      if (!isSymlink(rec.path)) {
        problem(`${label}: recorded as link but is not a symlink — ${rec.path}`);
        continue;
      }
      let target = null;
      try { target = fs.realpathSync(rec.path); } catch (_) { target = null; }
      if (!target || !isDir(target)) {
        problem(`${label}: broken symlink — ${rec.path}`);
        continue;
      }
      const tVer = skillVersionAt(target) || '?';
      ok(`${label}: symlink valid (→ v${tVer})`);
    } else {
      if (isSymlink(rec.path)) {
        problem(`${label}: recorded as copy but is a symlink — ${rec.path}`);
        continue;
      }
      if (!looksLikeOurSkill(rec.path)) {
        problem(`${label}: not the zoom-in skill — ${rec.path}`);
        continue;
      }
      const instVer = skillVersionAt(rec.path);
      if (instVer && instVer !== v) {
        warn(`${label}: version ${instVer} (bundled ${v}) — run \`npx zoom-in update\``);
      } else {
        ok(`${label}: copy present (v${instVer || v})`);
      }
    }
  }

  log('');
  if (problems === 0) {
    ok(`All ${checks} check(s) passed — install is healthy.`);
    return 0;
  }
  err(`${problems} problem(s) across ${checks} check(s).`);
  dim('Fix with: npx zoom-in update     (refresh staged cache + installed copies)');
  dim('         npx zoom-in install     (re-install any missing targets)');
  return 1;
}

const log = (m) => process.stdout.write(`${m}\n`);

module.exports = { runDoctor };
