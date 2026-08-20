import { TICK_HZ } from '../constants.js'
import { HEADCOUNT_COST, ROLE_BARKS, getRequest, getRole, isBuildable, pointAt } from '../content/index.js'
import { createRng, next, pick } from '../rng.js'
import type { AbilityDef, GameState, Player, RequestEntity, Vec2 } from '../types.js'
import { damageRequest, spawnRequest } from './combat.js'
import { abilityCost, cooldownScale, isSlippedByOptimism, strike } from './heroes.js'
import { headcountFree } from './headcount.js'
import { pushLog } from './state.js'

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Perpendicular distance from a point to a line segment, for dash sweeps. */
function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return dist(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq))
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function requestsNear(state: GameState, pos: Vec2, radius: number): RequestEntity[] {
  return state.requests.filter((r) => r.hp > 0 && r.revealed && dist(r.pos, pos) <= radius)
}

/** Area abilities are capped by target count, so a crowd is not a free jackpot. */
function nearestFirst(state: GameState, pos: Vec2, radius: number, limit: number): RequestEntity[] {
  return requestsNear(state, pos, radius)
    .sort((a, b) => dist(a.pos, pos) - dist(b.pos, pos))
    .slice(0, limit)
}

function bark(state: GameState, player: Player): void {
  if (!player.role) return
  const lines = ROLE_BARKS[player.role]
  if (!lines || lines.length === 0) return
  const rng = createRng(state.rngState)
  const line = pick(rng, lines)
  state.rngState = rng.state
  state.events.push({ kind: 'bark', at: { ...player.pos }, text: line, playerId: player.id })
}

/**
 * Casts an ability. Returns an error string on failure, or null on success.
 *
 * Every branch here is one of the six roles' identities. If a case gets long,
 * that is usually the class being interesting rather than the code being bad —
 * but split it out once it needs its own state.
 */
export function castAbility(state: GameState, player: Player, key: 'Q' | 'W' | 'E' | 'R'): string | null {
  if (!player.role) return 'Pick a role first.'
  const role = getRole(player.role)
  const def = role.abilities.find((a) => a.key === key)
  if (!def) return 'No such ability.'
  const slot = player.abilities.find((a) => a.id === def.id)
  if (!slot) return 'No such ability.'
  if (slot.disabled) return `${def.name} is unavailable — you are in a meeting about it.`
  if (slot.cooldown > 0) return `${def.name} is on cooldown.`
  if (slot.channelling > 0) return `${def.name} is already running.`
  if (def.budgetCost && state.budget < def.budgetCost) return `Not enough Budget (need ${def.budgetCost}).`

  const cost = abilityCost(def)
  if (player.hero.bandwidth < cost) {
    return `No bandwidth for that (needs ${cost}). Get a coffee, a glass of water, or twenty minutes in the wellness room.`
  }

  if (def.budgetCost) state.budget -= def.budgetCost
  player.hero.bandwidth = Math.max(0, player.hero.bandwidth - cost)
  slot.cooldown = Math.max(1, Math.round(def.cooldownSeconds * TICK_HZ * cooldownScale(player)))

  // GOOSE: the estimate was optimistic and the ability simply did not happen.
  if (isSlippedByOptimism(state, player)) {
    state.events.push({ kind: 'bark', at: { ...player.pos }, text: 'slipped to next sprint', playerId: player.id })
    return null
  }

  const power = player.ownershipPenalty
  const stored = state.storedDamage[player.id] ?? 0
  const bonus = stored
  if (stored > 0 && def.kind !== 'store_damage') state.storedDamage[player.id] = 0

  applyEffect(state, player, def, power, bonus)
  state.events.push({ kind: 'ability', at: { ...player.pos }, text: def.name, playerId: player.id })
  bark(state, player)
  return null
}

