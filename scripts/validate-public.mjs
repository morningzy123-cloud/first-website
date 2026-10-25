import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('data/public.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const bundle = fs.readFileSync('data/public.bundle.js', 'utf8');
const fail = message => { throw new Error(message); };
if (data.markets?.length !== 4 || data.vehicles?.length !== 10) fail('Unexpected market or competitor count');
if (!html.includes('data/public.bundle.js') || !bundle.startsWith('window.MB_DATA = ')) fail('Missing public data bundle');
// Keep the private-name gate while avoiding literal private terms in public source.
const blockedNames = ['ZW1ncmFuZA==', 'ZW1ncm91bmQ=', '5ZCJ5Yip5bid6LGq', 'YXV0b2ludGVs', 'Z2VlbHk=']
  .map(value => Buffer.from(value, 'base64').toString('utf8'));
const publicText = (JSON.stringify(data) + html + app + bundle).toLowerCase();
if (blockedNames.some(name => publicText.includes(name.toLowerCase()))) fail('Private product name in published files');
const ids = new Set(data.sources.map(source => source.id));
if (ids.size !== data.sources.length) fail('Duplicate source ID');
for (const source of data.sources) if (!/^https:\/\//.test(source.url)) fail(`Unsafe source URL: ${source.id}`);
const visit = value => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.sourceIds)) for (const id of value.sourceIds) if (!ids.has(id)) fail(`Broken citation: ${id}`);
  Object.values(value).forEach(visit);
};
visit({ ...data, sources: [] });
if (data.competitorPools.find(pool => pool.marketCode === 'AE')?.entries.some(entry => entry.decisionStatus !== 'suggested')) fail('AE competitor governance changed');
if (!data.markets.find(market => market.code === 'KZ')?.basics?.taxImportAndPolicy?.value?.includes('16%')) fail('Incorrect KZ import VAT');
console.log(`PASS: 4 markets, 10 competitors, ${ids.size} sources`);
