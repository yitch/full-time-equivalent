import { describe, expect, it } from 'vitest'
import { TICK_HZ } from '../constants.js'
import {
  APPROVAL_SLA_THRESHOLD,
  EXIT_OPTIONS,
  MAX_CONTRACTORS,
  contractorFee,
  contractorRate,
  HEADCOUNT_COST,
  REQ_STAGES,
  SALARY_PER_HEAD,
  STARTING_HEADCOUNT,
  requisitionCost,
  requisitionSetupCost,
} from '../content/index.js'
import {
  addPlayer,
  applyIntent,
  createGame,
  effectiveHeadcount,
  headcountFree,
  headcountUsed,
  setRole,
  step,
} from './index.js'
import { advanceRequisitions, chargeSalary } from './headcount.js'
import type { GameState } from '../types.js'

function game(): GameState {
  const state = createGame(31337)
  addPlayer(state, 'p1', 'Tester')
  setRole(state, 'p1', 'hippo')
  state.budget = 5000
  state.socialCapital = 500
  return state
}

describe('headcount is the real constraint', () => {
  it('an automated process needs fewer people than a manual one', () => {
    expect(HEADCOUNT_COST.automation).toBeLessThan(HEADCOUNT_COST.process)
  })

  it('building consumes headcount, selling returns it', () => {
    const state = game()
    expect(headcountUsed(state)).toBe(0)
    expect(applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })).toBeNull()
    expect(headcountUsed(state)).toBe(HEADCOUNT_COST.automation)
    const tower = state.towers[0]!
    applyIntent(state, 'p1', { t: 'sell', towerId: tower.id })
    expect(headcountUsed(state)).toBe(0)
  })

  it('refuses to build with no headcount left, and says so in FTE', () => {
    const state = game()
    state.headcount.approved = 1
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })
    const err = applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 14, y: 12 } })
    expect(err).toContain('FTE')
  })

  it('automation lets you field more defence on the same establishment', () => {
    const auto = game()
    let built = 0
    for (let x = 2; x < 38 && built < 30; x += 2) {
      if (applyIntent(auto, 'p1', { t: 'build', tower: 'intranet', tile: { x, y: 2 } }) === null) built++
    }
    expect(built).toBe(STARTING_HEADCOUNT / HEADCOUNT_COST.automation)
  })

  it('losing headcount does not delete a process, it leaves nobody to run it', () => {
    const state = game()
    for (const x of [4, 6, 8]) {
      applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x, y: 2 } })
    }
    expect(state.towers.length).toBe(3)
    state.headcount.approved = 1
    step(state)
    expect(state.towers.length).toBe(3)
    expect(state.towers.filter((t) => t.unstaffed).length).toBe(2)
  })

  it('an unstaffed tower does not fire', () => {
    const state = game()
    state.phase = 'wave'
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })
    const tower = state.towers[0]!
    tower.unstaffed = true
    tower.cooldown = 0
    for (let i = 0; i < 10; i++) step(state)
    expect(tower.targetId).toBeNull()
  })

  it('charges salary on the approved establishment, not on what you use', () => {
    const state = game()
    state.budget = 1000
    chargeSalary(state)
    expect(state.budget).toBe(1000 - STARTING_HEADCOUNT * SALARY_PER_HEAD)
    expect(state.headcount.lastSalary).toBe(STARTING_HEADCOUNT * SALARY_PER_HEAD)
  })
})

