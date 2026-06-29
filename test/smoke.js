'use strict';

// Smoke test: runs the CLI end-to-end inside a throwaway HOME so it never
// touches the real user config. No external test runner required.
//   node test/smoke.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PKG = path.resolve(__dirname, '..');
const BIN = path.join(PKG, 'bin', 'zoom-in.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'zoom-in-smoke-'));
const FAKE_HOME = path.join(TMP, 'home');
fs.mkdirSync(FAKE_HOME, { recursive: true });

let failures = 0;
function check(name, cond, extra) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    console.error(`  FAIL ${name}${extra ? ' — ' + extra : ''}`);
    failures++;
  }
}

function run(args, expectOk = true) {
  try {
    const out = execFileSync(process.execPath, [BIN, ...args], {
      env: { ...process.env, ZOOMIN_HOME: FAKE_HOME },
      encoding: 'utf8',
    });
    return { ok: true, out };
  } catch (e) {
    if (!expectOk) return { ok: false, out: (e.stderr || '') + (e.stdout || '') };
    throw e;
  }
}

console.log('zoom-in smoke test');
console.log(`  fake home: ${FAKE_HOME}`);

// 1. version + help work without touching anything
const v = run(['--version']);
check('--version prints v1', /v\d+\.\d+\.\d+/.test(v.out), v.out.trim());

const h = run(['--help']);
check('--help mentions install/update/uninstall',
  /install/.test(h.out) && /update/.test(h.out) && /uninstall/.test(h.out));

// 2. targets lists supported editors
const t = run(['targets']);
check('targets lists cursor + claude', /cursor/.test(t.out) && /claude/.test(t.out));

// 3. dry-run changes nothing
run(['install', '--dry-run', 'cursor']);
check('dry-run created no files', !fs.existsSync(path.join(FAKE_HOME, '.cursor')));

// 4. real install into cursor + claude (creates editor homes)
const inst = run(['install', 'cursor', 'claude']);
check('install created ~/.cursor/skills/zoom-in/SKILL.md',
  fs.existsSync(path.join(FAKE_HOME, '.cursor', 'skills', 'zoom-in', 'SKILL.md')));
check('install created ~/.claude/skills/zoom-in/SKILL.md',
  fs.existsSync(path.join(FAKE_HOME, '.claude', 'skills', 'zoom-in', 'SKILL.md')));
check('install copied a reference file',
  fs.existsSync(path.join(FAKE_HOME, '.cursor', 'skills', 'zoom-in', 'references', 'audit.md')));
check('manifest recorded 2 installs',
  JSON.parse(fs.readFileSync(path.join(FAKE_HOME, '.zoom-in', 'manifest.json'), 'utf8')).installs.length === 2);

// 5. list reflects installs
const l = run(['list']);
check('list shows cursor + claude', /cursor/.test(l.out) && /claude/.test(l.out));

// 6. update refreshes without doubling installs
const before = JSON.parse(fs.readFileSync(path.join(FAKE_HOME, '.zoom-in', 'manifest.json'), 'utf8')).installs.length;
run(['update']);
const after = JSON.parse(fs.readFileSync(path.join(FAKE_HOME, '.zoom-in', 'manifest.json'), 'utf8')).installs.length;
check('update did not duplicate installs', before === after, `${before} -> ${after}`);
check('update kept SKILL.md present',
  fs.existsSync(path.join(FAKE_HOME, '.cursor', 'skills', 'zoom-in', 'SKILL.md')));

// 7. symlink mode for one extra target
run(['install', 'agents', '--link']);
const agentsPath = path.join(FAKE_HOME, '.agents', 'skills', 'zoom-in');
check('link mode created a symlink', fs.lstatSync(agentsPath).isSymbolicLink(), 'not a symlink');

// 8. uninstall removes only our skill
run(['uninstall', 'cursor']);
check('uninstall removed cursor skill dir',
  !fs.existsSync(path.join(FAKE_HOME, '.cursor', 'skills', 'zoom-in')));
check('uninstall left claude intact',
  fs.existsSync(path.join(FAKE_HOME, '.claude', 'skills', 'zoom-in', 'SKILL.md')));

// 9. uninstall-all clears the rest
run(['uninstall']);
check('uninstall-all removed claude',
  !fs.existsSync(path.join(FAKE_HOME, '.claude', 'skills', 'zoom-in')));
check('uninstall-all removed agents link',
  !fs.existsSync(path.join(FAKE_HOME, '.agents', 'skills', 'zoom-in')));

// 10. safety: foreign skill is not clobbered without --force
const foreign = path.join(FAKE_HOME, '.cline', 'skills', 'zoom-in', 'SKILL.md');
fs.mkdirSync(path.dirname(foreign), { recursive: true });
fs.writeFileSync(foreign, '---\nname: not-zoom-in\n---\nforeign\n');
run(['install', 'cline']);
check('foreign skill was not overwritten',
  fs.readFileSync(foreign, 'utf8').includes('foreign'));

// cleanup
fs.rmSync(TMP, { recursive: true, force: true });

console.log('');
if (failures === 0) {
  console.log('PASS — all checks succeeded');
  process.exit(0);
} else {
  console.error(`FAIL — ${failures} check(s) failed`);
  process.exit(1);
}
