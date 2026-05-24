const { execFileSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const ignored = new Set(['node_modules']);

const collectJsFiles = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) collectJsFiles(path, files);
    else if (entry.endsWith('.js')) files.push(path);
  }
  return files;
};

const files = collectJsFiles(root);

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Checked ${files.length} backend JavaScript files.`);
