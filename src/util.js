'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Paths --------------------------------------------------------------

// Directory of this file: <pkg>/src/util.js
const PKG_ROOT = path.resolve(__dirname, '..');
const BUNDLED_SKILLS_DIR = path.join(PKG_ROOT, 'skills');
const BUNDLED_SKILL_NAME = 'zoom-in';
const BUNDLED_SKILL_DIR = path.join(BUNDLED_SKILLS_DIR, BUNDLED_SKILL_NAME);

const HOME = process.env.ZOOMIN_HOME || os.homedir();
const HOME_DIR = path.join(HOME, '.zoom-in');          // installer home (global)
const CACHE_SKILLS_DIR = path.join(HOME_DIR, 'skills'); // staged copy: ~/.zoom-in/skills
const CACHE_SKILL_DIR = path.join(CACHE_SKILLS_DIR, BUNDLED_SKILL_NAME);
const MANIFEST_PATH = path.join(HOME_DIR, 'manifest.json');

// Marker written into staged cache so we can identify our own copy later.
const OWNERSHIP_MARKER = '.zoom-in-installed.json';

function bundledVersion() {
  // Read the skill's declared version from SKILL.md frontmatter.
  try {
    const skillFile = path.join(BUNDLED_SKILL_DIR, 'SKILL.md');
    const text = fs.readFileSync(skillFile, 'utf8');
    const m = text.match(/^---[\s\S]*?^version:\s*(\S+)/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch (_) { /* fall through */ }
  // Fall back to package.json version.
  try {
    return require('../package.json').version;
  } catch (_) {
    return '0.0.0';
  }
}

// --- Filesystem helpers -------------------------------------------------

function exists(p) {
  try { fs.statSync(p); return true; } catch (_) { return false; }
}
function isSymlink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch (_) { return false; }
}
function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (_) { return false; }
}
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function rmrf(p) {
  if (!exists(p) && !isSymlink(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

// Copy a directory tree recursively (files + subdirs). Overwrites target.
function copyTree(src, dst) {
  mkdirp(path.dirname(dst));
  if (isSymlink(src) || !isDir(src)) {
    fs.copyFileSync(src, dst);
    return;
  }
  mkdirp(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Create a symlink target -> source. Returns true on success.
// Falls back to a copy if symlink creation fails (e.g. Windows w/o admin).
function linkOrCopy(source, target) {
  mkdirp(path.dirname(target));
  rmrf(target);
  try {
    fs.symlinkSync(source, target);
    return 'link';
  } catch (_) {
    copyTree(source, target);
    return 'copy';
  }
}

// Confirm a directory looks like our skill by reading SKILL.md frontmatter.
function looksLikeOurSkill(dir) {
  try {
    const skillFile = path.join(dir, 'SKILL.md');
    const text = fs.readFileSync(skillFile, 'utf8');
    const m = text.match(/^---[\s\S]*?^name:\s*(\S+)/m);
    return m && m[1].trim() === BUNDLED_SKILL_NAME;
  } catch (_) {
    return false;
  }
}

// --- Logging ------------------------------------------------------------

const COLORS = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', dim: '\x1b[2m',
};
const USE_COLOR = process.stdout.isTTY && !process.env.NO_COLOR;

function paint(color, msg) {
  return USE_COLOR ? `${COLORS[color] || ''}${msg}${COLORS.reset}` : msg;
}
const log = (m) => process.stdout.write(`${m}\n`);
const ok = (m) => log(`${paint('green', '✓')} ${m}`);
const warn = (m) => log(`${paint('yellow', '⚠')} ${m}`);
const err = (m) => process.stderr.write(`${paint('red', '✗')} ${m}\n`);
const info = (m) => log(`${paint('cyan', '→')} ${m}`);
const dim = (m) => log(`  ${paint('dim', m)}`);

function fatal(msg, code = 1) {
  err(msg);
  process.exit(code);
}

module.exports = {
  PKG_ROOT, BUNDLED_SKILLS_DIR, BUNDLED_SKILL_NAME, BUNDLED_SKILL_DIR,
  HOME, HOME_DIR, CACHE_SKILLS_DIR, CACHE_SKILL_DIR, MANIFEST_PATH,
  OWNERSHIP_MARKER, bundledVersion,
  exists, isSymlink, isDir, mkdirp, rmrf, copyTree, linkOrCopy,
  looksLikeOurSkill,
  log, ok, warn, err, info, dim, paint, fatal,
};
