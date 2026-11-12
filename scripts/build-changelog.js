/**
 * build-changelog.js
 * Genera src/constants/changelog.json a partir de CHANGELOG.md (única fuente de verdad).
 * Uso: node scripts/build-changelog.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace(/^﻿/, '');

const versions = [];
let version = null;
let section = null;

const clean = (text) => text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`/g, '').trim();

for (const rawLine of md.split(/\r?\n/)) {
  const line = rawLine.trimEnd();
  const v = line.match(/^## \[(.+?)\]\s*—\s*(.+)$/);
  if (v) {
    version = { version: v[1], date: v[2], sections: [] };
    versions.push(version);
    section = null;
    continue;
  }
  if (!version) continue;
  const s = line.match(/^### (.+)$/);
  if (s) {
    section = { title: s[1].trim(), items: [] };
    version.sections.push(section);
    continue;
  }
  const item = line.match(/^\s*[-*] (.+)$/);
  if (item && section) section.items.push(clean(item[1]));
}

const out = path.join(root, 'src', 'constants', 'changelog.json');
fs.writeFileSync(out, JSON.stringify(versions, null, 2) + '\n', 'utf8');
console.log(`changelog.json: ${versions.length} versiones`);