function applyEffect(
  state: GameState,
  player: Player,
  def: AbilityDef,
  power: number,
  bonus: number,
): void {
  const role = player.role ? getRole(player.role) : null
  const radius = def.radius ?? 6
  const damage = (def.damage ?? 0) * power + bonus

  switch (def.kind) {

    case 'dash': {
      // Move to the target and hit everything you pass through.
      const targets = requestsNear(state, player.pos, radius)
      if (targets.length === 0) break
      const target = targets.reduce((a, b) => (b.id > a.id ? b : a))
      const from = { ...player.pos }
      player.pos = { x: target.pos.x, y: target.pos.y }
      for (const req of state.requests) {
        if (req.hp <= 0) continue
        if (distToSegment(req.pos, from, player.pos) > 1.4) continue
        dealBest(state, player, req, damage)
      }
      break
    }

    case 'shield': {
      player.shield += (def.amount ?? 100) * power
      break
    }

    case 'mark': {
      const ticks = Math.round((def.durationSeconds ?? 8) * TICK_HZ)
      const limit = def.id === 'roadmap' ? 3 : 1
      for (const req of nearestFirst(state, player.pos, radius, limit)) {
        req.statuses.push({ kind: 'marked', ticks, amount: def.amount ?? 0.4 })
      }
      break
    }

    case 'dot': {
      const ticks = Math.round((def.durationSeconds ?? 8) * TICK_HZ)
      for (const req of nearestFirst(state, player.pos, radius, 4)) {
        req.statuses.push({ kind: 'burning', ticks, amount: (def.damage ?? 15) * power })
      }
      break
    }

    case 'push_back': {
      const shove = def.amount ?? 6
      const targets = radius >= 99 ? state.requests : requestsNear(state, player.pos, radius)
      for (const req of targets) {
        if (req.hp <= 0) continue
        req.progress = Math.max(0, req.progress - shove)
        req.pos = pointAt(req.lane, req.progress)
      }
      break
    }

    case 'percent_damage': {
      // Damage as a fraction of max HP, so it stays relevant at every wave.
      const fraction = def.damage ?? 0.3
      for (const req of [...state.requests]) {
        if (req.hp <= 0) continue
        if (radius < 99 && dist(req.pos, player.pos) > radius) continue
        dealBest(state, player, req, req.maxHp * fraction * power)
      }
      break
    }

    case 'gamble': {
      const rng = createRng(state.rngState)
      const roll = next(rng)
      state.rngState = rng.state
      const targets = radius >= 99 ? state.requests.slice() : nearestFirst(state, player.pos, radius, 1)
      if (roll < 0.2) {
        // It was simply wrong.
        state.events.push({ kind: 'bark', at: { ...player.pos }, text: 'ah. no.', playerId: player.id })
        for (const req of targets) req.hp = Math.min(req.maxHp, req.hp + damage * 0.25)
        break
      }
      for (const req of targets) dealBest(state, player, req, damage * (roll > 0.85 ? 1.8 : 1))
      break
    }

    case 'delayed_nuke': {
      player.pendingNuke = {
        ticks: Math.round((def.durationSeconds ?? 10) * TICK_HZ),
        damage: damage,
      }
      pushLog(state, `${player.name} has committed to a date. We will see.`)
      break
    }

    case 'reset_cooldowns': {
      for (const slot of player.abilities) {
        if (slot.id !== def.id) slot.cooldown = 0
      }
      if (def.damage) player.hero.hp = Math.max(1, player.hero.hp - def.damage)
      break
    }

    case 'build_free': {
      const count = def.amount ?? 1
      for (let i = 0; i < count; i++) {
        // PUFFIN ships without approval, but somebody still has to run the thing.
        // Without this the ability quietly consumes the entire establishment with
        // intranet pages and locks the team out of building anything real.
        if (headcountFree(state) < HEADCOUNT_COST.automation) {
          state.events.push({
            kind: 'bark',
            at: { ...player.pos },
            text: 'no owner for it',
            playerId: player.id,
          })
          break
        }
        const tile = {
          x: Math.round(player.pos.x) + (i % 2 === 0 ? i : -i),
          y: Math.round(player.pos.y) + (i % 2 === 0 ? 0 : 1),
        }
        if (!isBuildable(tile.x, tile.y)) continue
        if (state.towers.some((t) => t.tile.x === tile.x && t.tile.y === tile.y)) continue
        state.towers.push({
          id: state.nextEntityId++,
          type: 'intranet',
          tile,
          level: 1,
          cooldown: 0,
          offline: false,
          builtBy: player.id,
          targetId: null,
          expiresIn: -1,
          unstaffed: false,
        })
        state.events.push({ kind: 'build', at: { x: tile.x + 0.5, y: tile.y + 0.5 }, text: 'Shipped' })
      }
      break
    }

    case 'lane_shift': {
      for (const req of nearestFirst(state, player.pos, radius, 1)) {
        req.lane = (req.lane + 1) % 3
        req.progress = Math.max(0, req.progress - 2)
        req.pos = pointAt(req.lane, req.progress)
        state.events.push({ kind: 'bark', at: { ...req.pos }, text: 'not my team' })
      }
      break
    }

    case 'wall': {
      const lane = Math.round(player.pos.y) < 8 ? 0 : Math.round(player.pos.y) < 16 ? 1 : 2
      state.walls.push({
        lane,
        progress: 0,
        ticks: Math.round((def.durationSeconds ?? 7) * TICK_HZ),
      })
      for (const req of state.requests) {
        if (req.lane === lane && req.hp > 0) {
          req.statuses.push({ kind: 'queued', ticks: Math.round((def.durationSeconds ?? 7) * TICK_HZ) })
        }
      }
      break
    }

    case 'buff_towers': {
      state.auras.push({
        pos: { ...player.pos },
        radius,
        amount: (def.amount ?? 0.25) * power,
        ticks: Math.round((def.durationSeconds ?? 8) * TICK_HZ),
        ownerId: player.id,
      })
      break
    }

    case 'single_target': {
      const targets = requestsNear(state, player.pos, radius)
      if (targets.length === 0) break
      const target = targets.reduce((a, b) => (b.hp > a.hp ? b : a))
      dealBest(state, player, target, damage)
      break
    }

    case 'cone': {
      for (const req of nearestFirst(state, player.pos, radius, 5)) {
        dealBest(state, player, req, damage * 0.4)
      }
      break
    }

    case 'line_damage': {
      for (const req of nearestFirst(state, player.pos, radius, 4)) {
        dealBest(state, player, req, damage * 0.35)
      }
      break
    }

    case 'slow_lane': {
      const ticks = Math.round((def.durationSeconds ?? 8) * TICK_HZ)
      const amount = def.amount ?? 0.4
      const targets = def.radius
        ? requestsNear(state, player.pos, radius)
        : state.requests.filter((r) => r.hp > 0 && r.lane === 0)
      for (const req of targets) req.statuses.push({ kind: 'slowed', ticks, amount })
      break
    }

    case 'reveal': {
      const ticks = Math.round((def.durationSeconds ?? 8) * TICK_HZ)
      for (const req of state.requests) {
        if (req.hp > 0 && !req.revealed && dist(req.pos, player.pos) <= radius) {
          req.revealed = true
          req.statuses.push({ kind: 'revealed', ticks })
          state.events.push({ kind: 'bark', at: { ...req.pos }, text: 'oh. found me.', requestType: req.type })
        }
      }
      break
    }

    case 'grant_social': {
      const amount = Math.round((def.amount ?? 40) * power)
      state.socialCapital += amount
      player.stats.socialCapitalEarned += amount
      pushLog(state, `${player.name} got it agreed in the room. +${amount} Social Capital.`)
      break
    }

    case 'purge_tag': {
      const limit = def.amount ?? 1
      const targets = state.requests
        .filter((r) => r.hp > 0 && getRequest(r.type).specialistRole === player.role)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, limit)
      for (const req of targets) {
        damageRequest(state, req, req.hp * 4, 'specialist', player.role ?? undefined)
      }
      if (targets.length > 0) pushLog(state, `${player.name} cleared ${targets.length} off-cycle.`)
      break
    }

    case 'despawn': {
      const targets = requestsNear(state, player.pos, radius)
      if (targets.length === 0) break
      const target = targets.reduce((a, b) => (b.progress > a.progress ? b : a))
      target.hp = 0
      state.events.push({ kind: 'bark', at: { ...target.pos }, text: 'hello? hello?', requestType: target.type })
      break
    }

    case 'store_damage': {
      state.storedDamage[player.id] = (state.storedDamage[player.id] ?? 0) + 120 * power
      break
    }

    case 'channel_nuke': {
      const slot = player.abilities.find((a) => a.id === def.id)
      if (slot) slot.channelling = Math.round((def.channelSeconds ?? 60) * TICK_HZ)
      pushLog(state, `${player.name} has started the comp cycle. Do not move. Do not speak to them.`)
      break
    }

    case 'repair_tower': {
      let nearest = null as null | (typeof state.towers)[number]
      let bestD = Infinity
      for (const tower of state.towers) {
        const d = dist({ x: tower.tile.x + 0.5, y: tower.tile.y + 0.5 }, player.pos)
        if (d < bestD && d <= radius) {
          bestD = d
          nearest = tower
        }
      }
      if (nearest) {
        nearest.offline = false
        nearest.cooldown = 0
      }
      break
    }

    case 'overclock': {
      state.overclockTicks = Math.round((def.durationSeconds ?? 15) * TICK_HZ)
      state.overclockAmount = def.amount ?? 3
      pushLog(state, `${player.name} pushed it to production. Go-live is live.`)
      break
    }

    case 'summon_intern': {
      // Doubles as "Sign The Req": permanent slots plus the onboarding that follows.
      if (def.id === 'sign_the_req') {
        state.headcount.approved += def.amount ?? 2
        for (let i = 0; i < 6; i++) spawnRequest(state, 'onboarding_packet', 2, 0, -i * 0.8)
        pushLog(state, `${player.name} signed the req. Six Onboarding Packets are already in the lane.`)
      } else {
        state.towers.push({
          id: state.nextEntityId++,
          type: 'intranet',
          tile: { x: Math.round(player.pos.x), y: Math.round(player.pos.y) },
          level: 2,
          cooldown: 0,
          offline: false,
          builtBy: player.id,
          targetId: null,
          expiresIn: Math.round((def.durationSeconds ?? 20) * TICK_HZ),
          unstaffed: false,
        })
      }
      break
    }

    case 'stop_split': {
      for (const req of requestsNear(state, player.pos, radius)) {
        req.splitBlocked = true
      }
      break
    }

    case 'per_diem': {
      // Scales with the number of Expense Claims alive. Your hour has come.
      const claims = state.requests.filter(
        (r) => r.hp > 0 && (getRequest(r.type).specialistRole === 'rhino'),
      ).length
      const perTarget = (def.damage ?? 60) * power * (1 + claims * 0.35)
      for (const req of state.requests) {
        if (req.hp <= 0) continue
        req.hp -= perTarget
        if (req.hp <= 0) {
          state.stats.resolved++
          state.budget += getRequest(req.type).bounty
          state.events.push({ kind: 'resolve', at: { ...req.pos }, requestType: req.type })
        }
      }
      pushLog(
        state,
        `PER DIEM. ${claims} claim(s) on the board, ${Math.round(perTarget)} to everything. Nobody knows their name.`,
      )
      break
    }
  }

  void role
}

/**
 * All hero damage — auto-attacks and abilities alike — goes through `strike` in
 * heroes.ts. One path means the class passive, the specialist multiplier, the
 * legendary hooks, kill credit and HERO_OUTPUT_SCALE are applied exactly once
 * and can never drift apart between the two sources.
 */
export function dealBest(state: GameState, player: Player, req: RequestEntity, amount: number): void {
  strike(state, player, req, amount)
}
