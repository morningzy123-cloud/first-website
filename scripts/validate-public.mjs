import {validateFiles} from './weekly/core.mjs';
const data=validateFiles();
console.log(`PASS: 4 markets, ${data.vehicles.length} competitors, ${data.sources.length} sources; bundle and privacy checks passed`);
