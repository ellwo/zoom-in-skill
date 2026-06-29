'use strict'

// zoom-in CLI — zero-dependency argument parser + command dispatcher.
// Exports a function so the bin and tests can call it with argv.

const { bundledVersion, paint, fatal } = require('./util');
const { runInstall } = require('./install');
const { runUninstall } = require('./uninstall');
const { runList, runTargets } = require('./list');
const { runDoctor } = require('./doctor');

const HELP = `zoom-in — installable architectural-audit skill for AI coding agents

Usage:
  npx zoom-in install [targets...] [options]
  npx zoom-in update   [targets...] [options]
  npx zoom-in uninstall [targets...] [options]
  npx zoom-in list
  npx zoom-in targets [options]
  npx zoom-in doctor
  npx zoom-in --help | -h
  npx zoom-in --version | -v

Commands:
  install      Install the zoom-in skill into one or more editors.
               With no targets, installs into every detected editor.
  update       Re-apply the latest bundled skill to installed targets.
               With no targets, refreshes everything recorded in the manifest.
  uninstall    Remove the skill from targets. With no targets, removes all.
  list         Show where the skill is currently installed.
  targets      List supported editors and their detection status.
  doctor       Diagnose the local install: cache, manifest, every target
               (presence, symlink validity, version drift). Exits non-zero
               if any problem is found.

Targets (global):
  cursor       Cursor                         (~/.cursor/skills)
  claude       Claude Code                    (~/.claude/skills)
  agents       Gemini CLI / Codex / OpenCode  (~/.agents/skills)
  copilot      GitHub Copilot / VS Code       (~/.copilot/skills)
  cline        Cline                          (~/.cline/skills)
  gemini       Gemini CLI standalone          (~/.gemini/skills)

Options:
  --project            Install/uninstall into the current repo
                       (./.cursor/skills, ./.claude/skills, ...) so the skill
                       is shared with anyone who clones the project.
  --all                Install into every known target, detected or not.
  --link               Symlink to the staged cache instead of copying.
                       Single source of truth: \`npx zoom-in update\` then
                       refreshes all linked targets at once.
  --force              Overwrite a target that already contains a foreign skill.
  --dry-run            Show what would happen without changing anything.
  --project-root <dir> Project root for --project (default: current directory).
  -h, --help           Show this help.
  -v, --version        Show the installed skill version.

Examples:
  npx zoom-in install                 # install to all detected editors
  npx zoom-in install cursor claude   # just these two
  npx zoom-in install --link          # symlink for one-source updates
  npx zoom-in install --project       # share via the current repo
  npx zoom-in update                  # refresh all installed targets
  npx zoom-in uninstall               # remove everywhere
  npx zoom-in list                    # show current installs

Learn more: https://github.com/ellwo/zoom-in-skill
`;

function parseFlags(argv) {
  const opts = {
    project: false, all: false, link: false, force: false,
    dryRun: false, projectRoot: null,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-h': case '--help': opts.help = true; break;
      case '-v': case '--version': opts.version = true; break;
      case '--project': opts.project = true; break;
      case '--all': opts.all = true; break;
      case '--link': opts.link = true; break;
      case '--force': opts.force = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--project-root':
        opts.projectRoot = argv[++i];
        if (!opts.projectRoot) fatal('--project-root requires a directory argument.');
        break;
      default:
        if (a.startsWith('--')) fatal(`Unknown option: ${a}`);
        positional.push(a);
    }
  }
  return { opts, positional };
}

function cli(argv) {
  const { opts, positional } = parseFlags(argv);

  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }
  if (opts.version) {
    process.stdout.write(`zoom-in v${bundledVersion()}\n`);
    return;
  }

  const cmd = positional[0] || 'help';
  const rest = positional.slice(1);

  switch (cmd) {
    case 'install':
      runInstall(rest, opts);
      break;
    case 'update':
      runInstall(rest, { ...opts, update: true });
      break;
    case 'uninstall':
      runUninstall(rest, opts);
      break;
    case 'list':
      runList();
      break;
    case 'targets':
      runTargets(opts);
      break;
    case 'doctor': {
      const code = runDoctor();
      if (code) process.exitCode = code;
      break;
    }
    case 'help': case '':
      process.stdout.write(HELP);
      break;
    default:
      fatal(`Unknown command: ${cmd}\nRun 'zoom-in --help' for usage.`);
  }
}

module.exports = cli;
module.exports.HELP = HELP;
