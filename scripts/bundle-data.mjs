import { readFile, writeFile } from 'node:fs/promises';

const [input = 'data/autointel-v1.6.global.json', output = 'data/autointel-v1.6.bundle.js'] = process.argv.slice(2);
const data = JSON.parse(await readFile(input, 'utf8'));
await writeFile(output, `window.AUTOINTEL_DATA = ${JSON.stringify(data)};\n`, 'utf8');
console.log(`PASS bundled ${input} → ${output}`);