describe('getting headcount approved', () => {
  it('costs credibility and money up front', () => {
    const state = game()
    const sc = state.socialCapital
    const budget = state.budget
    expect(applyIntent(state, 'p1', { t: 'raise_req' })).toBeNull()
    expect(state.socialCapital).toBe(sc - requisitionCost(STARTING_HEADCOUNT))
    expect(state.budget).toBe(budget - requisitionSetupCost(STARTING_HEADCOUNT))
    expect(state.headcount.requisitions.length).toBe(1)
  })

  it('refuses when you cannot make the case', () => {
    const state = game()
    state.socialCapital = 0
    expect(applyIntent(state, 'p1', { t: 'raise_req' })).toContain('Social Capital')
  })

  it('takes several waves to clear, one stage at a time', () => {
    const state = game()
    state.stats.slaCompliance = 1
    applyIntent(state, 'p1', { t: 'raise_req' })
    const before = state.headcount.approved

    // One wave short of the full pipeline: still nothing.
    const totalWaves = REQ_STAGES.reduce((sum, s) => sum + s.waves, 0)
    for (let i = 0; i < totalWaves - 1; i++) advanceRequisitions(state)
    expect(state.headcount.approved).toBe(before)

    advanceRequisitions(state)
    expect(state.headcount.approved).toBe(before + 1)
    expect(state.headcount.requisitions.length).toBe(0)
  })

  it('the CFO defers it once if your SLA is poor — you cannot hire out of a process problem', () => {
    const state = game()
    state.stats.slaCompliance = APPROVAL_SLA_THRESHOLD - 0.2
    applyIntent(state, 'p1', { t: 'raise_req' })
    const before = state.headcount.approved

    // Straight through the pipeline once: the CFO sends it back instead.
    const totalWaves = REQ_STAGES.reduce((sum, s) => sum + s.waves, 0)
    for (let i = 0; i < totalWaves; i++) advanceRequisitions(state)
    expect(state.headcount.approved).toBe(before)
    expect(state.headcount.requisitions.length).toBe(1)
    expect(state.headcount.requisitions[0]!.deferred).toBe(true)
  })

  it('good performance clears the CFO first time', () => {
    const state = game()
    state.stats.slaCompliance = 0.95
    applyIntent(state, 'p1', { t: 'raise_req' })
    for (let i = 0; i < 4; i++) advanceRequisitions(state)
    expect(state.headcount.approved).toBe(STARTING_HEADCOUNT + 1)
  })

  it('withdrawing refunds most of the Budget and none of the credibility', () => {
    const state = game()
    applyIntent(state, 'p1', { t: 'raise_req' })
    const sc = state.socialCapital
    const budget = state.budget
    applyIntent(state, 'p1', { t: 'cancel_req', id: state.headcount.requisitions[0]!.id })
    expect(state.socialCapital).toBe(sc)
    expect(state.budget).toBeGreaterThan(budget)
    expect(state.headcount.requisitions.length).toBe(0)
  })

  it('caps the pipeline — Finance will not look at a fourth', () => {
    const state = game()
    for (let i = 0; i < 3; i++) expect(applyIntent(state, 'p1', { t: 'raise_req' })).toBeNull()
    expect(applyIntent(state, 'p1', { t: 'raise_req' })).toContain('fourth')
  })
})

describe('removing headcount always costs something', () => {
  it('every route costs at least one currency', () => {
    for (const def of Object.values(EXIT_OPTIONS)) {
      const total = def.budget + def.morale + def.social + def.consultSeconds
      expect(total, def.name).toBeGreaterThan(0)
    }
  })

  it('attrition is free in money and morale, but slow', () => {
    const state = game()
    const budget = state.budget
    const morale = state.morale
    expect(applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'attrition' })).toBeNull()
    expect(state.budget).toBe(budget)
    expect(state.morale).toBe(morale)
    expect(state.headcount.exits[0]!.ticks).toBeGreaterThan(TICK_HZ * 30)
  })

  it('compulsory is cheap in Budget and expensive in everything else', () => {
    const state = game()
    const before = { budget: state.budget, morale: state.morale, social: state.socialCapital }
    applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'compulsory' })
    expect(state.budget).toBeLessThan(before.budget)
    expect(state.morale).toBeLessThan(before.morale)
    expect(state.socialCapital).toBeLessThan(before.social)
    expect(EXIT_OPTIONS.compulsory.budget).toBeLessThan(EXIT_OPTIONS.voluntary.budget)
    expect(EXIT_OPTIONS.compulsory.morale).toBeGreaterThan(EXIT_OPTIONS.voluntary.morale)
  })

  it('the head is committed the moment you start, so cover is lost immediately', () => {
    const state = game()
    const before = effectiveHeadcount(state)
    applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'attrition' })
    expect(effectiveHeadcount(state)).toBe(before - 1)
    expect(state.headcount.approved).toBe(before)
  })

  it('morale drains across a compulsory consultation, and the head leaves at the end', () => {
    const state = game()
    state.phase = 'wave'
    applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'compulsory' })
    const afterHit = state.morale
    const approved = state.headcount.approved

    const ticks = EXIT_OPTIONS.compulsory.consultSeconds * TICK_HZ
    for (let i = 0; i < ticks + 5; i++) step(state)

    expect(state.morale).toBeLessThan(afterHit)
    expect(state.headcount.approved).toBe(approved - 1)
    expect(state.headcount.exits.length).toBe(0)
  })

  it('refuses to make the last person redundant', () => {
    const state = game()
    state.headcount.approved = 1
    expect(applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'voluntary' })).toContain('one person')
  })

  it('a compulsory process can raise a claim; attrition never does', () => {
    expect(EXIT_OPTIONS.compulsory.erRisk).toBeGreaterThan(0.2)
    expect(EXIT_OPTIONS.attrition.erRisk).toBe(0)

    // Force the risk to land and confirm an ER case actually reaches the board.
    let sawClaim = false
    for (let seed = 0; seed < 12 && !sawClaim; seed++) {
      const state = createGame(seed)
      addPlayer(state, 'p1', 'T')
      setRole(state, 'p1', 'hippo')
      state.budget = 5000
      state.phase = 'wave'
      applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'compulsory' })
      const ticks = EXIT_OPTIONS.compulsory.consultSeconds * TICK_HZ
      for (let i = 0; i < ticks + 5; i++) step(state)
      if (state.requests.some((r) => r.type === 'er_case')) sawClaim = true
    }
    expect(sawClaim).toBe(true)
  })
})

