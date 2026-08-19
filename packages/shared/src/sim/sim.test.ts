import { describe, expect, it } from 'vitest'
import { TICK_HZ } from '../constants.js'
import {
  LANES,
  PALETTE,
  PATH_TILES,
  PROPS,
  REQUESTS,
  TECH,
  THEMES,
  TOWERS,
  WAVES,
  isBuildable,
  laneLength,
  themeFor,
} from '../content/index.js'
import {
  addPlayer,
  applyIntent,
  createGame,
  damageRequest,
  incomingMultiplier,
  passiveMultiplier,
  setRole,
  spawnRequest,
  step,
} from './index.js'
import { getRole } from '../content/index.js'
import type { GameState } from '../types.js'

function gameWithPlayer(role: Parameters<typeof setRole>[2] = 'hippo'): GameState {
  const state = createGame(20260819)
  addPlayer(state, 'p1', 'Tester')
  setRole(state, 'p1', role)
  return state
}

describe('content integrity', () => {
  it('every tower that requires a tech names a real tech node', () => {
    for (const tower of Object.values(TOWERS)) {
      if (tower.requires) expect(TECH[tower.requires], `${tower.id} -> ${tower.requires}`).toBeDefined()
    }
  })

  it('every tech prerequisite exists and every unlocked tower exists', () => {
    for (const node of Object.values(TECH)) {
      for (const req of node.requires) expect(TECH[req], `${node.id} needs ${req}`).toBeDefined()
      for (const t of node.unlocksTowers ?? []) expect(TOWERS[t], `${node.id} unlocks ${t}`).toBeDefined()
    }
  })

  it('every wave spawns only real request types into real lanes', () => {
    for (const wave of WAVES) {
      for (const group of wave.groups) {
        expect(REQUESTS[group.requestType], `${wave.name}: ${group.requestType}`).toBeDefined()
        expect(group.lane).toBeGreaterThanOrEqual(0)
        expect(group.lane).toBeLessThan(LANES.length)
      }
    }
  })

  it('every wave has a teaching note — an undesigned wave has nothing to teach', () => {
    for (const wave of WAVES) expect(wave.teaches.length, wave.name).toBeGreaterThan(10)
  })

  it('every level has its own wing, with a full palette and no missing tokens', () => {
    const base = Object.keys(PALETTE)
    for (let i = 0; i < THEMES.length; i++) {
      const { theme, palette } = themeFor(i)
      expect(theme.department.length, theme.id).toBeGreaterThan(4)
      expect(theme.motto.length, theme.id).toBeGreaterThan(10)
      for (const token of base) {
        expect(palette[token as keyof typeof palette], `${theme.id}.${token}`).toMatch(/^#[0-9a-f]{6}$/i)
      }
    }
  })

  it('there is a wing for every wave, and the wings look different', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(WAVES.length)
    const carpets = THEMES.map((_, i) => themeFor(i).palette.carpet)
    expect(new Set(carpets).size).toBe(THEMES.length)
  })

  it('clamps an out-of-range level rather than throwing', () => {
    expect(themeFor(-5).theme.id).toBe(THEMES[0]!.id)
    expect(themeFor(999).theme.id).toBe(THEMES[THEMES.length - 1]!.id)
  })

  it('never uses pure white or pure black — the palette rule, enforced', () => {
    for (let i = 0; i < THEMES.length; i++) {
      const palette = themeFor(i).palette
      for (const [token, value] of Object.entries(palette)) {
        expect(value.toLowerCase(), `${i}.${token}`).not.toBe('#ffffff')
        expect(value.toLowerCase(), `${i}.${token}`).not.toBe('#000000')
      }
    }
  })

  it('no piece of furniture sits on a lane', () => {
    const onLane = PROPS.filter((p) => PATH_TILES.has(p.tile.y * 40 + p.tile.x))
    expect(onLane.map((p) => `${p.sprite}@${p.tile.x},${p.tile.y}`)).toEqual([])
  })

  it('no two props occupy the same tile', () => {
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const p of PROPS) {
      const key = `${p.tile.x},${p.tile.y}`
      const existing = seen.get(key)
      if (existing) clashes.push(`${existing} vs ${p.sprite} at ${key}`)
      else seen.set(key, p.sprite)
    }
    expect(clashes).toEqual([])
  })

  it('the office is furnished but still playable', () => {
    expect(PROPS.length).toBeGreaterThan(80)
    expect(PROPS.filter((p) => p.blocks).length).toBeGreaterThan(30)
    // Partitions and signage must stay non-blocking or the floor closes up.
    expect(PROPS.filter((p) => !p.blocks).length).toBeGreaterThan(PROPS.filter((p) => p.blocks).length)
  })

  it('leaves room to build: the floor is not all path', () => {
    let buildable = 0
    for (let x = 0; x < 40; x++) for (let y = 0; y < 24; y++) if (isBuildable(x, y)) buildable++
    expect(buildable).toBeGreaterThan(400)
  })

  it('all three lanes are a similar length, so no lane is a free win', () => {
    const lengths = LANES.map((l) => laneLength(l.index))
    const min = Math.min(...lengths)
    const max = Math.max(...lengths)
    expect(max / min).toBeLessThan(1.35)
  })
})

