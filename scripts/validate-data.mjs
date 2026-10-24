import { readFile } from 'node:fs/promises';

const [input = 'data/autointel-v1.6.global.json'] = process.argv.slice(2);
const data = JSON.parse(await readFile(input, 'utf8'));
const errors = [];
const allowedMarkets = new Set(['MX', 'KZ', 'SA', 'AE']);
const sourceIds = new Set();

for (const source of data.sources || []) {
  if (!source.id) errors.push('Source without id');
  else if (sourceIds.has(source.id)) errors.push(`Duplicate source id: ${source.id}`);
  else sourceIds.add(source.id);
  if (!source.url || !source.publisher || !source.sourceType || !source.accessedAt) {
    errors.push(`Incomplete source: ${source.id || '(unknown)'}`);
  }
}

const visit = (value, path = '$') => {
  if (!value || typeof value !== 'object') return;
  if (value.marketCode && !allowedMarkets.has(value.marketCode)) errors.push(`Unknown marketCode at ${path}`);
  if (Array.isArray(value.sourceIds)) {
    for (const id of value.sourceIds) if (!sourceIds.has(id)) errors.push(`Missing source ${id} at ${path}`);
  }
  if (value.status === 'confirmed') {
    if (!Array.isArray(value.sourceIds) || !value.sourceIds.length) errors.push(`Confirmed item without source at ${path}`);
    if (('value' in value || 'amount' in value) && !value.verifiedAt) errors.push(`Confirmed fact without verifiedAt at ${path}`);
  }
  for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
};
visit(data);

if ((data.markets || []).length !== 4) errors.push('Production data must contain exactly four markets');
for (const market of data.markets || []) {
  if (!allowedMarkets.has(market.code)) errors.push(`Unknown market: ${market.code}`);
  if (market.basics?.summary?.status !== 'confirmed') errors.push(`Market baseline incomplete: ${market.code}`);
  if (market.basics?.taxImportAndPolicy?.status !== 'confirmed') errors.push(`Policy/customs baseline incomplete: ${market.code}`);
  if (!market.emgrandLocalProfile?.vehicleId) errors.push(`Missing EMGRAND profile: ${market.code}`);
}

const vehicleIds = new Set((data.vehicles || []).map(vehicle => vehicle.id));
for (const pool of data.competitorPools || []) {
  for (const entry of pool.entries || []) if (!vehicleIds.has(entry.vehicleId)) errors.push(`Pool references missing vehicle: ${entry.vehicleId}`);
}

if (errors.length) {
  errors.forEach(error => console.error(`FAIL ${error}`));
  process.exit(1);
}
console.log(`PASS ${input}: ${data.markets.length} markets, ${data.vehicles.length} vehicles, ${data.sources.length} sources`);

