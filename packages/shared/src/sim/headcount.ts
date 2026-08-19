import { TICK_HZ } from '../constants.js'
import {
  APPROVAL_LINES,
  APPROVAL_SLA_THRESHOLD,
  DEFERRAL_LINES,
  EXIT_LINES,
  EXIT_OPTIONS,
  HEADCOUNT_COST,
  REQ_STAGES,
  SALARY_PER_HEAD,
  getTower,
  requisitionCost,
  requisitionSetupCost,
} from '../content/index.js'
import { chance, createRng, pick } from '../rng.js'
import type { ExitKind, GameState, PlayerId } from '../types.js'
import { spawnRequest } from './combat.js'
import { pushLog } from './state.js'

function rng(state: GameState) {
  const r = createRng(state.rngState)
  return {
    r,
    done() {
      state.rngState = r.state
    },
  }
}

/** FTE currently consumed by standing towers. Automation is cheaper to own. */
export function headcountUsed(state: GameState): number {
  let used = 0
  for (const tower of state.towers) {
    if (tower.expiresIn > 0) continue // interns and other temporary help do not count
    used += HEADCOUNT_COST[getTower(tower.type).channel]
  }
  return used
}

/** Heads already committed to leaving are no longer available to cover work. */
export function effectiveHeadcount(state: GameState): number {
  return Math.max(0, state.headcount.approved - state.headcount.exits.length)
}

export function headcountFree(state: GameState): number {
  return effectiveHeadcount(state) - headcountUsed(state)
}

/**
 * Enforcement. Going over headcount does not delete a tower — it takes it
 * offline, because the process still exists, there is simply nobody to run it.
 * Most recently built goes dark first, which is also how it works.
 */
export function enforceHeadcount(state: GameState): void {
  const capacity = effectiveHeadcount(state)
  let used = 0
  const ordered = [...state.towers].sort((a, b) => a.id - b.id)

  for (const tower of ordered) {
    if (tower.expiresIn > 0) continue
    const cost = HEADCOUNT_COST[getTower(tower.type).channel]
    if (used + cost <= capacity) {
      used += cost
      tower.unstaffed = false
    } else {
      tower.unstaffed = true
    }
  }
}

// ─────────────────────────────────────────────────────────── raising a req

export function raiseRequisition(state: GameState, playerId: PlayerId | null): string | null {
  const cost = requisitionCost(state.headcount.approved)
  const setup = requisitionSetupCost(state.headcount.approved)
  if (state.socialCapital < cost) {
    return `Not enough Social Capital to make the case (need ${cost}).`
  }
  if (state.budget < setup) {
    return `Not enough Budget for the hire itself (need ${setup}).`
  }
  if (state.headcount.requisitions.length >= 3) {
    return 'Three reqs already in the system. Finance will not look at a fourth.'
  }

  state.socialCapital -= cost
  state.budget -= setup
  state.headcount.requisitions.push({
    id: state.nextEntityId++,
    stage: 0,
    wavesLeft: REQ_STAGES[0]?.waves ?? 1,
    socialSpent: cost,
    deferred: false,
    raisedBy: playerId,
  })
  pushLog(state, `Requisition raised. ${REQ_STAGES[0]?.flavour ?? ''}`)
  state.events.push({ kind: 'headcount', at: { x: 20, y: 12 }, text: 'REQ RAISED' })
  return null
}

/** Withdrawing refunds the setup Budget but never the credibility. */
export function cancelRequisition(state: GameState, id: number): string | null {
  const index = state.headcount.requisitions.findIndex((r) => r.id === id)
  if (index === -1) return 'No such requisition.'
  state.headcount.requisitions.splice(index, 1)
  state.budget += Math.round(requisitionSetupCost(state.headcount.approved) * 0.6)
  pushLog(state, 'Requisition withdrawn. The Social Capital is gone; most of the Budget came back.')
  return null
}

/**
 * Advances every req one wave. Called once at the end of a wave, never per tick:
 * approval moves at the speed of meetings, not of gameplay.
 */
