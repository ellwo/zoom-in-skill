'use strict';

// Zero-dependency interactive prompt helpers (readline). Used to make
// `npx zoom-in install` ask the user for scope, editors, and method —
// matching the UX of established skill CLIs (vercel-labs/skills, aiskills,
// agent-skills-cli, …). When stdin is not a TTY (CI, piped), the caller falls
// back to non-interactive defaults so scripts keep working.
//
// Implementation note: we read stdin via a single readline interface and queue
// incoming lines. Each prompt consumes one queued line (or waits for the next
// 'line' event). This is robust for both real TTYs (one line at a time) and
// piped input (all lines arrive up-front) — naive sequential rl.question()
// drops buffered lines when piped.

const readline = require('readline');

function isInteractive() {
  if (process.env.ZOOMIN_FORCE_PROMPT) return true; // test hook
  if (process.env.ZOOMIN_NO_PROMPT) return false;
  return !!(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

let _rl = null;
let _lines = [];
let _waiting = null;
let _streamReady = false;

function _ensureStream() {
  if (_streamReady) return;
  _streamReady = true;
  _rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY,
  });
  _rl.on('line', (line) => {
    if (_waiting) {
      const w = _waiting;
      _waiting = null;
      w(line);
    } else {
      _lines.push(line);
    }
  });
  _rl.on('SIGINT', () => {
    process.stdout.write('\nCancelled.\n');
    process.exit(130);
  });
}

function closeRl() {
  if (_rl) {
    _rl.close();
    _rl = null;
    _streamReady = false;
    _lines = [];
    _waiting = null;
  }
}

// Write the prompt text, then resolve one line from stdin. Empty input falls
// back to `defaultValue` (used when the user presses Enter).
function ask(promptText, defaultValue) {
  return new Promise((resolve) => {
    _ensureStream();
    const suffix = defaultValue !== undefined && defaultValue !== '' ? ` [${defaultValue}] ` : ' ';
    process.stdout.write(`${promptText}${suffix}`);
    const consume = (raw) => {
      const v = (raw || '').trim();
      resolve(v === '' && defaultValue !== undefined && defaultValue !== '' ? defaultValue : v);
    };
    if (_lines.length) consume(_lines.shift());
    else _waiting = consume;
  });
}

// Single-select: options = [{value, label, hint?}]. Returns the chosen value.
async function askSelect(promptText, options, defaultValue) {
  process.stdout.write(`? ${promptText}\n`);
  const defaultIdx = options.findIndex((o) => o.value === defaultValue);
  options.forEach((o, i) => {
    const tag = i === defaultIdx ? ' (default)' : '';
    const hint = o.hint ? ` — ${o.hint}` : '';
    process.stdout.write(`  ${i + 1}) ${o.label}${hint}${tag}\n`);
  });
  const def = defaultIdx >= 0 ? String(defaultIdx + 1) : '';
  while (true) {
    const ans = await ask('Select', def);
    const idx = parseInt(ans, 10) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx < options.length) return options[idx].value;
    process.stdout.write(`  Please enter a number 1-${options.length}.\n`);
  }
}

// Multi-select: options = [{value, label, hint?, selected?, detected?}].
// Returns an array of chosen values. Accepts comma-separated numbers, "all",
// or Enter to accept the pre-selected (detected) defaults.
async function askMultiSelect(promptText, options) {
  process.stdout.write(`? ${promptText}\n`);
  options.forEach((o, i) => {
    const box = o.selected ? '[x]' : '[ ]';
    const det = o.detected ? ' (detected)' : '';
    const hint = o.hint ? ` — ${o.hint}` : '';
    process.stdout.write(`  ${i + 1}) ${box} ${o.label}${hint}${det}\n`);
  });
  const def = options
    .map((o, i) => (o.selected ? String(i + 1) : null))
    .filter(Boolean)
    .join(',');
  while (true) {
    const ans = await ask('Select (comma-separated, "all", or Enter for default)', def);
    const a = ans.trim().toLowerCase();
    let picks;
    if (a === 'all' || a === '*') picks = options.map((_, i) => i);
    else if (a === '') picks = options.map((o, i) => (o.selected ? i : -1)).filter((i) => i >= 0);
    else picks = a.split(',').map((s) => parseInt(s.trim(), 10) - 1);
    if (picks.length > 0 && picks.every((i) => Number.isInteger(i) && i >= 0 && i < options.length)) {
      return picks.map((i) => options[i].value);
    }
    process.stdout.write(`  Please enter comma-separated numbers 1-${options.length}, "all", or Enter.\n`);
  }
}

// Yes/no confirm. Empty input returns the default.
async function confirm(promptText, defaultValue = true) {
  const ans = await ask(`${promptText} [${defaultValue ? 'Y/n' : 'y/N'}]`, '');
  const a = ans.trim().toLowerCase();
  if (a === '') return defaultValue;
  return a === 'y' || a === 'yes';
}

module.exports = { isInteractive, ask, askSelect, askMultiSelect, confirm, closeRl };
