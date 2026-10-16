// Dependency-free content/routing regression checks. Browser layout QA is separate.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'docs/index.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'docs/portfolio.js'), 'utf8');
const elements = new Map();
const translated = [...html.matchAll(/data-i="([^"]+)"/g)].map(match => ({
  dataset: { i: match[1] }, innerHTML: '',
}));
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    hidden: false, innerHTML: '', textContent: '',
    setAttribute() {}, addEventListener() {}, focus() {}, scrollIntoView() {},
  });
  return elements.get(id);
}
const context = {
  document: { documentElement: { lang: '' }, title: '', getElementById: element, querySelectorAll: () => translated },
  window: { addEventListener() {}, scrollTo() {} }, location: { hash: '' },
};
vm.createContext(context);
vm.runInContext(js, context);
for (const language of ['ko', 'en']) {
  vm.runInContext(`lang = '${language}'; applyLanguage()`, context);
  for (const field of translated) assert.ok(field.innerHTML, `Missing translation: ${field.dataset.i}`);
  assert.equal(context.document.documentElement.lang, language);
  for (const id of ['silverbridge', 'aws', 'fee', 'freelance']) {
    context.location.hash = `#case/${id}`;
    vm.runInContext('route()', context);
    assert.equal(element('home-view').hidden, true);
    assert.equal(element('case-view').hidden, false);
    const content = element('case-view').innerHTML;
    assert.ok(content.includes('05 /'), `${id}: missing reflection`);
    assert.ok(!content.includes('undefined'), `${id}: undefined content`);
    assert.ok(content.includes('SOURCE INDEX'), `${id}: source links absent`);
    context.location.hash = `#case/${id}/verification`;
    vm.runInContext('route()', context);
  }
}
context.location.hash = '#work';
vm.runInContext('route()', context);
assert.equal(element('home-view').hidden, false);
assert.equal(element('case-view').hidden, true);
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate homepage IDs');
assert.ok(!html.includes('data-filter'), 'Retired generic project-filter UI remains');
assert.ok(!html.includes('sap-portfolio/README.md'), 'Unfinished SAP lab featured on homepage');
assert.ok(html.includes('https://doohoahn.com/'), 'Profile site is not linked');
console.log('PASS: 4 cases × 2 languages; chapter routes; source indexes; home return; translation keys; unique IDs; scope checks.');
