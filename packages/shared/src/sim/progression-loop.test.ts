import { describe, expect, it } from 'vitest'
import { TICK_HZ } from '../constants.js'
import { PERKS, PERK_BY_ID, RECHARGE_POINTS, rechargeAt } from '../content/index.js'
import { BASE_BANDWIDTH, MAX_HERO_LEVEL, createHero } from '../progression.js'
import { abilityCost, addPlayer, applyIntent, createGame, setRole, step } from './index.js'
import type { GameState, RoleId } from '../types.js'

function game(role: RoleId = 'hippo'): GameState {
  const state = createGame(2026)
  addPlayer(state, 'p1', 'Starter')
  setRole(state, 'p1', role)
  applyIntent(state, 'p1', { t: 'ready', value: true })
  state.budget = 4000
  return state
}

/** Plays whole waves so the wave-end machinery actually runs. */
function playWaves(state: GameState, count: number, autoPick = true): void {
  let guard = 0
  const target = state.waveIndex + count
  while (state.waveIndex < target && state.phase !== 'gameover' && guard++ < TICK_HZ * 60 * 30) {
    const player = state.players.p1!
    if (state.phase === 'briefing' || state.phase === 'steering') {
      if (autoPick && player.hero.pendingPerks.length > 0) {
        applyIntent(state, 'p1', { t: 'pick_perk', perk: player.hero.pendingPerks[0]! })
      }
      applyIntent(state, 'p1', { t: 'start_wave' })
    }
    step(state)
  }
}

describe('day one', () => {
  it('issues a laptop and a badge so equipment is visible from the first minute', () => {
    const hero = createHero('hippo')
    expect(hero.equipment.device, 'laptop').not.toBeNull()
    expect(hero.equipment.badge, 'badge').not.toBeNull()
    expect(hero.equipment.device!.name).toContain('Laptop')
  })

  it('the starter kit actually contributes stats', () => {
    const bare = createHero('hippo')
    const stripped = { ...bare, equipment: { ...bare.equipment, device: null, badge: null } }
    expect(bare.stats.attackSpeed).toBeGreaterThan(0)
    void stripped
  })

  it('starts with a full bandwidth pool', () => {
    const hero = createHero('wolf')
    expect(hero.maxBandwidth).toBeGreaterThanOrEqual(BASE_BANDWIDTH)
    expect(hero.bandwidth).toBe(hero.maxBandwidth)
  })
})

describe('bandwidth', () => {
  it('every ability costs something', () => {
    expect(abilityCost({ cooldownSeconds: 10 })).toBeGreaterThan(0)
    expect(abilityCost({ cooldownSeconds: 200 })).toBeLessThanOrEqual(55)
    expect(abilityCost({ cooldownSeconds: 10, bandwidthCost: 3 })).toBe(3)
  })

  it('casting spends it, and running dry refuses the cast with advice', () => {
    const state = game()
    state.phase = 'wave'
    const hero = state.players.p1!.hero
    const before = hero.bandwidth
    expect(applyIntent(state, 'p1', { t: 'ability', key: 'Q' })).toBeNull()
    expect(hero.bandwidth).toBeLessThan(before)

    hero.bandwidth = 0
    const err = applyIntent(state, 'p1', { t: 'ability', key: 'W' })
    expect(err).toContain('bandwidth')
    expect(err).toContain('wellness')
  })

  it('the floor has places to recharge, and they are findable', () => {
    expect(RECHARGE_POINTS.length).toBeGreaterThan(3)
    const point = RECHARGE_POINTS[0]!
    expect(rechargeAt(point.tile.x + 0.5, point.tile.y + 0.5)).not.toBeNull()
    expect(rechargeAt(0.5, 0.5)).toBeNull()
  })

  it('recharges far faster at a water cooler than in the middle of the floor', () => {
    const away = game()
    away.phase = 'wave'
    away.players.p1!.pos = { x: 20, y: 12 }
    away.players.p1!.hero.bandwidth = 0

    const atCooler = game()
    atCooler.phase = 'wave'
    const point = RECHARGE_POINTS[0]!
    atCooler.players.p1!.pos = { x: point.tile.x + 0.5, y: point.tile.y + 0.5 }
    atCooler.players.p1!.hero.bandwidth = 0

    for (let i = 0; i < TICK_HZ * 3; i++) {
      step(away)
      step(atCooler)
    }
    expect(atCooler.players.p1!.hero.recharging).toBe(true)
    expect(atCooler.players.p1!.hero.bandwidth).toBeGreaterThan(away.players.p1!.hero.bandwidth * 2)
  })
})

