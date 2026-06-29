'use strict';

const path = require('path');
const {
  HOME_DIR, CACHE_SKILL_DIR, BUNDLED_SKILL_DIR, BUNDLED_SKILL_NAME,
  bundledVersion, exists, isDir, isSymlink, mkdirp, rmrf, copyTree, linkOrCopy,
  looksLikeOurSkill, ok, warn, err, info, dim, paint, fatal,
} = require('./util');
const {
  targetById, supportedIds, detectAvailable, resolveProjectSkillsDir,
} = require('./targets');
const manifest = require('./manifest');

// Stage the bundled skill into the stable cache (~/.zoom-in/skills/zoom-in).
// This is the single source of truth for both copy and link installs, so
// `update` only needs to refresh the cache and re-apply.
function stageCache() {
  if (!isDir(BUNDLED_SKILL_DIR)) {
    fatal(`Bundled skill not found at ${BUNDLED_SKILL_DIR}. The package may be corrupt.`);
  }
  mkdirp(HOME_DIR);
  rmrf(CACHE_SKILL_DIR);
  copyTree(BUNDLED_SKILL_DIR, CACHE_SKILL_DIR);
}

// Resolve which targets to act on given CLI args + options.
// Returns a list of { target, skillsDirAbs, scope, projectRoot? }.
function resolveTargets(args, opts) {
  const project = !!opts.project;
  const projectRoot = opts.projectRoot || process.cwd();

  if (args.length > 0) {
    const out = [];
    for (const id of args) {
      const t = targetById(id, project);
      if (!t) {
        warn(`Unknown target '${id}'. Supported: ${supportedIds(project).join(', ')}`);
        continue;
      }
      const skillsDirAbs = project
        ? resolveProjectSkillsDir(t, projectRoot)
        : t.skillsDir;
      out.push({ target: t, skillsDirAbs, scope: project ? 'project' : 'global', projectRoot: project ? projectRoot : undefined });
    }
    return out;
  }

  // No explicit targets.
  if (opts.update) {
    // update with no args → re-apply exactly what's in the manifest.
    const m = manifest.read();
    if (!m.installs.length) {
      info('Nothing to update yet. Run `zoom-in install` first.');
      return [];
    }
    return m.installs.map((rec) => {
      const t = targetById(rec.id, rec.scope === 'project') || { id: rec.id, label: rec.id };
      // rec.path is the skill dir (.../skills/zoom-in); the skills dir is its parent.
      return { target: t, skillsDirAbs: require('path').dirname(rec.path), scope: rec.scope, projectRoot: rec.projectRoot };
    });
  }

  if (opts.all) {
    // install to every known target (creates dirs as needed).
    const table = project ? require('./targets').PROJECT_TARGETS : require('./targets').GLOBAL_TARGETS;
    return table.map((t) => {
      const skillsDirAbs = project ? resolveProjectSkillsDir(t, projectRoot) : t.skillsDir;
      return { target: t, skillsDirAbs, scope: project ? 'project' : 'global', projectRoot: project ? projectRoot : undefined };
    });
  }

  // Default: install to every detected-available target.
  const detected = detectAvailable(project, projectRoot);
  if (!detected.length) {
    // Nothing detected — fall back to the most common defaults so a fresh
    // machine still gets a working install instead of a no-op.
    info('No editors detected. Installing to default targets: cursor, claude, agents.');
    const defaults = ['cursor', 'claude', 'agents'];
    return defaults.map((id) => {
      const t = targetById(id, project);
      const skillsDirAbs = project ? resolveProjectSkillsDir(t, projectRoot) : t.skillsDir;
      return { target: t, skillsDirAbs, scope: project ? 'project' : 'global', projectRoot: project ? projectRoot : undefined };
    }).filter(Boolean);
  }
  return detected.map((t) => ({
    target: t,
    skillsDirAbs: t.skillsDirAbs,
    scope: project ? 'project' : 'global',
    projectRoot: project ? projectRoot : undefined,
  }));
}

function installOne({ target, skillsDirAbs, scope, projectRoot }, opts) {
  const skillPath = path.join(skillsDirAbs, BUNDLED_SKILL_NAME);

  // Safety: refuse to clobber a foreign skill that isn't ours.
  if ((isDir(skillPath) || isSymlink(skillPath)) && !looksLikeOurSkill(skillPath)) {
    warn(`${target.label}: '${skillPath}' exists but is not the zoom-in skill. Skipped. Use --force to overwrite.`);
    if (!opts.force) return { id: target.id, scope, path: skillPath, method: null, skipped: true };
  }

  mkdirp(skillsDirAbs);

  let method;
  if (opts.link) {
    const used = linkOrCopy(CACHE_SKILL_DIR, skillPath);
    method = used; // 'link' or 'copy' (fallback)
    if (used === 'copy') {
      warn(`${target.label}: symlink not permitted — copied instead.`);
    }
  } else {
    rmrf(skillPath);
    copyTree(CACHE_SKILL_DIR, skillPath);
    method = 'copy';
  }

  manifest.addInstall(manifest.read(), {
    id: target.id, scope, path: skillPath, method, projectRoot,
  });

  ok(`${target.label} → ${skillPath} ${paint('dim', `[${method}]`)}`);
  return { id: target.id, scope, path: skillPath, method, skipped: false };
}

function runInstall(args, opts) {
  const isUpdate = !!opts.update;
  info(`${isUpdate ? 'Updating' : 'Installing'} zoom-in skill v${bundledVersion()}`);
  if (opts.dryRun) dim('(dry run — no files will change)');

  const targets = resolveTargets(args, opts);
  if (!targets.length) {
    warn('No targets selected.');
    return;
  }
  dim(`Targets: ${targets.map((t) => t.target.id).join(', ')}`);

  if (opts.dryRun) {
    for (const t of targets) {
      const skillPath = path.join(t.skillsDirAbs, BUNDLED_SKILL_NAME);
      dim(`would ${opts.link ? 'link' : 'copy'} → ${skillPath}`);
    }
    return;
  }

  stageCache();

  let installed = 0, skipped = 0;
  for (const t of targets) {
    if (isUpdate) {
      // For update, refresh the on-disk install from cache.
      const m = manifest.read();
      const existing = manifest.findInstall(m, (r) => r.path === path.join(t.skillsDirAbs, BUNDLED_SKILL_NAME));
      const useLink = existing && existing.method === 'link';
      const installOpts = { ...opts, link: useLink };
      const res = installOne(t, installOpts);
      res.skipped ? skipped++ : installed++;
    } else {
      const res = installOne(t, opts);
      res.skipped ? skipped++ : installed++;
    }
  }

  log('');
  ok(`${isUpdate ? 'Updated' : 'Installed'} zoom-in skill to ${installed} target${installed === 1 ? '' : 's'}${skipped ? `, ${skipped} skipped` : ''}.`);
  dim(`Staged cache: ${CACHE_SKILL_DIR}`);
  if (!isUpdate) {
    dim('Update later with: npx zoom-in update');
    dim('Remove with:      npx zoom-in uninstall');
  }
}

const log = (m) => process.stdout.write(`${m}\n`);

module.exports = { runInstall, stageCache, resolveTargets, installOne };
