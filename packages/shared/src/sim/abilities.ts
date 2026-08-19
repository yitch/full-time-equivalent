import { TICK_HZ } from '../constants.js'
import { ROLE_BARKS, getRequest, getRole } from '../content/index.js'
import { createRng, pick } from '../rng.js'
import type { AbilityDef, GameState, Player, RequestEntity, Vec2 } from '../types.js'
import { damageRequest, spawnRequest } from './combat.js'
import { pushLog } from './state.js'

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
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

  if (def.budgetCost) state.budget -= def.budgetCost
  slot.cooldown = Math.round(def.cooldownSeconds * TICK_HZ)

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
        state.towerSlots += def.amount ?? 2
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
        (r) => r.hp > 0 && (getRequest(r.type).specialistRole === 'travel'),
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
 * Players hit through `specialist` when they are the designated counter, and
 * `human` otherwise. This one function is why picking Travel & Claims stops
 * being a punishment around wave six.
 */
export function dealBest(state: GameState, player: Player, req: RequestEntity, amount: number): void {
  if (!player.role) return
  const role = getRole(player.role)
  const def = getRequest(req.type)
  if (def.specialistRole === player.role) {
    damageRequest(state, req, amount * role.specialistPower, 'specialist', player.role)
  } else {
    damageRequest(state, req, amount, 'human', player.role)
  }
}
