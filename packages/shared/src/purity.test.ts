import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The shared package runs in three places: a browser, a Node server, and Vitest.
 * So the sim and its content must not touch Node APIs or the DOM.
 *
 * This used to be enforced by accident — the package had no `@types/node`, so
 * using `process` was a compile error. That guard was worthless (it said nothing
 * about `document`, and a `node:` import would have failed with a different
 * error) and it broke a production deploy the first time an install layout
 * changed. So it is a real test now, and it names the exception explicitly.
 */

const SRC = fileURLToPath(new URL('.', import.meta.url))

/** The only Node-only corner: a CLI harness never imported by src/index.ts. */
const NODE_ONLY = ['tools']

/**
 * Blanks out string literals and comments so the checks below read *code*.
 * Without this, "Has a document. The document has dates." trips a search for
 * `document.` — the flavour text in this game is unusually hostile to grep.
 */
function codeOnly(body: string): string[] {
  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return ''
      return line
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, '``')
        .replace(/\/\/.*$/, '')
    })
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (NODE_ONLY.includes(entry)) continue
      sourceFiles(full, acc)
      continue
    }
    if (!entry.endsWith('.ts')) continue
    if (entry.endsWith('.test.ts')) continue
    acc.push(full)
  }
  return acc
}

describe('the shared package stays portable', () => {
  const files = sourceFiles(SRC)

  it('finds the source it is supposed to be checking', () => {
    expect(files.length).toBeGreaterThan(15)
  })

  it('imports nothing from node:', () => {
    const offenders: string[] = []
    for (const file of files) {
      const body = readFileSync(file, 'utf8')
      if (/from\s+['"]node:/.test(body) || /require\(['"]node:/.test(body)) {
        offenders.push(relative(SRC, file))
      }
    }
    expect(offenders, 'move Node-only code into src/tools/').toEqual([])
  })

  it('touches no DOM or browser globals', () => {
    // Matched as *usage*, not as a word: this file is full of prose about
    // maintenance windows and one-page documents, and "a document" is flavour
    // text while `document.querySelector` is a portability bug.
    const banned: [string, RegExp][] = [
      ['document', /\bdocument\s*\./],
      ['window', /\bwindow\s*\./],
      ['localStorage', /\blocalStorage\s*\./],
      ['sessionStorage', /\bsessionStorage\s*\./],
      ['navigator', /\bnavigator\s*\./],
      ['location', /\blocation\s*\./],
      ['fetch', /(^|[^.\w])fetch\s*\(/],
      ['HTMLElement', /\bHTMLElement\b/],
    ]
    const offenders: string[] = []
    for (const file of files) {
      const lines = codeOnly(readFileSync(file, 'utf8'))
      for (const [name, pattern] of banned) {
        const hit = lines.find((line) => pattern.test(line))
        if (hit) offenders.push(`${relative(SRC, file)} uses ${name}: ${hit.trim().slice(0, 60)}`)
      }
    }
    expect(offenders, 'the sim must run headless').toEqual([])
  })

  it('keeps Math.random and Date out of the simulation', () => {
    const simFiles = files.filter((f) => f.includes('/sim/') || f.includes('/content/'))
    const offenders: string[] = []
    for (const file of simFiles) {
      for (const code of codeOnly(readFileSync(file, 'utf8'))) {
        if (/Math\.random\s*\(/.test(code)) offenders.push(`${relative(SRC, file)}: Math.random`)
        if (/Date\.now\s*\(/.test(code)) offenders.push(`${relative(SRC, file)}: Date.now`)
      }
    }
    expect(offenders, 'use the seeded RNG in src/rng.ts').toEqual([])
  })

  it('never exports the Node-only tools from the package entry point', () => {
    const index = readFileSync(join(SRC, 'index.ts'), 'utf8')
    expect(index).not.toContain('./tools/')
  })
})
