import { TICK_HZ } from '../constants.js'
import { ESCALATION_BARKS, SPAWN_BARKS, getRequest, getTower, laneLength, pointAt } from '../content/index.js'
import { grantXp, rollArtifact } from '../progression.js'
import { chance, createRng, next, pick } from '../rng.js'
import type {
  Channel,
  GameState,
  RequestEntity,
  RequestTypeId,
  RoleId,
  TowerEntity,
} from '../types.js'

/** Escalation multipliers. Tuned so one ignored ticket is scary, not fatal. */
export const ESCALATED_SPEED = 1.9
export const ESCALATED_DAMAGE = 2.2

/** A TRACKED request takes 30% more from everything. Ticketing is the keystone. */
export const TRACKED_BONUS = 1.3

/** A resolve inside the first quarter of the lane counts as a Tier-0 deflection. */
export const DEFLECTION_ZONE = 0.25

function rngFor(state: GameState) {
  const rng = createRng(state.rngState)
  return {
    rng,
    commit() {
      state.rngState = rng.state
    },
  }
}

export function spawnRequest(
  state: GameState,
  type: RequestTypeId,
  lane: number,
  generation = 0,
  progress = 0,
): RequestEntity {
  const def = getRequest(type)
  const { rng, commit } = rngFor(state)
  const barks = SPAWN_BARKS[type] ?? ['']
  const bark = barks.length > 0 ? pick(rng, barks) : ''
  commit()

  const hp = generation > 0 ? Math.max(6, Math.round(def.hp * 0.5)) : def.hp
  const entity: RequestEntity = {
    id: state.nextEntityId++,
    type,
    lane,
    progress,
    offset: 0,
    hp,
    maxHp: hp,
    slaTicks: Math.round(def.slaSeconds * TICK_HZ),
    escalated: false,
    cutoffTicks: def.quirks?.includes('cutoff_split') ? Math.round(def.slaSeconds * TICK_HZ) : -1,
    statuses: [],
    revealed: !def.stealth,
    generation,
    hasSplit: false,
    splitBlocked: false,
    bark,
    pos: pointAt(lane, progress),
  }
  state.requests.push(entity)
  return entity
}

function hasStatus(req: RequestEntity, kind: string): boolean {
  return req.statuses.some((s) => s.kind === kind)
}

/**
 * The entire combat model lives here.
 *
 * Damage flows through exactly one channel. Every request has a resistance
 * multiplier per channel, and `specialist` only lands if the source role is the
 * request's designated counter. This is why Travel & Claims matters: nothing
 * else in the game multiplies against an Expense Claim.
 */
export function damageRequest(
  state: GameState,
  req: RequestEntity,
  rawAmount: number,
  channel: Channel,
  sourceRole?: RoleId,
  allowChain = true,
  /** HIPPO's Seniority: evidence-shaped defences do not apply to rank. */
  ignoreResist = false,
): number {
  if (req.hp <= 0) return 0
  const def = getRequest(req.type)
  const quirks = def.quirks ?? []

  if (channel === 'specialist' && (!sourceRole || def.specialistRole !== sourceRole)) return 0
  if (channel === 'process' && quirks.includes('immune_process') && !ignoreResist) return 0

  if (channel === 'automation' && quirks.includes('heals_from_automation') && !ignoreResist) {
    const healed = Math.min(def.hp - req.hp, rawAmount * 0.5)
    req.hp = Math.min(req.maxHp, req.hp + healed)
    state.events.push({ kind: 'bark', at: { ...req.pos }, text: 'thank you!', requestType: req.type })
    return -healed
  }

  let amount = rawAmount * (ignoreResist ? 1 : def.resist[channel])
  if (hasStatus(req, 'tracked')) amount *= TRACKED_BONUS
  for (const status of req.statuses) {
    if (status.kind === 'marked') amount *= 1 + (status.amount ?? 0.4)
  }
  if (quirks.includes('reflects')) amount *= 0.7

  if (amount <= 0) return 0

  const before = req.hp
  req.hp -= amount

  // Only players ever pass a sourceRole, so this cleanly separates the two.
  if (sourceRole) state.stats.damageByPlayers += amount
  else state.stats.damageByTowers += amount

  // De-escalation: Case Management lets a `process` touch talk one back down.
  if (req.escalated && channel === 'process' && state.unlocked.includes('casemgmt')) {
    const { rng, commit } = rngFor(state)
    const lucky = chance(rng, 0.12)
    commit()
    if (lucky) {
      req.escalated = false
      req.slaTicks = Math.round(def.slaSeconds * TICK_HZ * 0.5)
      state.events.push({ kind: 'bark', at: { ...req.pos }, text: 'ok, understood', requestType: req.type })
    }
  }

  // Damage sharing: the Facebook Friend Parity Complaint insists on consistency.
  if (allowChain && quirks.includes('shares_damage')) {
    const partner = nearestOtherRequest(state, req)
    if (partner) damageRequest(state, partner, rawAmount * 0.5, channel, sourceRole, false)
  }

  // Splitting: receipts beget receipts, unless someone asks for the receipt.
  const splitsInto = def.splitsInto ?? 0
  if (
    splitsInto > 0 &&
    !req.hasSplit &&
    !req.splitBlocked &&
    req.generation === 0 &&
    channel !== 'specialist' &&
    before > req.maxHp * 0.5 &&
    req.hp <= req.maxHp * 0.5 &&
    req.hp > 0
  ) {
    req.hasSplit = true
    for (let i = 1; i < splitsInto; i++) {
      spawnRequest(state, req.type, req.lane, req.generation + 1, Math.max(0, req.progress - 0.6 * i))
    }
    state.events.push({ kind: 'split', at: { ...req.pos }, requestType: req.type, amount: splitsInto })
  }

  if (req.hp <= 0) resolveRequest(state, req, channel)
  return amount
}

