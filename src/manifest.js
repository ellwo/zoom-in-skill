'use strict';

const fs = require('fs');
const { HOME_DIR, MANIFEST_PATH, exists, mkdirp, bundledVersion } = require('./util');

// Manifest schema (~/.zoom-in/manifest.json):
// {
//   "version": "1.0.0",
//   "installMethod": "copy",
//   "installs": [
//     { "id": "cursor", "scope": "global", "path": "/.../zoom-in", "method": "copy", "installedAt": 123 }
//   ]
// }
//
// `installs` is an array (not a map) so global + project installs with the
// same editor id can coexist without key collisions.

function empty() {
  return { version: bundledVersion(), installMethod: 'copy', installs: [] };
}

function read() {
  if (!exists(MANIFEST_PATH)) return empty();
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (!data || typeof data !== 'object') return empty();
    if (!Array.isArray(data.installs)) data.installs = [];
    if (typeof data.installMethod !== 'string') data.installMethod = 'copy';
    return data;
  } catch (_) {
    return empty();
  }
}

function write(manifest) {
  mkdirp(HOME_DIR);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function keyOf(rec) {
  return `${rec.scope || 'global'}:${rec.path}`;
}

// Add or update an install record, deduped by scope+path.
function addInstall(manifest, rec) {
  const key = keyOf(rec);
  manifest.installs = manifest.installs.filter((r) => keyOf(r) !== key);
  manifest.installs.push({
    id: rec.id,
    scope: rec.scope || 'global',
    path: rec.path,
    method: rec.method || 'copy',
    projectRoot: rec.projectRoot || undefined,
    installedAt: Date.now(),
  });
  manifest.version = bundledVersion();
  if (rec.method) manifest.installMethod = rec.method;
  write(manifest);
}

function removeInstall(manifest, rec) {
  const key = keyOf(rec);
  manifest.installs = manifest.installs.filter((r) => keyOf(r) !== key);
  write(manifest);
}

function findInstall(manifest, predicate) {
  return manifest.installs.find(predicate) || null;
}

module.exports = { empty, read, write, addInstall, removeInstall, findInstall, keyOf };