describe('the combat model', () => {
  it('automation cannot touch an Expense Claim — this is the whole Travel & Claims joke', () => {
    const state = gameWithPlayer('rhino')
    const claim = spawnRequest(state, 'expense_claim', 2)
    const before = claim.hp
    damageRequest(state, claim, 500, 'automation')
    expect(claim.hp).toBe(before)
  })

  it('Travel & Claims multiplies against Expense Claims where nobody else can', () => {
    const state = gameWithPlayer('rhino')
    const a = spawnRequest(state, 'expense_claim', 2)
    const b = spawnRequest(state, 'expense_claim', 2)

    const asSpecialist = damageRequest(state, a, 20, 'specialist', 'rhino')
    const asWolf = damageRequest(state, b, 20, 'specialist', 'wolf')

    expect(asSpecialist).toBeGreaterThan(40)
    expect(asWolf).toBe(0)
  })

  it('a ticketing TRACKED status makes everything else hit harder', () => {
    const state = gameWithPlayer()
    const plain = spawnRequest(state, 'policy_question', 0)
    const tracked = spawnRequest(state, 'policy_question', 0)
    tracked.statuses.push({ kind: 'tracked', ticks: 100 })

    const plainDmg = damageRequest(state, plain, 10, 'human')
    const trackedDmg = damageRequest(state, tracked, 10, 'human')
    expect(trackedDmg).toBeCloseTo(plainDmg * 1.3, 5)
  })

  it('"Lost In The Beauty Of The Day" is healed by automation', () => {
    const state = gameWithPlayer()
    const req = spawnRequest(state, 'beauty_of_the_day', 0)
    req.hp = 50
    damageRequest(state, req, 40, 'automation')
    expect(req.hp).toBeGreaterThan(50)
  })

  it('Batman is immune to process damage — the ticketing system has no field for this', () => {
    const state = gameWithPlayer()
    const batman = spawnRequest(state, 'batman', 1)
    const before = batman.hp
    damageRequest(state, batman, 400, 'process')
    expect(batman.hp).toBe(before)
    damageRequest(state, batman, 100, 'human')
    expect(batman.hp).toBeLessThan(before)
  })

  it('Expense Claims split exactly once, and Receipt Required stops it', () => {
    const splitting = gameWithPlayer('rhino')
    const a = spawnRequest(splitting, 'expense_claim', 2)
    damageRequest(splitting, a, 300, 'process')
    expect(splitting.requests.length).toBe(2)
    damageRequest(splitting, a, 10, 'process')
    expect(splitting.requests.length).toBe(2)

    const blocked = gameWithPlayer('rhino')
    const b = spawnRequest(blocked, 'expense_claim', 2)
    b.splitBlocked = true
    damageRequest(blocked, b, 300, 'process')
    expect(blocked.requests.length).toBe(1)
  })
})

describe('social capital is paid for quality, never for volume', () => {
  it('awards Social Capital for an in-SLA resolve', () => {
    const state = gameWithPlayer()
    const req = spawnRequest(state, 'policy_question', 0)
    damageRequest(state, req, 9999, 'human')
    expect(state.socialCapital).toBe(REQUESTS.policy_question!.socialCapital)
  })

  it('awards nothing once the request has escalated', () => {
    const state = gameWithPlayer()
    const req = spawnRequest(state, 'policy_question', 0)
    req.escalated = true
    damageRequest(state, req, 9999, 'human')
    expect(state.socialCapital).toBe(0)
    expect(state.stats.resolved).toBe(1)
  })

  it('counts an early automation kill as a Tier-0 deflection', () => {
    const state = gameWithPlayer()
    const req = spawnRequest(state, 'leave_balance', 1)
    damageRequest(state, req, 9999, 'automation')
    expect(state.stats.deflected).toBe(1)
  })
})