export function advanceRequisitions(state: GameState): void {
  const surviving: typeof state.headcount.requisitions = []

  for (const req of state.headcount.requisitions) {
    req.wavesLeft--
    if (req.wavesLeft > 0) {
      surviving.push(req)
      continue
    }

    req.stage++
    if (req.stage < REQ_STAGES.length) {
      req.wavesLeft = REQ_STAGES[req.stage]?.waves ?? 1
      pushLog(state, `Req moved on. ${REQ_STAGES[req.stage]?.flavour ?? ''}`)
      surviving.push(req)
      continue
    }

    // Final gate: the catch-22. You cannot hire your way out of a process problem.
    const { r, done } = rng(state)
    if (state.stats.slaCompliance < APPROVAL_SLA_THRESHOLD && !req.deferred) {
      req.deferred = true
      req.stage = 1
      req.wavesLeft = REQ_STAGES[1]?.waves ?? 1
      pushLog(state, `Req deferred. ${pick(r, DEFERRAL_LINES)}`)
      state.events.push({ kind: 'headcount', at: { x: 20, y: 12 }, text: 'DEFERRED' })
      done()
      surviving.push(req)
      continue
    }

    state.headcount.approved++
    pushLog(state, `HEADCOUNT APPROVED. ${pick(r, APPROVAL_LINES)}`)
    done()
    state.events.push({ kind: 'headcount', at: { x: 20, y: 12 }, text: '+1 HEADCOUNT' })
  }

  state.headcount.requisitions = surviving
  enforceHeadcount(state)
}

// ────────────────────────────────────────────────────────── removing a head

export function removeHeadcount(state: GameState, kind: ExitKind): string | null {
  const def = EXIT_OPTIONS[kind]
  if (!def) return 'No such route.'
  if (effectiveHeadcount(state) <= 1) return 'There is one person left. You cannot make them redundant.'
  if (state.budget < def.budget) return `Not enough Budget for the package (need ${def.budget}).`

  state.budget -= def.budget
  state.morale = Math.max(0, state.morale - def.morale)
  state.socialCapital = Math.max(0, state.socialCapital - def.social)

  state.headcount.exits.push({
    id: state.nextEntityId++,
    kind,
    ticks: Math.round(def.consultSeconds * TICK_HZ),
    totalTicks: Math.round(def.consultSeconds * TICK_HZ),
  })

  const { r, done } = rng(state)
  pushLog(state, `${def.name}. ${pick(r, EXIT_LINES[kind])}`)
  done()

  state.events.push({ kind: 'headcount', at: { x: 20, y: 12 }, text: def.name.toUpperCase() })

  // The head is committed the moment the process starts, so cover is lost now.
  enforceHeadcount(state)
  return null
}

/**
 * Consultation periods run in real time. Morale drains throughout a compulsory
 * process, and an Employee Relations case may be raised at the end of it — which
 * is the mechanic saying, correctly, that the cheap option is not the cheap option.
 */
export function stepExits(state: GameState): void {
  const surviving: typeof state.headcount.exits = []

  for (const exit of state.headcount.exits) {
    const def = EXIT_OPTIONS[exit.kind]
    exit.ticks--

    if (def && def.moralePerSecond > 0 && state.tick % TICK_HZ === 0) {
      state.morale = Math.max(0, state.morale - def.moralePerSecond)
    }

    if (exit.ticks > 0) {
      surviving.push(exit)
      continue
    }

    state.headcount.approved = Math.max(0, state.headcount.approved - 1)

    if (def && def.erRisk > 0) {
      const { r, done } = rng(state)
      const raised = chance(r, def.erRisk)
      done()
      if (raised) {
        spawnRequest(state, 'er_case', 1)
        pushLog(state, 'A claim has been raised out of the redundancy process. Of course it has.')
        state.events.push({ kind: 'headcount', at: { x: 20, y: 12 }, text: 'CLAIM RAISED' })
      }
    }

    pushLog(state, `A head has left the organisation. ${state.headcount.approved} approved FTE remain.`)
  }

  state.headcount.exits = surviving
  enforceHeadcount(state)
}

/** Salary is charged once per wave, on the approved establishment, not on usage. */
export function chargeSalary(state: GameState): void {
  const bill = state.headcount.approved * SALARY_PER_HEAD
  state.headcount.lastSalary = bill
  state.budget = Math.max(0, state.budget - bill)
  pushLog(state, `Payroll ran. ${state.headcount.approved} FTE, ${bill} Budget.`)
}
