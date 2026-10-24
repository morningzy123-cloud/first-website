import { readFile } from 'node:fs/promises';

const [changedFilesPath] = process.argv.slice(2);
if (!changedFilesPath) {
  console.error('Usage: node check_update_scope.mjs <changed-files.txt>');
  process.exit(2);
}

const files = (await readFile(changedFilesPath, 'utf8'))
  .split(/\r?\n/)
  .map(value => value.trim())
  .filter(Boolean);

const allowed = [
  /^data\/autointel-v1\.6\.global\.json$/,
  /^data\/autointel-v1\.6\.bundle\.js$/,
  /^reports\/weekly\/\d{4}-\d{2}-\d{2}\.md$/
];

const held = files.filter(file => !allowed.some(pattern => pattern.test(file.replaceAll('\\', '/'))));
if (held.length) {
  held.forEach(file => console.error(`HOLD governed file change: ${file}`));
  process.exit(1);
}

console.log(`PASS automatic update scope (${files.length} file(s))`);
