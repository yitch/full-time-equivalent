import { DT, TICK_HZ } from '../constants.js'
import { getRequest, getRole, rechargeAt } from '../content/index.js'
import { RECHARGE_MULTIPLIER, hasGrant, refreshHero } from '../progression.js'
import { chance, createRng, nextFloat } from '../rng.js'
import type { GameState, Player, RequestEntity, RoleId, StakeholderEntity } from '../types.js'
import { damageRequest } from './combat.js'
import { pushLog } from './state.js'

/**
 * THE lever for hero-vs-tower balance.
 *
 * Heroes are a real pillar now — you move, you fight, you level — but the game's
 * thesis is still that *processes* beat *people*. This single scalar keeps that
 * true as classes and gear grow. A balance test asserts towers stay the majority
 * of damage over a full run; if you add a strong class and that test goes red,
 * turn this down rather than nerfing fourteen stat blocks by hand.
 */
export const HERO_OUTPUT_SCALE = 0.22

/** Seconds a downed hero is out of the fight before self-reviving. */
export const DOWNED_SECONDS = 12
/** A nearby ally can pick you up much faster than waiting it out. */
export const REVIVE_RADIUS = 2.2
export const REVIVE_SPEED = 4

/** Ticks with no damage dealt or taken before regen begins. */
const OUT_OF_COMBAT_TICKS = TICK_HZ * 4

/**
 * What an ability costs in Bandwidth. Derived from cooldown so every class is
 * priced consistently, with an explicit override available in content when a
 * particular ability should feel cheaper or more expensive than it looks.
 */
export function abilityCost(def: { cooldownSeconds: number; bandwidthCost?: number }): number {
  if (def.bandwidthCost !== undefined) return def.bandwidthCost
  return Math.round(Math.max(8, Math.min(55, def.cooldownSeconds * 1.15)))
}

function rng(state: GameState) {
  const r = createRng(state.rngState)
  return {
    r,
    done() {
      state.rngState = r.state
    },
  }
}

/**
 * The fourteen dysfunctions, as a damage multiplier.
 *
 * Everything here cuts both ways on purpose. If you add an animal and its
 * passive only ever returns a number above 1, it is a bonus, not a dysfunction,
 * and it does not belong in this function.
 */
export function passiveMultiplier(state: GameState, player: Player, target: RequestEntity | null): number {
  if (!player.role) return 1
  const def = getRole(player.role)

  switch (def.passive) {
    case 'confidently_wrong': {
      if (!target) return 1
      return target.hp >= target.maxHp - 0.001 ? 2.0 : 0.5
    }

    case 'firefighter': {
      if (!target) return 1
      // The three highest entity ids are the three most recent arrivals.
      const newest = [...state.requests]
        .sort((a, b) => b.id - a.id)
        .slice(0, 3)
        .map((r) => r.id)
      return newest.includes(target.id) ? 2.1 : 0.65
    }

    case 'absent': {
      const seconds = state.waveTick / TICK_HZ
      if (state.phase === 'wave' && seconds < 18) return 0
      return 2.7
    }

    case 'gut_feel': {
      const { r, done } = rng(state)
      const roll = nextFloat(r, 0.25, 2.5)
      done()
      return roll
    }

    case 'confirmation_bias': {
      if (!target) return 1
      const kills = player.killsByType[target.type] ?? 0
      return 1 + Math.min(2.0, kills * 0.22)
    }

    case 'volume_over_insight':
      return 0.34

    case 'non_committal':
      return 0.65

    case 'grudge': {
      if (!target) return 1
      const stacks = state.breachedTypes.filter((t) => t === target.type).length
      return 1 + stacks * 0.07
    }

    case 'obsolete':
      return 2.4

    case 'seniority':
    case 'fly_by':
    case 'optimistic_estimate':
    case 'feature_factory':
    case 'metrics':
    default:
      return 1
  }
}

/** HIPPO does not need evidence, so evidence-shaped defences do not apply. */
export function ignoresResistance(player: Player): boolean {
  return player.role ? getRole(player.role).passive === 'seniority' : false
}

/** Damage taken multiplier. MOUSE is extremely hard to pin down. */
export function incomingMultiplier(player: Player): number {
  if (!player.role) return 1
  return getRole(player.role).passive === 'non_committal' ? 0.45 : 1
}

/**
 * Hero auto-attack. This is the OTTTD layer: heroes are on the floor, they have
 * reach and a swing timer, and standing in the right place is a real decision.
 */