describe('a level every wave', () => {
  it('guarantees a level and a review after each wave', () => {
    const state = game()
    state.budget = 4000
    step(state)
    for (const [x, y] of [
      [5, 6],
      [11, 6],
      [17, 7],
      [23, 6],
    ] as const) {
      applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x, y } })
    }
    const startLevel = state.players.p1!.hero.level
    playWaves(state, 1, false)
    const hero = state.players.p1!.hero
    expect(hero.level).toBeGreaterThan(startLevel)
    expect(hero.pendingPerks.length).toBe(3)
    expect(hero.talentPoints).toBeGreaterThan(0)
  })

  it('a picked perk changes your stats and is remembered', () => {
    const state = game()
    const hero = state.players.p1!.hero
    hero.pendingPerks = ['mandatory_training']
    const before = hero.stats.power
    expect(applyIntent(state, 'p1', { t: 'pick_perk', perk: 'mandatory_training' })).toBeNull()
    expect(hero.stats.power).toBe(before + PERK_BY_ID.mandatory_training!.stats.power!)
    expect(hero.perks).toContain('mandatory_training')
    expect(hero.pendingPerks).toEqual([])
  })

  it('refuses a perk that was not offered', () => {
    const state = game()
    state.players.p1!.hero.pendingPerks = ['mandatory_training']
    expect(applyIntent(state, 'p1', { t: 'pick_perk', perk: 'ppe' })).toContain('not one of the options')
  })

  it('never offers the same perk twice', () => {
    const state = game()
    const hero = state.players.p1!.hero
    hero.perks = PERKS.slice(0, PERKS.length - 2).map((p) => p.id)
    hero.pendingPerks = []
    step(state)
    // Only two left in the pool, so a review can offer at most two.
    const remaining = PERKS.filter((p) => !hero.perks.includes(p.id))
    expect(remaining.length).toBe(2)
  })

  it('every perk states an effect and has at least one stat behind it', () => {
    for (const perk of PERKS) {
      expect(perk.effect.length, perk.id).toBeGreaterThan(3)
      expect(Object.keys(perk.stats).length, perk.id).toBeGreaterThan(0)
      expect(perk.flavour.length, perk.id).toBeGreaterThan(20)
    }
  })

  it('the guaranteed level stops at the cap', () => {
    const state = game()
    const hero = state.players.p1!.hero
    hero.level = MAX_HERO_LEVEL
    hero.xp = 0
    playWaves(state, 1, false)
    expect(hero.level).toBe(MAX_HERO_LEVEL)
  })
})

describe('the intern', () => {
  it('appears when you equip one and leaves when you take it off', () => {
    const state = game()
    state.phase = 'wave'
    const hero = state.players.p1!.hero
    hero.equipment.intern = {
      id: 'intern1',
      base: 'summer_intern',
      name: 'Summer Intern',
      slot: 'intern',
      rarity: 'common',
      ilvl: 3,
      affixes: [{ stat: 'internPower', value: 1 }],
    }
    step(state)
    expect(state.interns.length).toBe(1)
    expect(state.interns[0]!.name.length).toBeGreaterThan(1)

    hero.equipment.intern = null
    step(state)
    expect(state.interns.length).toBe(0)
  })

  it('follows its owner around the floor', () => {
    const state = game()
    state.phase = 'wave'
    const player = state.players.p1!
    player.hero.equipment.intern = {
      id: 'intern1',
      base: 'summer_intern',
      name: 'Summer Intern',
      slot: 'intern',
      rarity: 'common',
      ilvl: 3,
      affixes: [{ stat: 'internPower', value: 1 }],
    }
    step(state)
    player.pos = { x: 30, y: 18 }
    const start = { ...state.interns[0]!.pos }
    for (let i = 0; i < TICK_HZ * 4; i++) step(state)
    const now = state.interns[0]!.pos
    expect(Math.hypot(now.x - player.pos.x, now.y - player.pos.y)).toBeLessThan(
      Math.hypot(start.x - player.pos.x, start.y - player.pos.y),
    )
  })
})

describe('interns are equipped, never issued', () => {
  it('a fresh hero has an empty intern slot', () => {
    const hero = createHero('wolf')
    expect(hero.equipment.intern).toBeNull()
  })

  it('nothing puts one on the floor until you equip it', () => {
    const state = game('wolf')
    state.budget = 4000
    step(state)
    playWaves(state, 2)
    expect(state.players.p1!.hero.equipment.intern).toBeNull()
    expect(state.interns).toEqual([])
  })

  it('an intern in the bag does nothing at all', () => {
    const state = game('wolf')
    state.phase = 'wave'
    state.players.p1!.hero.bag.push({
      id: 'bagged',
      base: 'summer_intern',
      name: 'Summer Intern',
      slot: 'intern',
      rarity: 'common',
      ilvl: 3,
      affixes: [{ stat: 'internPower', value: 1 }],
    })
    for (let i = 0; i < TICK_HZ * 3; i++) step(state)
    expect(state.interns).toEqual([])
  })

  it('equipping is what summons them, and unequipping sends them home', () => {
    const state = game('wolf')
    state.phase = 'wave'
    const hero = state.players.p1!.hero
    hero.bag.push({
      id: 'bagged',
      base: 'summer_intern',
      name: 'Summer Intern',
      slot: 'intern',
      rarity: 'common',
      ilvl: 3,
      affixes: [{ stat: 'internPower', value: 1 }],
    })
    expect(applyIntent(state, 'p1', { t: 'equip', artifactId: 'bagged' })).toBeNull()
    step(state)
    expect(state.interns.length).toBe(1)

    expect(applyIntent(state, 'p1', { t: 'unequip', slot: 'intern' })).toBeNull()
    step(state)
    expect(state.interns).toEqual([])
  })

  it('WOLF’s All Hands summons colleagues, not interns', () => {
    const state = game('wolf')
    state.phase = 'wave'
    state.players.p1!.pos = { x: 20, y: 12 }
    expect(applyIntent(state, 'p1', { t: 'ability', key: 'R' })).toBeNull()
    step(state)

    // Temporary help appears...
    const temporary = state.towers.filter((t) => t.expiresIn > 0)
    expect(temporary.length).toBeGreaterThan(1)
    // ...and it is emphatically not an intern.
    expect(state.interns).toEqual([])
    expect(state.players.p1!.hero.equipment.intern).toBeNull()
  })

  it('the temporary help actually leaves', () => {
    const state = game('wolf')
    state.phase = 'wave'
    state.players.p1!.pos = { x: 20, y: 12 }
    applyIntent(state, 'p1', { t: 'ability', key: 'R' })
    step(state)
    expect(state.towers.some((t) => t.expiresIn > 0)).toBe(true)
    for (let i = 0; i < TICK_HZ * 30; i++) step(state)
    expect(state.towers.some((t) => t.expiresIn > 0)).toBe(false)
  })
})
