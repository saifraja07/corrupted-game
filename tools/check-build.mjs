// Release guard for the production build (run after `npm run build`):
//   - the entry must NOT eagerly load the postprocessing library or any level scene (they are lazy)
//   - the initial download must stay within budget
//   - sounds and the favicon must be present
// Exits non-zero (by throwing) on any violation.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const DIST = new URL('../dist/', import.meta.url)
const INITIAL_GZIP_BUDGET_KB = 450

const read = (rel) => readFileSync(new URL(rel, DIST))
const problems = []

const html = read('index.html').toString('utf8')
const entryMatch = html.match(/src="[^"]*\/assets\/(index-[^"]+\.js)"/)
if (!entryMatch) throw new Error('Could not find the entry script in dist/index.html')

// Walk static imports (`from"./x.js"` / `import"./x.js"`), not dynamic import() calls.
const reachable = new Set()
function visit(file) {
  if (reachable.has(file)) return
  reachable.add(file)
  const code = read(`assets/${file}`).toString('utf8')
  for (const m of code.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) visit(m[1])
}
visit(entryMatch[1])

const assets = readdirSync(new URL('assets/', DIST)).filter((f) => f.endsWith('.js'))
const contains = (file, needle) => read(`assets/${file}`).toString('utf8').includes(needle)

const postFiles = assets.filter((f) => contains(f, 'ChromaticAberrationEffect'))
if (postFiles.length === 0) problems.push('Could not find the postprocessing code in any chunk (check changed?)')
for (const f of postFiles) if (reachable.has(f)) problems.push(`Entry loads postprocessing eagerly via ${f}`)

for (const f of assets.filter((n) => /^Level\d+-/.test(n))) {
  if (reachable.has(f)) problems.push(`Entry loads level chunk ${f} eagerly`)
}

const initialKb = [...reachable].reduce((sum, f) => sum + gzipSync(read(`assets/${f}`)).length, 0) / 1024
if (initialKb > INITIAL_GZIP_BUDGET_KB) problems.push(`Initial JS is ${initialKb.toFixed(0)} KB gzipped, over the ${INITIAL_GZIP_BUDGET_KB} KB budget`)

for (const f of ['favicon.svg', 'sounds/ui_click.wav', 'sounds/ambient_room.wav']) {
  if (!existsSync(new URL(f, DIST))) problems.push(`Missing ${f} in dist`)
}

console.log(`entry: ${entryMatch[1]}`)
console.log(`initial JS (static imports): ${reachable.size} chunks, ${initialKb.toFixed(0)} KB gzipped (budget ${INITIAL_GZIP_BUDGET_KB})`)
console.log(`lazy: postprocessing in [${postFiles.join(', ')}], ${assets.filter((n) => /^Level\d+-/.test(n)).length} level chunks`)
if (problems.length) throw new Error(`Build check failed:\n - ${problems.join('\n - ')}`)
console.log('build check passed')
