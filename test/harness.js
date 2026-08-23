/* Crew Quest test harness.
 *
 * Why this exists: on 2026-08-23 the tape was rewritten correctly three times
 * and the app still showed the old destinations, because the destination list
 * was a SECOND hardcoded copy nobody re-read. Zev found it on his phone, in a
 * parking lot, with the kids in the car. Nothing ships again without running
 * here first.
 *
 * It loads the REAL <script> out of index.html against a stub DOM and drives
 * the app's own functions. It does not re-implement any app logic -- a test
 * that reimplements the thing it tests cannot fail.
 */
const fs = require('fs');
const path = require('path');

function makeEl(id) {
  const el = {
    id, value: '', textContent: '', innerHTML: '', className: '',
    dataset: {}, style: {}, children: [],
    focus() {}, scrollIntoView() {},
    appendChild(c) { this.children.push(c); this.innerHTML += (c.innerHTML || ''); },
    addEventListener() {},
  };
  return el;
}

function loadApp(htmlPath, opts = {}) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  // the app's own inline script, verbatim
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const src = scripts.join('\n');

  const store = Object.assign({}, opts.localStorage || {});
  const els = {};
  const doc = {
    getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
    createElement(tag) { return makeEl('<' + tag + '>'); },
    addEventListener() {},
    querySelector() { return null },
    querySelectorAll() { return [] },
    get hidden() { return false },
  };
  const sandbox = {
    document: doc,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { vibrate: () => {} },
    fetch: () => Promise.reject(new Error('no network in tests')),
    speechSynthesis: undefined,
    location: { reload() { sandbox.__reloaded = true; } },
    window: null,
    addEventListener() {},
    removeEventListener() {},
    scrollTo() {},
    open() {},
    alert() {},
    console,
    setTimeout, clearTimeout, Date, Math, JSON, String, Number, Object, Array, RegExp, parseInt, parseFloat, isNaN,
    __els: els, __store: store,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  const vm = require('vm');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx, { filename: 'index.html<script>' });
  return ctx;
}

/* ── assertions ─────────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  PASS | ' + name); }
  else { fail++; failures.push(name + (detail ? ' | ' + detail : '')); console.log('  FAIL | ' + name + (detail ? ' | ' + detail : '')); }
}
function done(label) {
  console.log('\n' + label + ': ' + pass + '/' + (pass + fail) + ' passed');
  if (fail) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

module.exports = { loadApp, check, done, makeEl };