function nearestOtherRequest(state: GameState, req: RequestEntity): RequestEntity | null {
  let best: RequestEntity | null = null
  let bestDist = Infinity
  for (const other of state.requests) {
    if (other.id === req.id || other.hp <= 0) continue
    const d = (other.pos.x - req.pos.x) ** 2 + (other.pos.y - req.pos.y) ** 2
    if (d < bestDist) {
      bestDist = d
      best = other
    }
  }
  return bestDist <= 64 ? best : null
}

/**
 * A resolve. Social Capital is only awarded when the request had not escalated —
 * you are paid in credibility for doing it *right*, never for doing it at all.
 */
export function resolveRequest(state: GameState, req: RequestEntity, channel: Channel): void {
  const def = getRequest(req.type)
  req.hp = 0

  // Elites drop. Trash does not, or the floor becomes unreadable.
  if (def.elite) {
    const { rng, commit } = rngFor(state)
    const artifact = rollArtifact(rng, state.waveIndex + 1, 0)
    commit()
    state.loot.push({
      id: state.nextEntityId++,
      artifact,
      pos: { ...req.pos },
      ticks: TICK_HZ * 45,
    })
    state.events.push({ kind: 'drop', at: { ...req.pos }, text: artifact.name })
  }

  const laneFraction = req.progress / Math.max(1, laneLength(req.lane))
  const deflected = channel === 'automation' && laneFraction <= DEFLECTION_ZONE

  state.budget += def.bounty
  state.stats.resolved++

  // XP is shared across the whole team, including kills the towers made.
  // The alternative — XP only for the hero who landed the blow — means heroes
  // barely level in the waves where the towers are working, which punishes
  // exactly the play the rest of the game is trying to teach.
  const xp = 6 + def.hp * 0.18 + (def.elite ? 60 : 0)
  for (const player of Object.values(state.players)) {
    if (!player.connected || !player.role) continue
    const levels = grantXp(player.hero, player.role, xp)
    if (levels > 0) {
      state.events.push({
        kind: 'levelup',
        at: { ...player.pos },
        playerId: player.id,
        amount: player.hero.level,
        text: `LEVEL ${player.hero.level}`,
      })
    }
  }

  if (!req.escalated) {
    let sc = def.socialCapital
    if (deflected) {
      state.stats.deflected++
      if (state.unlocked.includes('kb')) sc += 1
    }
    state.socialCapital += sc
    state.stats.firstContactResolved++
    state.events.push({
      kind: deflected ? 'deflect' : 'resolve',
      at: { ...req.pos },
      amount: sc,
      requestType: req.type,
    })
  } else {
    state.events.push({ kind: 'resolve', at: { ...req.pos }, amount: 0, requestType: req.type })
  }
}

export function escalate(state: GameState, req: RequestEntity): void {
  if (req.escalated) return
  const def = getRequest(req.type)
  req.escalated = true
  state.stats.escalations++

  const { rng, commit } = rngFor(state)
  req.bark = pick(rng, ESCALATION_BARKS)
  const doubles = def.quirks?.includes('cutoff_split') ?? false
  commit()

  state.events.push({ kind: 'escalate', at: { ...req.pos }, text: req.bark, requestType: req.type })

  // "Miss the cutoff and it doesn't breach — it multiplies."
  if (doubles && req.generation === 0) {
    spawnRequest(state, req.type, req.lane, req.generation + 1, Math.max(0, req.progress - 1))
  }
}

// ───────────────────────────────────────────────────────────── tower targeting

function isTargetable(req: RequestEntity): boolean {
  return req.hp > 0 && req.revealed
}

export function pickTarget(state: GameState, tower: TowerEntity): RequestEntity | null {
  const def = getTower(tower.type)
  const range = def.range * (def.upgrades[tower.level - 1]?.rangeMul ?? 1)
  const inRange: RequestEntity[] = []
  for (const req of state.requests) {
    if (!isTargetable(req)) continue
    if (def.cannotHit?.includes(req.type)) continue
    const d = Math.hypot(req.pos.x - (tower.tile.x + 0.5), req.pos.y - (tower.tile.y + 0.5))
    if (d <= range) inRange.push(req)
  }
  if (inRange.length === 0) return null

  switch (def.targeting) {
    case 'first':
      return inRange.reduce((a, b) => (b.progress > a.progress ? b : a))
    case 'last':
      return inRange.reduce((a, b) => (b.progress < a.progress ? b : a))
    case 'strongest':
      return inRange.reduce((a, b) => (b.hp > a.hp ? b : a))
    case 'weakest':
      return inRange.reduce((a, b) => (b.hp < a.hp ? b : a))
    case 'random': {
      const { rng, commit } = rngFor(state)
      const choice = inRange[Math.floor(next(rng) * inRange.length)] ?? inRange[0]!
      commit()
      return choice
    }
    default:
      return inRange[0]!
  }
}