export function heroAttack(state: GameState, player: Player): void {
  const hero = player.hero
  if (hero.downedTicks > 0 || !player.role) return
  if (hero.attackCooldown > 0) {
    hero.attackCooldown--
    return
  }

  const role = getRole(player.role)
  const reach = hero.stats.reach
  let best: RequestEntity | null = null
  let bestD = Infinity

  for (const req of state.requests) {
    if (req.hp <= 0) continue
    if (!req.revealed && !role.seesStealth && !hasGrant(hero, player.role, 'always_watching')) continue
    const d = Math.hypot(req.pos.x - player.pos.x, req.pos.y - player.pos.y)
    if (d < bestD && d <= reach) {
      bestD = d
      best = req
    }
  }

  // Stakeholders are valid targets too, and usually the more urgent one.
  let bestStake: StakeholderEntity | null = null
  let bestStakeD = Infinity
  for (const s of state.stakeholders) {
    if (s.hp <= 0) continue
    const d = Math.hypot(s.pos.x - player.pos.x, s.pos.y - player.pos.y)
    if (d < bestStakeD && d <= reach) {
      bestStakeD = d
      bestStake = s
    }
  }

  if (!best && !bestStake) return

  const attacksPerSecond = Math.max(0.15, hero.stats.attackSpeed)
  hero.attackCooldown = Math.max(1, Math.round(TICK_HZ / attacksPerSecond))
  hero.outOfCombat = 0

  const raw = hero.stats.power

  if (bestStake && (!best || bestStakeD < bestD)) {
    damageStakeholder(state, player, bestStake, raw * passiveMultiplier(state, player, null))
    hero.lastAttackTarget = bestStake.id
    return
  }

  if (!best) return
  hero.lastAttackTarget = best.id
  strike(state, player, best, raw)

  if (hasGrant(hero, player.role, 'cleave')) {
    let second: RequestEntity | null = null
    let d2 = Infinity
    for (const req of state.requests) {
      if (req.hp <= 0 || req.id === best.id) continue
      const d = Math.hypot(req.pos.x - best.pos.x, req.pos.y - best.pos.y)
      if (d < d2 && d <= 2.5) {
        d2 = d
        second = req
      }
    }
    if (second) strike(state, player, second, raw * 0.5)
  }
}

/**
 * One hit. Routes through `specialist` when the class is the designated counter,
 * `human` otherwise, then applies the class passive on top.
 */
export function strike(state: GameState, player: Player, req: RequestEntity, amount: number): void {
  if (!player.role) return
  const role = getRole(player.role)
  const def = getRequest(req.type)
  const hero = player.hero

  let total = amount * passiveMultiplier(state, player, req) * player.ownershipPenalty * HERO_OUTPUT_SCALE

  // The Escalation Inbox legendary.
  if (req.escalated && hasLegendary(player, 'escalation_specialist')) total *= 1.45

  const isSpecialist = def.specialistRole === player.role
  const channel = isSpecialist ? 'specialist' : 'human'
  if (isSpecialist) total *= role.specialistPower * (1 + hero.stats.specialistPower)

  const before = req.hp
  damageRequest(state, req, total, channel, player.role, true, ignoresResistance(player))

  // Shadow IT: the same swing also lands through the automation channel.
  if (hasLegendary(player, 'shadow_it') && req.hp > 0) {
    damageRequest(state, req, total * 0.5, 'automation')
  }

  player.stats.damageDealt += Math.max(0, before - req.hp)
  hero.outOfCombat = 0

  if (req.hp <= 0 && before > 0) onKill(state, player, req)
}

export function hasLegendary(player: Player, power: string): boolean {
  for (const item of Object.values(player.hero.equipment)) {
    if (item?.legendary === power) return true
  }
  return false
}

/** Kill credit: XP, confirmation-bias stacks, momentum refunds and drops. */
export function onKill(state: GameState, player: Player, req: RequestEntity): void {
  if (!player.role) return
  const def = getRequest(req.type)
  player.stats.kills++
  player.killsByType[req.type] = (player.killsByType[req.type] ?? 0) + 1

  // XP itself is awarded in resolveRequest, shared across the team.
  void def

  if (hasGrant(player.hero, player.role, 'momentum')) {
    for (const slot of player.abilities) {
      if (slot.cooldown > 0) slot.cooldown = Math.max(0, Math.round(slot.cooldown * 0.8))
    }
  }
}

// ─────────────────────────────────────────────────────────── taking damage

export function damageHero(state: GameState, player: Player, amount: number): void {
  const hero = player.hero
  if (hero.downedTicks > 0) return

  let incoming = amount * incomingMultiplier(player)
  incoming = Math.max(1, incoming - hero.stats.armour)

  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, incoming)
    player.shield -= absorbed
    incoming -= absorbed
  }
  if (incoming <= 0) return

  hero.hp -= incoming
  hero.outOfCombat = 0

  if (hero.hp <= 0) {
    // Garden Leave: you are never actually downed, merely elsewhere.
    if (hasLegendary(player, 'garden_leave')) {
      hero.hp = 1
      player.pos = { x: 20, y: 12 }
      state.events.push({ kind: 'bark', at: { ...player.pos }, text: 'working from home', playerId: player.id })
      return
    }
    hero.hp = 0
    const grantResilient = player.role ? hasGrant(hero, player.role, 'resilient') : false
    hero.downedTicks = Math.round(DOWNED_SECONDS * TICK_HZ * (grantResilient ? 0.5 : 1))
    player.stats.timesDowned++
    state.events.push({ kind: 'downed', at: { ...player.pos }, playerId: player.id, text: 'SIGNED OFF' })
    pushLog(state, `${player.name} is signed off. Back in ${Math.round(hero.downedTicks / TICK_HZ)}s.`)
  }
}

