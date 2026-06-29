'use strict';

const path = require('path');
const {
  BUNDLED_SKILL_NAME, isDir, isSymlink, rmrf, looksLikeOurSkill,
  ok, warn, info, dim, paint,
} = require('./util');
const { targetById, supportedIds, detectAvailable, resolveProjectSkillsDir } = require('./targets');
const manifest = require('./manifest');

// Resolve targets for uninstall. With no args, remove everything in manifest.
function resolveUninstallTargets(args, opts) {
  const project = !!opts.project;
  const projectRoot = opts.projectRoot || process.cwd();
  const m = manifest.read();

  if (args.length > 0) {
    const out = [];
    for (const id of args) {
      const t = targetById(id, project);
      if (!t) {
        warn(`Unknown target '${id}'. Supported: ${supportedIds(project).join(', ')}`);
        continue;
      }
      const skillsDirAbs = project ? resolveProjectSkillsDir(t, projectRoot) : t.skillsDir;
      out.push({ target: t, skillsDirAbs, scope: project ? 'project' : 'global', projectRoot: project ? projectRoot : undefined });
    }
    return out;
  }

  // No args → uninstall everything recorded in the manifest.
  if (!m.installs.length) {
    info('No installs recorded in manifest. Nothing to uninstall.');
    return [];
  }
  return m.installs.map((rec) => ({
    target: { id: rec.id, label: rec.id },
    skillsDirAbs: path.dirname(rec.path),
    scope: rec.scope,
    projectRoot: rec.projectRoot,
    _recordedPath: rec.path,
  }));
}

function runUninstall(args, opts) {
  info('Uninstalling zoom-in skill');
  if (opts.dryRun) dim('(dry run — no files will change)');

  const targets = resolveUninstallTargets(args, opts);
  if (!targets.length) return;

  const m = manifest.read();
  let removed = 0, skipped = 0;

  for (const t of targets) {
    const skillPath = t._recordedPath || path.join(t.skillsDirAbs, BUNDLED_SKILL_NAME);

    if (!isSymlink(skillPath) && !isDir(skillPath)) {
      dim(`${t.target.label}: not present at ${skillPath} — already removed.`);
      manifest.removeInstall(m, { scope: t.scope, path: skillPath });
      removed++;
      continue;
    }

    // Safety: only remove if it's recognizably ours (or a symlink, which we
    // created). Never delete a foreign skill directory.
    if (isDir(skillPath) && !looksLikeOurSkill(skillPath)) {
      warn(`${t.target.label}: '${skillPath}' is not the zoom-in skill. Skipped.`);
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      dim(`would remove ${skillPath}`);
      continue;
    }

    rmrf(skillPath);
    manifest.removeInstall(m, { scope: t.scope, path: skillPath });
    ok(`${t.target.label}: removed ${skillPath}`);
    removed++;
  }

  log('');
  ok(`Removed zoom-in from ${removed} target${removed === 1 ? '' : 's'}${skipped ? `, ${skipped} skipped` : ''}.`);
  dim('The staged cache at ~/.zoom-in/ is left in place for re-installs.');
  dim('To remove it too: rm -rf ~/.zoom-in');
}

const log = (m) => process.stdout.write(`${m}\n`);

module.exports = { runUninstall };
