'use strict';

const {
  BUNDLED_SKILL_NAME, bundledVersion, HOME_DIR, MANIFEST_PATH,
  isDir, isSymlink, exists, paint, ok, warn, info, dim,
} = require('./util');
const { GLOBAL_TARGETS, PROJECT_TARGETS, statusOf, resolveProjectSkillsDir } = require('./targets');
const manifest = require('./manifest');

function fmtDate(ts) {
  if (!ts) return 'unknown';
  try { return new Date(ts).toISOString().replace('T', ' ').slice(0, 16); }
  catch (_) { return String(ts); }
}

// `zoom-in list` — show what's recorded in the manifest + on-disk reality.
function runList() {
  const m = manifest.read();
  const v = bundledVersion();
  info(`zoom-in skill v${v}`);

  if (!m.installs.length) {
    warn('Not installed anywhere yet.');
    dim('Run `npx zoom-in install` to get started.');
    return;
  }

  log(`  Manifest: ${MANIFEST_PATH}`);
  log('');
  for (const rec of m.installs) {
    const present = isSymlink(rec.path) || isDir(rec.path);
    const mark = present ? paint('green', '✓') : paint('red', '✗');
    const scopeTag = rec.scope === 'project' ? paint('dim', '[project]') : paint('dim', '[global]');
    const methodTag = rec.method === 'link' ? paint('cyan', 'link') : paint('cyan', 'copy');
    log(`  ${mark} ${rec.id.padEnd(8)} ${scopeTag} ${methodTag}`);
    dim(`    ${rec.path}`);
    dim(`    installed: ${fmtDate(rec.installedAt)}`);
  }
  log('');
  ok(`${m.installs.length} install${m.installs.length === 1 ? '' : 's'} recorded.`);
}

// `zoom-in targets` — show all supported targets + live detection status.
function runTargets(opts) {
  const project = !!opts.project;
  const projectRoot = opts.projectRoot || process.cwd();
  const v = bundledVersion();
  info(`zoom-in skill v${v} — supported targets`);
  log('');

  const table = project ? PROJECT_TARGETS : GLOBAL_TARGETS;
  log(`  ${project ? 'PROJECT' : 'GLOBAL'} targets:`);
  for (const t of table) {
    const skillsDirAbs = project ? resolveProjectSkillsDir(t, projectRoot) : t.skillsDir;
    const s = statusOf(t, skillsDirAbs);
    let state;
    if (s.skillState === 'link') state = paint('green', 'installed (link)');
    else if (s.skillState === 'copy') state = paint('green', 'installed (copy)');
    else if (s.skillState === 'unknown') state = paint('yellow', 'foreign skill present');
    else if (project) state = paint('dim', 'not installed');
    else if (s.homeOk || s.skillsDirOk) state = paint('dim', 'editor detected');
    else state = paint('dim', 'not detected');
    log(`  ${t.id.padEnd(9)} ${t.label}`);
    dim(`    ${skillsDirAbs} — ${state}`);
  }
  log('');
  dim('Install to specific targets: npx zoom-in install cursor claude');
  dim('Install everywhere detected: npx zoom-in install');
  dim('Install to every known target: npx zoom-in install --all');
  if (!project) dim('Project-shared install: npx zoom-in install --project');
}

const log = (m) => process.stdout.write(`${m}\n`);

module.exports = { runList, runTargets };
