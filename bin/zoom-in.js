#!/usr/bin/env node
'use strict';

// Entry point. All logic lives in src/ so it stays testable.
require('../src/cli.js')(process.argv.slice(2));
