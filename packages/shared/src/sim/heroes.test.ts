import { describe, expect, it } from 'vitest'
import { TICK_HZ } from '../constants.js'
import { REQUESTS, STAKEHOLDERS, dropChanceFor, pointAt } from '../content/index.js'
import { createHero } from '../progression.js'
import {
  addPlayer,
  applyIntent,
  createGame,
  damageHero,
  damageRequest,
  resolveTowerStats,
  setRole,
  spawnRequest,
  spawnStakeholder,
  step,
} from './index.js'
import type { GameState, RoleId } from '../types.js'

function game(role: RoleId = 'hippo'): GameState {
  const state = createGame(4242)
  addPlayer(state, 'p1', 'Tester')
  setRole(state, 'p1', role)
  state.phase = 'wave'
  return state
}

describe('heroes take the field', () => {
  it('a hero has real HP and can be downed', () => {
    const state = game('zebra')
    const player = state.players.p1!
    expect(player.hero.maxHp).toBeGreaterThan(50)
    damageHero(state, player, 99999)
    expect(player.hero.hp).toBe(0)
    expect(player.hero.downedTicks).toBeGreaterThan(0)
    expect(player.stats.timesDowned).toBe(1)
  })

  it('a downed hero revives on its own, and much faster with a colleague present', () => {
    const alone = game('zebra')
    damageHero(alone, alone.players.p1!, 99999)
    const soloTicks = alone.players.p1!.hero.downedTicks

    const helped = game('zebra')
    addPlayer(helped, 'p2', 'Colleague')
    setRole(helped, 'p2', 'mouse')
    damageHero(helped, helped.players.p1!, 99999)
    helped.players.p2!.pos = { ...helped.players.p1!.pos }

    for (let i = 0; i < 20; i++) step(helped)
    for (let i = 0; i < 20; i++) step(alone)

    expect(helped.players.p1!.hero.downedTicks).toBeLessThan(alone.players.p1!.hero.downedTicks)
    expect(soloTicks).toBeGreaterThan(0)
  })

  it('standing in the queue costs you health — retreating is a real decision', () => {
    const state = game('zebra')
    const player = state.players.p1!
    const req = spawnRequest(state, 'policy_question', 1)
    const before = player.hero.hp
    for (let i = 0; i < TICK_HZ * 3; i++) {
      player.pos = { ...req.pos }
      step(state)
    }
    expect(player.hero.hp).toBeLessThan(before)
  })

  it('MOUSE is ignored entirely, so it can stand anywhere', () => {
    const state = game('mouse')
    const player = state.players.p1!
    const req = spawnRequest(state, 'payroll_discrepancy', 1)
    const before = player.hero.hp
    for (let i = 0; i < TICK_HZ * 3; i++) {
      player.pos = { ...req.pos }
      step(state)
    }
    expect(player.hero.hp).toBe(before)
  })

  it('shared XP means a tower kill still levels every hero', () => {
    const state = game('dodo')
    const player = state.players.p1!
    // Park the hero far away so it cannot possibly land a blow.
    player.pos = { x: 1, y: 1 }
    expect(player.hero.level).toBe(1)

    for (let i = 0; i < 60; i++) {
      const req = spawnRequest(state, 'policy_question', 0)
      damageRequest(state, req, 99999, 'automation')
    }
    expect(player.hero.level).toBeGreaterThan(1)
    expect(player.hero.talentPoints).toBeGreaterThan(0)
  })
})

describe('stakeholders attack the machine, not the door', () => {
  it('an override Stakeholder suppresses nearby tower damage while it lives', () => {
    const state = game()
    state.budget = 9999
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })
    const tower = state.towers[0]!
    const clean = resolveTowerStats(state, tower).damage

    const s = spawnStakeholder(state, 'hippo', 1)
    s.pos = { x: 12.5, y: 12.5 }
    const suppressed = resolveTowerStats(state, tower).damage

    expect(suppressed).toBeLessThan(clean)
  })

  it('a destroy Stakeholder permanently removes a tower', () => {
    const state = game()
    state.budget = 9999

    // Build next to where the Stakeholder will actually walk, since the sim
    // drives its position from lane arc-length.
    const s = spawnStakeholder(state, 'viper', 1)
    s.progress = 10
    const where = pointAt(1, 10)
    const tile = { x: Math.round(where.x) + 1, y: Math.round(where.y) + 1 }
    expect(applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile })).toBeNull()
    expect(state.towers.length).toBe(1)

    for (let i = 0; i < 20 && state.towers.length > 0; i++) {
      s.pulse = 1
      step(state)
    }
    expect(state.towers.length).toBe(0)
  })

  it('managing a Stakeholder pays Social Capital and can drop an artifact', () => {
    const state = game()
    const s = spawnStakeholder(state, 'seagull', 1)
    state.players.p1!.pos = { ...s.pos }
    const before = state.socialCapital
    s.hp = 0
    step(state)
    expect(state.socialCapital).toBeGreaterThan(before)
    expect(state.players.p1!.stats.stakeholdersManaged).toBe(1)
  })

  it('every Stakeholder is slower than the requests it disrupts, so you can reach it', () => {
    for (const def of Object.values(STAKEHOLDERS)) {
      expect(def.speed, def.name).toBeLessThan(3)
      expect(def.hp, def.name).toBeGreaterThan(150)
    }
  })
})

describe('loot', () => {
  it('elites always drop, and ordinary work drops rarely but from wave one', () => {
    const elite = game()
    const batman = spawnRequest(elite, 'batman', 0)
    damageRequest(elite, batman, 99999, 'human', 'hippo')
    expect(elite.loot.length).toBe(1)

    // Trash is rare, not impossible — the old rule of "elites only" meant a
    // player saw no equipment at all until wave six.
    const trash = game()
    for (let i = 0; i < 400; i++) {
      const req = spawnRequest(trash, 'leave_balance', 0)
      damageRequest(trash, req, 99999, 'automation')
    }
    expect(trash.loot.length).toBeGreaterThan(3)
    expect(trash.loot.length).toBeLessThan(120)
  })

  it('drop rates scale with how much work the request was', () => {
    expect(dropChanceFor(REQUESTS.er_case!)).toBeGreaterThan(dropChanceFor(REQUESTS.leave_balance!))
    expect(dropChanceFor(REQUESTS.batman!)).toBe(1)
  })

  it('walking over a drop picks it up', () => {
    const state = game()
    const hero = createHero('hippo')
    expect(hero.bag.length).toBe(0)
    state.loot.push({
      id: 999,
      artifact: { id: 'x', base: 'lanyard', name: 'Test', slot: 'badge', rarity: 'rare', ilvl: 5, affixes: [] },
      pos: { ...state.players.p1!.pos },
      ticks: 100,
    })
    step(state)
    expect(state.players.p1!.hero.bag.length).toBe(1)
  })
})
