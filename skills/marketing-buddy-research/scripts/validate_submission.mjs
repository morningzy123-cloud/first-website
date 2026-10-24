import { readFile } from 'node:fs/promises';

const [inputPath] = process.argv.slice(2);
if (!inputPath) {
  console.error('Usage: node validate_submission.mjs <data.json>');
  process.exit(2);
}

const errors = [];
const warnings = [];
let data;

try {
  data = JSON.parse(await readFile(inputPath, 'utf8'));
} catch (error) {
  console.error(`FAIL invalid JSON: ${error.message}`);
  process.exit(1);
}

const allowedMarkets = new Set(['MX', 'KZ', 'SA', 'AE']);
const sources = Array.isArray(data.sources) ? data.sources : [];
const sourceIds = new Set();

for (const source of sources) {
  if (!source?.id) errors.push('Source without id');
  else if (sourceIds.has(source.id)) errors.push(`Duplicate source id: ${source.id}`);
  else sourceIds.add(source.id);
  if (!source?.url || !source?.publisher || !source?.sourceType || !source?.accessedAt) {
    errors.push(`Incomplete source metadata: ${source?.id || '(unknown)'}`);
  }
  if (source?.marketCode && !allowedMarkets.has(source.marketCode)) {
    errors.push(`Unknown source marketCode: ${source.marketCode}`);
  }
}

const visit = (value, path = '$') => {
  if (!value || typeof value !== 'object') return;
  if (value.marketCode && !allowedMarkets.has(value.marketCode)) {
    errors.push(`Unknown marketCode at ${path}: ${value.marketCode}`);
  }
  if (Array.isArray(value.sourceIds)) {
    for (const id of value.sourceIds) {
      if (!sourceIds.has(id)) errors.push(`Missing source reference at ${path}: ${id}`);
    }
  }
  if (value.status === 'confirmed') {
    if (!Array.isArray(value.sourceIds) || value.sourceIds.length === 0) {
      errors.push(`Confirmed item without sourceIds at ${path}`);
    }
    if (('value' in value || 'amount' in value) && !value.verifiedAt) {
      errors.push(`Confirmed fact without verifiedAt at ${path}`);
    }
  }
  for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
};

visit(data);

for (const [index, market] of (data.markets || []).entries()) {
  if (!allowedMarkets.has(market.code)) errors.push(`Unknown market code at markets[${index}]: ${market.code}`);
  const policy = market?.basics?.taxImportAndPolicy;
  if (!policy?.status) {
    errors.push(`Missing policy/customs checkpoint for market ${market.code || index}`);
  } else if (policy.status === 'not_found' && (!policy.note || policy.note.length < 25)) {
    warnings.push(`Policy/customs not_found note needs a fuller search log for ${market.code}`);
  }
}

if (!data.researchRun?.runId || !data.researchRun?.startedAt || !data.researchRun?.status) {
  errors.push('Missing researchRun metadata');
}

if (warnings.length) warnings.forEach(item => console.warn(`WARN ${item}`));
if (errors.length) {
  errors.forEach(item => console.error(`FAIL ${item}`));
  console.error(`Submission rejected with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`PASS ${inputPath}`);
console.log(`Sources: ${sources.length}; markets: ${(data.markets || []).length}; evidence references resolved.`);
