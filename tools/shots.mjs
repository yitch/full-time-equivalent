/**
 * Screenshot harness for the README.
 *
 * Drives a headless Chrome over the DevTools protocol using only `ws`, which the
 * server already depends on — a screenshot script is not worth adding Playwright
 * and a 300MB browser download to the repo for.
 *
 * Usage: node tools/shots.mjs            (expects the dev server on :5173)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import WebSocket from 'ws'

const APP = process.env.FTE_URL ?? 'http://localhost:5173'
const OUT = join(process.cwd(), 'docs', 'media')
const PORT = 9333
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

mkdirSync(OUT, { recursive: true })

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    '--user-data-dir=/tmp/fte-shots',
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

process.on('exit', () => chrome.kill())

async function waitForDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools never came up')
}

class Tab {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw))
      const resolve = this.pending.get(msg.id)
      if (resolve) {
        this.pending.delete(msg.id)
        resolve(msg.result ?? msg.error)
      }
    })
  }

  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve) => {
      this.pending.set(id, resolve)
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    })
    return result?.result?.value
  }

  async shot(name) {
    const result = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    if (!result?.data) throw new Error(`no screenshot data for ${name}`)
    const file = join(OUT, `${name}.png`)
    writeFileSync(file, Buffer.from(result.data, 'base64'))
    console.log('  saved', file)
  }
}

async function openTab(url, width, height) {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  const info = await res.json()
  const ws = new WebSocket(info.webSocketDebuggerUrl, { perMessageDeflate: false })
  await new Promise((r) => ws.on('open', r))
  const tab = new Tab(ws)
  await tab.send('Page.enable')
  await tab.send('Runtime.enable')
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false,
  })
  return tab
}

// ── the scripted playthrough the screenshots are taken from ────────────────

const JOIN = `
  const click = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  const input = document.querySelector('input');
  setter.call(input, 'Yitch'); input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 300));
  click(btn('CLOCK IN'));
  await new Promise((r) => setTimeout(r, 1600));
  return 'joined';
`

const PICK_AND_READY = (animal) => `
  const click = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
  click([...document.querySelectorAll('.role-card')].find((c) => c.textContent.includes('${animal}')));
  await new Promise((r) => setTimeout(r, 400));
  click(btn('READY'));
  await new Promise((r) => setTimeout(r, 2000));
  return 'ready';
`

const BUILD_AND_START = `
  const click = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
  const board = document.querySelector('.board');
  const rect = board.getBoundingClientRect();
  const scale = rect.width / 640;
  click(document.querySelectorAll('.build-card')[0]);
  await new Promise((r) => setTimeout(r, 200));
  for (const [x, y] of [[5,6],[11,6],[17,7],[23,6],[29,7],[7,14],[13,13],[19,12],[25,13],[31,14],[9,3],[27,3]]) {
    board.dispatchEvent(new MouseEvent('click', { bubbles: true,
      clientX: rect.left + (x + 0.5) * 16 * scale, clientY: rect.top + (y + 0.5) * 16 * scale }));
    await new Promise((r) => setTimeout(r, 60));
  }
  click(btn('BEGIN'));
  return 'started';
`

const SKIP_TUTORIAL = `
  const b = [...document.querySelectorAll('.tut button')].find((x) => x.textContent.includes('skip the tour'));
  if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return 'skipped';
`

async function main() {
  await waitForDevtools()
  console.log('chrome up')

  // 1. Character select — the roster, all fourteen animals with their locks.
  const lobby = await openTab(APP, 1400, 1420)
  await sleep(2500)
  await lobby.evaluate(`localStorage.removeItem('fte.tutorial.v3'); return 1;`)
  await lobby.evaluate(JOIN)
  await sleep(1200)
  console.log('character select')
  await lobby.shot('characters')

  // 2. Gameplay — mid wave, tutorial dismissed so the floor is visible.
  const game = await openTab(APP, 1440, 880)
  await sleep(2500)
  await game.evaluate(JOIN)
  await game.evaluate(PICK_AND_READY('HIPPO'))
  await game.evaluate(SKIP_TUTORIAL)
  await sleep(400)
  await game.evaluate(BUILD_AND_START)

  // Play a couple of waves first: wave one is a handful of trivia and makes a
  // dull advert. Wave three has payroll, policy questions and real pressure.
  const AUTO = `
    const click = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
    const card = document.querySelector('.review-card');
    if (card) click(card);
    click(btn('NEXT WAVE')); click(btn('BEGIN'));
    const m = document.body.innerText.match(/WAVE (\\d)\\/9/);
    return m ? m[1] : '0';
  `
  for (let i = 0; i < 150; i++) {
    const wave = await game.evaluate(AUTO)
    if (wave === '3') break
    await sleep(1000)
  }

  // Dismiss whatever card is up and wait until requests are actually walking:
  // a briefing overlay across the floor makes a poor screenshot of the floor.
  await game.evaluate(`
    const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
    const card = document.querySelector('.review-card');
    if (card) card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const b = btn('BEGIN') ?? btn('NEXT WAVE');
    if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return 1;
  `)
  for (let i = 0; i < 40; i++) {
    await sleep(1000)
    const clean = await game.evaluate(
      `return (!document.querySelector('.overlay') && !document.querySelector('.tut')) ? 1 : 0;`,
    )
    if (clean && i > 8) break
  }
  console.log('gameplay')
  await game.shot('gameplay')

  // 3. The induction, on the same board.
  await game.evaluate(`
    localStorage.setItem('fte.tutorial.v3', JSON.stringify({ step: 0, skipped: false }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    return 1;
  `)
  await sleep(900)
  await game.shot('onboarding')
  await game.evaluate(SKIP_TUTORIAL)

  // 4. Research — the tech tree, opened from a locked defence.
  await game.evaluate(`
    const locked = [...document.querySelectorAll('.build-card.locked')];
    const target = locked.find((c) => c.textContent.includes('RPA Bot')) ?? locked[0];
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 700));
    document.querySelector('.panel.wide')?.scrollTo({ top: 0 });
    return 1;
  `)
  await sleep(700)
  await game.shot('research')
  await game.evaluate(`document.querySelector('.overlay')?.dispatchEvent(new MouseEvent('click',{bubbles:true})); return 1;`)

  // 5. The establishment, with the three ways to get more headcount.
  await game.evaluate(`
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
    return 1;
  `)
  await sleep(800)
  await game.shot('headcount')
  await game.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true })); return 1;`)

  // 6. Performance review — wait for the wave to end.
  console.log('waiting for the performance review…')
  for (let i = 0; i < 40; i++) {
    await sleep(1500)
    const ready = await game.evaluate(`return !!document.querySelector('.review-card');`)
    if (ready) break
  }
  await game.shot('review')

  // 7. Character sheet.
  await game.evaluate(`
    const card = document.querySelector('.review-card');
    if (card) card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    return 1;
  `)
  await sleep(900)
  await game.shot('character-sheet')

  console.log('done')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
