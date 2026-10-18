// Pulls real excerpts (with their real line numbers) out of src/reel-core.js
// for the code-editor scene of the vertical reel -> remotion/code.json
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = 'src/reel-core.js';
const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n');

// [first line that starts the excerpt, number of lines]
const EXCERPTS = [
  ['const E = {', 9],
  ['function impact(t) {', 5],
  ['function revealText(', 24],
  ['function sceneIgnition(ctx, t) {', 21],
  ['function renderAt(t0,', 21],
];

const lines = [];
for (const [start, count] of EXCERPTS) {
  const i = src.findIndex(l => l.trimStart().startsWith(start));
  if (i < 0) throw new Error(`excerpt not found: ${start}`);
  const indent = src[i].length - src[i].trimStart().length;
  if (lines.length) lines.push({ n: null, text: '' });
  for (let k = i; k < i + count; k++) lines.push({ n: k + 1, text: src[k].slice(indent) });
}
fs.writeFileSync(path.join(ROOT, 'remotion/code.json'), JSON.stringify({ file: path.basename(FILE), lines }, null, 1));
console.log(`wrote remotion/code.json (${lines.length} lines, ${lines.reduce((s, l) => s + l.text.length, 0)} chars)`);