describe('free capacity accounting', () => {
  it('reports free FTE as approved minus committed exits minus towers', () => {
    const state = game()
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 12, y: 12 } })
    applyIntent(state, 'p1', { t: 'remove_headcount', kind: 'attrition' })
    expect(headcountFree(state)).toBe(STARTING_HEADCOUNT - 1 - HEADCOUNT_COST.automation)
  })
})

describe('when you run out of people, there is always a way out', () => {
  it('the refusal names all three routes instead of just the problem', () => {
    const state = game()
    state.headcount.approved = 1
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 3, y: 1 } })
    const err = applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 5, y: 1 } }) ?? ''
    expect(err).toContain('contractor')
    expect(err).toContain('requisition')
    expect(err).toContain('decommission')
  })

  it('a contractor is instant capacity, with no approval and no waiting', () => {
    const state = game()
    const before = effectiveHeadcount(state)
    expect(applyIntent(state, 'p1', { t: 'hire_contractor' })).toBeNull()
    expect(effectiveHeadcount(state)).toBe(before + 1)
    expect(state.headcount.requisitions.length).toBe(0)
    expect(state.headcount.approved).toBe(before)
  })

  it('costs an agency fee up front and far more than salary per wave', () => {
    const state = game()
    state.budget = 1000
    applyIntent(state, 'p1', { t: 'hire_contractor' })
    expect(state.budget).toBe(1000 - contractorFee(0))

    const before = state.budget
    chargeSalary(state)
    const spent = before - state.budget
    expect(spent).toBeGreaterThan(STARTING_HEADCOUNT * SALARY_PER_HEAD)
    expect(contractorRate(1)).toBeGreaterThan(SALARY_PER_HEAD * 2)
  })

  it('ends instantly, with no package, no consultation and no morale hit', () => {
    const state = game()
    applyIntent(state, 'p1', { t: 'hire_contractor' })
    const morale = state.morale
    const budget = state.budget
    expect(applyIntent(state, 'p1', { t: 'end_contractor' })).toBeNull()
    expect(state.headcount.contractors).toBe(0)
    expect(state.morale).toBe(morale)
    expect(state.budget).toBe(budget)
    expect(state.headcount.exits.length).toBe(0)
  })

  it('procurement eventually notices', () => {
    const state = game()
    state.budget = 100000
    for (let i = 0; i < MAX_CONTRACTORS; i++) {
      expect(applyIntent(state, 'p1', { t: 'hire_contractor' }), `hire ${i}`).toBeNull()
    }
    expect(applyIntent(state, 'p1', { t: 'hire_contractor' })).toContain('limit')
  })

  it('the rate escalates, so contractors do not quietly become the strategy', () => {
    expect(contractorRate(3)).toBeGreaterThan(contractorRate(1) * 3)
  })

  it('contractors staff towers exactly like establishment does', () => {
    const state = game()
    state.headcount.approved = 1
    applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 3, y: 1 } })
    expect(applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 5, y: 1 } })).toContain('FTE')
    applyIntent(state, 'p1', { t: 'hire_contractor' })
    expect(applyIntent(state, 'p1', { t: 'build', tower: 'intranet', tile: { x: 5, y: 1 } })).toBeNull()
  })
})
