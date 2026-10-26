import {validateFiles} from './weekly/core.mjs';
const data=validateFiles();
console.log(`PASS: 4 markets, 10 competitors, ${data.sources.length} sources; bundle and privacy checks passed`);
