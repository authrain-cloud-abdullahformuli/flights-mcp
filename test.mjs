import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const UPSTREAM = ['ravinahp', 'Ravina Patel', 'ravinapatel738'];
const TEXT_EXTS = new Set(['.md', '.json', '.html', '.sh', '.yml', '.yaml', '.txt', '.py', '.toml', '.cff']);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'test.mjs' || entry === 'uv.lock' || entry === '__pycache__') continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) results.push(...walk(full));
    else if (TEXT_EXTS.has(extname(full))) results.push(full);
  }
  return results;
}

console.log('\n🔍 Flights MCP Server — Verification Suite\n');

// 1. Upstream cleanliness
console.log('📝 Upstream cleanliness');
const files = walk(ROOT);
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const rel = f.replace(ROOT + '/', '');
  for (const term of UPSTREAM) {
    test(`${rel} has no "${term}"`, () => {
      assert(!content.toLowerCase().includes(term.toLowerCase()),
        `Found "${term}" in ${rel}`);
    });
  }
}

// 2. Required files exist
console.log('\n📦 Required files');
const required = [
  'LICENSE',
  'README.md',
  'CITATION.cff',
  'MAINTAINERS.md',
  'pyproject.toml',
  'package.json',
  'src/flights/server.py',
  'src/flights/api/client.py'
];
for (const f of required) {
  test(`${f} exists`, () => {
    assert(statSync(join(ROOT, f)).isFile(), `Missing ${f}`);
  });
}

// 3. LICENSE check
console.log('\n🔐 License check');
const license = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
test('LICENSE mentions Abdullah Formuli', () => {
  assert(license.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in LICENSE');
});

// 4. README pointers
console.log('\n📖 README check');
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
test('README.md points to authrain-cloud-abdullahformuli/flights-mcp', () => {
  assert(readme.includes('authrain-cloud-abdullahformuli/flights-mcp'), 'Missing repo link in README.md');
});

// 5. pyproject.toml check
console.log('\n🐍 pyproject.toml check');
const pyproject = readFileSync(join(ROOT, 'pyproject.toml'), 'utf8');
test('pyproject.toml author is Abdullah Formuli', () => {
  assert(pyproject.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in pyproject.toml');
});
test('pyproject.toml points to authrain-cloud-abdullahformuli/flights-mcp', () => {
  assert(pyproject.includes('authrain-cloud-abdullahformuli/flights-mcp'), 'Missing repo URL in pyproject.toml');
});

// 6. package.json check
console.log('\n📦 package.json check');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
test('package.json author is Abdullah Formuli', () => {
  assert(pkg.author.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in package.json author');
});
test('package.json repository points to authrain-cloud-abdullahformuli/flights-mcp', () => {
  assert(pkg.repository.url.includes('authrain-cloud-abdullahformuli/flights-mcp'), 'Missing repo url in package.json');
});

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