describe('escalation', () => {
  it('escalates at SLA expiry and a payroll cutoff doubles instead of breaching', () => {
    const state = gameWithPlayer('wolf')
    state.phase = 'wave'
    const req = spawnRequest(state, 'payroll_discrepancy', 0)
    req.slaTicks = 1
    step(state)
    expect(req.escalated).toBe(true)
    expect(state.requests.filter((r) => r.type === 'payroll_discrepancy').length).toBe(2)
  })

  it('escalated requests move faster and hurt more on breach', () => {
    const calm = gameWithPlayer()
    calm.phase = 'wave'
    const a = spawnRequest(calm, 'policy_question', 0)
    a.progress = laneLength(0) - 0.01
    step(calm)
    const calmLoss = 100 - calm.morale

    const angry = gameWithPlayer()
    angry.phase = 'wave'
    const b = spawnRequest(angry, 'policy_question', 0)
    b.escalated = true
    b.progress = laneLength(0) - 0.01
    step(angry)
    const angryLoss = 100 - angry.morale

    expect(angryLoss).toBeGreaterThan(calmLoss)
  })

  it('ER cases drain Compliance, not Morale — a different fail state entirely', () => {
    const state = gameWithPlayer()
    state.phase = 'wave'
    const req = spawnRequest(state, 'er_case', 1)
    req.progress = laneLength(1) - 0.01
    step(state)
    expect(state.morale).toBe(100)
    expect(state.compliance).toBeLessThan(100)
  })
})

describe('stealth', () => {
  it('towers cannot target an unrevealed ER case', () => {
    const state = gameWithPlayer()
    state.budget = 9999
    expect(applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })).toBeNull()
    state.phase = 'wave'
    const req = spawnRequest(state, 'er_case', 1)
    req.progress = 6
    for (let i = 0; i < TICK_HZ * 3; i++) step(state)
    expect(req.revealed).toBe(false)
    expect(req.hp).toBe(req.maxHp)
  })
})

describe('build rules and the tech gate', () => {
  it('refuses to build a locked tower and explains why in HR language', () => {
    const state = gameWithPlayer()
    state.budget = 9999
    const err = applyIntent(state, 'p1', { t: 'build', tower: 'ticketing', tile: { x: 12, y: 6 } })
    expect(err).toContain('Ticketing System')
  })

  it('refuses to build on a lane and does not charge for the attempt', () => {
    const state = gameWithPlayer()
    state.budget = 500
    const err = applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 4, y: 4 } })
    expect(err).toBe('Cannot build there.')
    expect(state.budget).toBe(500)
  })

  it('the CFO says no when you are short on Social Capital', () => {
    const state = gameWithPlayer()
    state.socialCapital = 0
    const err = applyIntent(state, 'p1', { t: 'unlock', tech: 'kb' })
    expect(err).toContain('next quarter')
    expect(state.unlocked).not.toContain('kb')
  })

  it('unlocks when the case is made', () => {
    const state = gameWithPlayer()
    state.socialCapital = 100
    expect(applyIntent(state, 'p1', { t: 'unlock', tech: 'kb' })).toBeNull()
    expect(state.unlocked).toContain('kb')
    expect(state.socialCapital).toBe(100 - TECH.kb!.cost)
  })
})

