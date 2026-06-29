#!/usr/bin/env node
'use strict';

// Entry point. All logic lives in src/ so it stays testable.
// cli() is async (interactive install prompts), so await it and surface
// any rejection as a non-zero exit.
const cli = require('../src/cli.js');
Promise.resolve(cli(process.argv.slice(2))).catch((e) => {
  if (e && e.message) process.stderr.write(`\x1b[31m✗\x1b[0m ${e.message}\n`);
  process.exitCode = process.exitCode || 1;
});
