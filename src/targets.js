'use strict';

const path = require('path');
const { HOME, exists, isDir, isSymlink, looksLikeOurSkill, BUNDLED_SKILL_NAME } = require('./util');

// Each "target" is an agent/editor that loads skills from a directory.
// `home` is the editor's config dir; `skillsDir` is where skill folders go.
// `scope` is 'global' (user-level) or 'project' (current repo's ./<editor>/skills).
//
// To support a new editor, add a row here. Everything else is data-driven.
const GLOBAL_TARGETS = [
  { id: 'cursor',   label: 'Cursor',              home: path.join(HOME, '.cursor'),         skillsDir: path.join(HOME, '.cursor', 'skills') },
  { id: 'claude',   label: 'Claude Code',         home: path.join(HOME, '.claude'),         skillsDir: path.join(HOME, '.claude', 'skills') },
  { id: 'agents',   label: 'Generic agents (Gemini CLI, Codex, OpenCode, Pi)',
                                                              home: path.join(HOME, '.agents'),         skillsDir: path.join(HOME, '.agents', 'skills') },
  { id: 'copilot',  label: 'GitHub Copilot / VS Code',
                                                              home: path.join(HOME, '.copilot'),        skillsDir: path.join(HOME, '.copilot', 'skills') },
  { id: 'cline',    label: 'Cline',               home: path.join(HOME, '.cline'),           skillsDir: path.join(HOME, '.cline', 'skills') },
  { id: 'gemini',   label: 'Gemini CLI (standalone)',
                                                              home: path.join(HOME, '.gemini'),         skillsDir: path.join(HOME, '.gemini', 'skills') },
];

// Project-level targets: <project>/.<editor>/skills/<skill>. Shared via the repo.
const PROJECT_TARGETS = [
  { id: 'cursor',  label: 'Cursor (project)',     skillsDir: '.cursor/skills' },
  { id: 'claude',  label: 'Claude Code (project)', skillsDir: '.claude/skills' },
  { id: 'agents',  label: 'Generic agents (project)', skillsDir: '.agents/skills' },
  { id: 'copilot', label: 'Copilot (project)',    skillsDir: '.copilot/skills' },
];

function targetById(id, project) {
  const table = project ? PROJECT_TARGETS : GLOBAL_TARGETS;
  return table.find((t) => t.id === id) || null;
}

function supportedIds(project) {
  const table = project ? PROJECT_TARGETS : GLOBAL_TARGETS;
  return table.map((t) => t.id);
}

// Resolve a project target's skillsDir to an absolute path.
function resolveProjectSkillsDir(target, projectRoot) {
  return path.resolve(projectRoot || process.cwd(), target.skillsDir);
}

// Detection: an editor is "available" if its config home exists OR its skills
// dir already exists. For project targets, we don't require the home to exist
// (the project may want to start using the editor now).
function detectAvailable(project, projectRoot) {
  const out = [];
  if (project) {
    for (const t of PROJECT_TARGETS) {
      out.push({ ...t, skillsDirAbs: resolveProjectSkillsDir(t, projectRoot) });
    }
    return out;
  }
  for (const t of GLOBAL_TARGETS) {
    const available = isDir(t.home) || isDir(t.skillsDir);
    if (available) out.push({ ...t, skillsDirAbs: t.skillsDir });
  }
  return out;
}

// Status of a single target for the `targets`/`list` commands.
function statusOf(target, skillsDirAbs) {
  const homeOk = target.home ? isDir(target.home) : null;
  const skillsDirOk = isDir(skillsDirAbs);
  const skillPath = path.join(skillsDirAbs, BUNDLED_SKILL_NAME);
  let skillState = 'absent';
  if (isSymlink(skillPath)) skillState = 'link';
  else if (isDir(skillPath)) skillState = looksLikeOurSkill(skillPath) ? 'copy' : 'unknown';
  return { homeOk, skillsDirOk, skillPath, skillState };
}

module.exports = {
  GLOBAL_TARGETS, PROJECT_TARGETS,
  targetById, supportedIds, resolveProjectSkillsDir,
  detectAvailable, statusOf,
};