describe('roles', () => {
  it('RHINO contributes nothing for the first 18 seconds, then a great deal', () => {
    const state = gameWithPlayer('rhino')
    state.phase = 'wave'
    const player = state.players.p1!

    state.waveTick = 5 * TICK_HZ
    expect(passiveMultiplier(state, player, null)).toBe(0)

    state.waveTick = 25 * TICK_HZ
    expect(passiveMultiplier(state, player, null)).toBeGreaterThan(2)
  })

  it('HIPPO ignores resistances entirely — rank is not evidence', () => {
    const state = gameWithPlayer('hippo')
    const claim = spawnRequest(state, 'expense_claim', 2)
    const before = claim.hp
    // Automation cannot touch an expense claim; seniority does not care.
    damageRequest(state, claim, 50, 'automation', undefined, true, true)
    expect(claim.hp).toBeLessThan(before)
  })

  it('MOUSE is ignored by requests and takes far less damage', () => {
    const state = gameWithPlayer('mouse')
    const player = state.players.p1!
    expect(incomingMultiplier(player)).toBeLessThan(0.6)
    expect(getRole('mouse').ignoredByRequests).toBe(true)
  })

  it('a second player on the same role takes an unclear-ownership penalty', () => {
    const state = gameWithPlayer('wolf')
    addPlayer(state, 'p2', 'Also Payroll')
    setRole(state, 'p2', 'wolf')
    expect(state.players.p1!.ownershipPenalty).toBe(1)
    expect(state.players.p2!.ownershipPenalty).toBeLessThan(1)
  })

  it('ZEBRA doubles damage on first contact and halves it afterwards', () => {
    const state = gameWithPlayer('zebra')
    const player = state.players.p1!
    const fresh = spawnRequest(state, 'policy_question', 0)
    expect(passiveMultiplier(state, player, fresh)).toBe(2)
    fresh.hp -= 1
    expect(passiveMultiplier(state, player, fresh)).toBe(0.5)
  })

  it('VIPER grows permanently stronger every time the team fails', () => {
    const state = gameWithPlayer('viper')
    const player = state.players.p1!
    const target = spawnRequest(state, 'policy_question', 0)
    const before = passiveMultiplier(state, player, target)
    state.breachedTypes.push('policy_question', 'policy_question')
    expect(passiveMultiplier(state, player, target)).toBeGreaterThan(before)
  })

  it('a channelled ultimate is interrupted the moment the hero moves', () => {
    const state = gameWithPlayer('donkey')
    state.phase = 'wave'
    expect(applyIntent(state, 'p1', { t: 'ability', key: 'R' })).toBeNull()
    const slot = state.players.p1!.abilities.find((a) => a.channelling >= 0 && a.id === 'full_extract')!
    expect(slot.channelling).toBeGreaterThan(0)
    applyIntent(state, 'p1', { t: 'move', x: 1, y: 0 })
    step(state)
    expect(slot.channelling).toBe(0)
  })
})

describe('determinism', () => {
  it('same seed and same intents produce byte-identical state', () => {
    const run = () => {
      const state = createGame(777)
      addPlayer(state, 'p1', 'A')
      setRole(state, 'p1', 'puffin')
      applyIntent(state, 'p1', { t: 'ready', value: true })
      for (let i = 0; i < 1200; i++) {
        if (i === 40) applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })
        if (i === 90) applyIntent(state, 'p1', { t: 'move', x: 1, y: 0.5 })
        step(state)
      }
      return JSON.stringify({ ...state, events: [] })
    }
    expect(run()).toBe(run())
  })

  it('a different seed produces a different run', () => {
    const run = (seed: number) => {
      const state = createGame(seed)
      addPlayer(state, 'p1', 'A')
      setRole(state, 'p1', 'puffin')
      applyIntent(state, 'p1', { t: 'ready', value: true })
      for (let i = 0; i < 1200; i++) step(state)
      return JSON.stringify({ ...state, events: [], seed: 0, rngState: 0 })
    }
    expect(run(1)).not.toBe(run(2))
  })
})

describe('a whole wave, headless', () => {
  it('wave 1 resolves to a steering phase and does not hang', () => {
    const state = createGame(42)
    addPlayer(state, 'p1', 'Solo')
    setRole(state, 'p1', 'puffin')
    applyIntent(state, 'p1', { t: 'ready', value: true })
    state.budget = 2000
    step(state)
    for (const tile of [
      { x: 3, y: 6 },
      { x: 10, y: 11 },
      { x: 20, y: 7 },
      { x: 30, y: 10 },
    ]) {
      applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile })
    }
    applyIntent(state, 'p1', { t: 'start_wave' })
    expect(state.phase).toBe('wave')

    let guard = 0
    while (state.phase === 'wave' && guard++ < TICK_HZ * 400) step(state)

    expect(guard).toBeLessThan(TICK_HZ * 400)
    expect(['steering', 'gameover']).toContain(state.phase)
    expect(state.stats.resolved + state.stats.breached).toBeGreaterThan(20)
  })

  it('an undefended run loses morale and ends — doing nothing is not a strategy', () => {
    const state = createGame(9)
    addPlayer(state, 'p1', 'Nobody')
    setRole(state, 'p1', 'donkey')
    applyIntent(state, 'p1', { t: 'ready', value: true })
    step(state)
    applyIntent(state, 'p1', { t: 'start_wave' })
    let guard = 0
    while (state.phase === 'wave' && guard++ < TICK_HZ * 400) step(state)
    expect(state.morale).toBeLessThan(100)
  })
})
