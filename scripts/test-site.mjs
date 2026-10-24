import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const dataCode = await readFile('data/autointel-v1.6.bundle.js', 'utf8');
const appCode = await readFile('app.js', 'utf8');
const makeClassList = () => ({ add() {}, remove() {}, toggle() {} });
const makeElement = () => ({ innerHTML: '', textContent: '', dataset: {}, classList: makeClassList(), addEventListener() {}, showModal() {}, close() {} });
const elements = new Map(['#app', '#breadcrumb', '#mobileMenu', '#drawerBackdrop', '#helpButton', '#closeHelp', '#helpDialog', '.sidebar'].map(key => [key, makeElement()]));
const navItems = ['overview', 'market', 'pool'].map(route => ({ dataset: { route }, classList: makeClassList() }));
const context = vm.createContext({
  console, Intl, setTimeout, clearTimeout, location: { hash: '' },
  document: {
    querySelector: selector => elements.get(selector) || makeElement(),
    querySelectorAll: selector => selector === '.nav-item' ? navItems : []
  }
});
context.window = context;
context.window.addEventListener = () => {};
context.window.scrollTo = () => {};
vm.runInContext(dataCode, context);
vm.runInContext(appCode, context);
await new Promise(resolve => setTimeout(resolve, 0));

const app = elements.get('#app');
const routes = [
  ['#/overview', ['全球营销情报', '已完成市场', '政策与竞争环境']],
  ['#/market/MX', ['墨西哥市场', '价格 × 车身长度 × 销量']],
  ['#/market/KZ', ['哈萨克斯坦市场']],
  ['#/market/SA', ['沙特阿拉伯市场']],
  ['#/market/AE', ['阿联酋市场']],
  ['#/pool', ['竞品池', '四国竞品配置']]
];
for (const [hash, phrases] of routes) {
  context.location.hash = hash;
  vm.runInContext('router()', context);
  for (const phrase of phrases) if (!app.innerHTML.includes(phrase)) throw new Error(`${hash} missing: ${phrase}`);
  if (app.innerHTML.includes('数据文件未能加载')) throw new Error(`${hash} failed to render`);
  console.log(`PASS ${hash}`);
}

const data = context.AUTOINTEL_DATA;
for (const market of data.markets) {
  if (market.basics.summary.status !== 'confirmed') throw new Error(`${market.code} baseline is not confirmed`);
}
console.log(`PASS four-country production baseline (${data.sources.length} sources)`);