/** Downed timers, revives, regen. Called once per tick per player. */
export function tickHeroBody(state: GameState, player: Player): void {
  const hero = player.hero

  if (hero.downedTicks > 0) {
    let recovery = 1
    // A colleague standing over you speeds this up considerably.
    for (const other of Object.values(state.players)) {
      if (other.id === player.id || !other.connected || other.hero.downedTicks > 0) continue
      const d = Math.hypot(other.pos.x - player.pos.x, other.pos.y - player.pos.y)
      if (d <= REVIVE_RADIUS) {
        recovery = REVIVE_SPEED
        break
      }
    }
    hero.downedTicks = Math.max(0, hero.downedTicks - recovery)
    if (hero.downedTicks === 0) {
      hero.hp = Math.max(1, Math.round(hero.maxHp * 0.45))
      state.events.push({ kind: 'revived', at: { ...player.pos }, playerId: player.id, text: 'back online' })
    }
    return
  }

  hero.outOfCombat++
  if (hero.outOfCombat > OUT_OF_COMBAT_TICKS && hero.stats.regen > 0 && hero.hp < hero.maxHp) {
    hero.hp = Math.min(hero.maxHp, hero.hp + hero.stats.regen * DT)
  }

  // Bandwidth. Slow everywhere, fast at the water cooler, the canteen, or the
  // room that is officially for wellness. Leaving the fight to recover is meant
  // to be a real decision, not a formality.
  const point = rechargeAt(player.pos.x, player.pos.y)
  hero.recharging = point !== null
  const rate = hero.stats.focus * (point ? RECHARGE_MULTIPLIER : 1)
  if (hero.bandwidth < hero.maxBandwidth) {
    hero.bandwidth = Math.min(hero.maxBandwidth, hero.bandwidth + rate * DT)
    if (point && state.tick % TICK_HZ === 0 && hero.bandwidth >= hero.maxBandwidth) {
      state.events.push({
        kind: 'bark',
        at: { ...player.pos },
        text: 'back at it',
        playerId: player.id,
      })
    }
  }

  if (player.shield > 0) player.shield = Math.max(0, player.shield - hero.maxHp * 0.02 * DT)

  if (player.pendingNuke) {
    player.pendingNuke.ticks--
    if (player.pendingNuke.ticks <= 0) {
      const payload = player.pendingNuke.damage
      player.pendingNuke = null
      for (const req of [...state.requests]) {
        if (req.hp > 0) strike(state, player, req, payload / Math.max(1, Math.sqrt(state.requests.length)))
      }
      pushLog(state, `${player.name} shipped it. Late, but shipped.`)
    }
  }
}

/** SEAGULL cannot hold ground: two seconds still and you are somewhere else. */
export function tickFlyBy(state: GameState, player: Player, moving: boolean): void {
  if (!player.role || getRole(player.role).passive !== 'fly_by') return
  if (moving) {
    player.stillTicks = 0
    return
  }
  player.stillTicks++
  if (player.stillTicks >= TICK_HZ * 2) {
    player.stillTicks = 0
    const { r, done } = rng(state)
    player.pos = { x: nextFloat(r, 2, 37), y: nextFloat(r, 2, 21) }
    done()
    state.events.push({ kind: 'bark', at: { ...player.pos }, text: 'must dash', playerId: player.id })
  }
}

/** YAK generates credibility and slows down everything near it. */
export function tickMetrics(state: GameState, player: Player): void {
  if (!player.role || getRole(player.role).passive !== 'metrics') return
  if (state.tick % TICK_HZ !== 0) return
  const gain = 0.5 + player.hero.level * 0.05
  state.socialCapital += gain
  player.stats.socialCapitalEarned += gain
}

export function refresh(player: Player): void {
  if (player.role) refreshHero(player.hero, player.role)
}

export function isSlippedByOptimism(state: GameState, player: Player): boolean {
  if (!player.role || getRole(player.role).passive !== 'optimistic_estimate') return false
  const { r, done } = rng(state)
  const slipped = chance(r, 0.3)
  done()
  return slipped
}

/** GOOSE's cooldowns are short; DODO's ignore cooldown reduction entirely. */
export function cooldownScale(player: Player): number {
  if (!player.role) return 1
  const passive = getRole(player.role).passive
  if (passive === 'optimistic_estimate') return 0.55
  if (passive === 'obsolete') return 1
  return 1 - player.hero.stats.cooldown
}

export function damageStakeholder(
  state: GameState,
  player: Player,
  target: StakeholderEntity,
  amount: number,
): void {
  target.hp -= amount
  player.stats.damageDealt += amount
  player.hero.outOfCombat = 0
  if (target.hp > 0) return
  target.hp = 0
}

export type { RoleId }
