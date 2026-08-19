import {
  BRIEFING_SECONDS,
  DT,
  GRID_H,
  GRID_W,
  PLAYER_SPEED,
  STEERING_SECONDS,
  TICK_HZ,
} from '../constants.js'
import {
  CFO_APPROVALS,
  SELL_REFUND,
  TICKER_LINES,
  WAVES,
  canUnlock,
  getRequest,
  getRole,
  getTech,
  getTower,
  isBuildable,
  laneLength,
  pointAt,
} from '../content/index.js'
import { chance, createRng, nextInt, pick } from '../rng.js'
import type {
  ArtifactSlot,
  GameState,
  Intent,
  Player,
  PlayerId,
  RequestEntity,
  TowerEntity,
} from '../types.js'
import { castAbility, dealBest } from './abilities.js'
import {
  cooldownScale,
  damageHero,
  heroAttack,
  tickFlyBy,
  tickHeroBody,
  tickMetrics,
} from './heroes.js'
import { overrideFactor, spawnStakeholder, stepStakeholders } from './stakeholders.js'
import { refreshHero, rollArtifact, spendTalent } from '../progression.js'
import { ESCALATED_DAMAGE, ESCALATED_SPEED, damageRequest, escalate, pickTarget, spawnRequest } from './combat.js'
import { addPlayer, pushLog, recomputeOwnership, removePlayer, setRole } from './state.js'

export * from './state.js'
export * from './combat.js'
export * from './abilities.js'
export * from './heroes.js'
export * from './stakeholders.js'

// ─────────────────────────────────────────────────────────────── tower stats

export interface ResolvedTowerStats {
  damage: number
  range: number
  fireRate: number
}

/**
 * Everything that modifies a tower, in one place, so balance changes are a
 * single-file job. Order matters: upgrades, then global passives, then transient
 * auras, then overclock.
 */
export function resolveTowerStats(state: GameState, tower: TowerEntity): ResolvedTowerStats {
  const def = getTower(tower.type)
  let damage = def.damage
  let range = def.range
  let fireRate = def.fireRate

  for (let i = 0; i < tower.level; i++) {
    const upgrade = def.upgrades[i]
    if (!upgrade) break
    damage *= upgrade.damageMul
    range *= upgrade.rangeMul
    fireRate *= upgrade.fireRateMul
  }

  if (def.channel === 'automation') {
    if (state.unlocked.includes('aiagent')) damage *= 1.25
    const hasHris = Object.values(state.players).some((p) => p.connected && p.role === 'puffin')
    if (hasHris) damage *= 1.2
  }

  const centre = { x: tower.tile.x + 0.5, y: tower.tile.y + 0.5 }
  for (const aura of state.auras) {
    if (Math.hypot(aura.pos.x - centre.x, aura.pos.y - centre.y) <= aura.radius) {
      damage *= 1 + aura.amount
    }
  }

  // YAK: everything within six tiles is too busy reporting to do the work.
  for (const player of Object.values(state.players)) {
    if (!player.connected || player.role !== 'yak') continue
    if (Math.hypot(player.pos.x - centre.x, player.pos.y - centre.y) <= 6) damage *= 0.78
  }

  // Players buff every tower they own through gear and talents.
  for (const player of Object.values(state.players)) {
    if (!player.connected) continue
    if (tower.builtBy === player.id) {
      damage *= 1 + player.hero.stats.towerDamage
      range *= 1 + player.hero.stats.towerRange
    }
  }

  const suppression = overrideFactor(state, tower)
  damage *= suppression.damage
  range *= suppression.range

  if (state.overclockTicks > 0) fireRate *= state.overclockAmount

  return { damage, range, fireRate }
}

function countQuirk(state: GameState, quirk: string): number {
  let n = 0
  for (const tower of state.towers) {
    if (tower.offline) continue
    if (getTower(tower.type).quirks?.includes(quirk as never)) n++
  }
  return n
}

// ─────────────────────────────────────────────────────────────────── stepping

export function step(state: GameState): GameState {
  state.events = []
  state.tick++

  switch (state.phase) {
    case 'lobby':
      stepLobby(state)
      break
    case 'briefing':
      stepCountdown(state, () => beginWave(state))
      break
    case 'wave':
      stepWave(state)
      break
    case 'steering':
      stepCountdown(state, () => beginBriefing(state))
      break
    default:
      break
  }

  stepPlayers(state)
  decayAuras(state)
  return state
}

function stepLobby(state: GameState): void {
  const players = Object.values(state.players).filter((p) => p.connected)
  if (players.length === 0) return
  if (players.every((p) => p.ready && p.role)) beginBriefing(state)
}

function stepCountdown(state: GameState, onDone: () => void): void {
  if (state.phaseTicks > 0) state.phaseTicks--
  if (state.phaseTicks === 0) onDone()
}

function beginBriefing(state: GameState): void {
  state.phase = 'briefing'
  state.phaseTicks = Math.round(BRIEFING_SECONDS * TICK_HZ)
  const wave = WAVES[state.waveIndex]
  if (wave) pushLog(state, `WAVE ${wave.index + 1} — ${wave.name}. ${wave.briefing}`)
}

/**
 * Builds the whole spawn schedule up front so prevention effects are applied to
 * the plan, not to individual spawns. "Fewer things happened" should be legible
 * in the briefing, not a statistical rumour.
 */
function beginWave(state: GameState): void {
  const wave = WAVES[state.waveIndex]
  if (!wave) {
    state.phase = 'victory'
    state.phaseTicks = -1
    return
  }

  state.phase = 'wave'
  state.phaseTicks = -1
  state.waveTick = 0
  state.spawnCursor = 0
  state.pending = []

  const preventionStacks = countQuirk(state, 'prevention')
  const reduction = Math.min(0.4, preventionStacks * 0.08)

  for (const group of wave.groups) {
    const count = Math.max(1, Math.round(group.count * (1 - reduction)))
    for (let i = 0; i < count; i++) {
      state.pending.push({
        at: group.at + i * group.spacing,
        type: group.requestType,
        lane: group.lane,
      })
    }
  }
  state.pending.sort((a, b) => a.at - b.at)
  state.pendingStakeholders = [...(wave.stakeholders ?? [])].sort((a, b) => a.at - b.at)

  // HRBP: one random ability disabled, because someone booked them into a meeting.
  for (const player of Object.values(state.players)) {
    if (!player.role) continue
    for (const slot of player.abilities) slot.disabled = false
    if (getRole(player.role).losesAbilityEachWave && player.abilities.length > 0) {
      const rng = createRng(state.rngState)
      const idx = nextInt(rng, 0, player.abilities.length - 1)
      state.rngState = rng.state
      const slot = player.abilities[idx]
      if (slot) {
        slot.disabled = true
        pushLog(state, `${player.name} has been double-booked. One ability is unavailable this wave.`)
      }
    }
  }

  state.events.push({ kind: 'wave_start', at: { x: 20, y: 12 }, text: wave.name, amount: wave.index })
  if (reduction > 0) {
    pushLog(state, `Manager enablement removed ${Math.round(reduction * 100)}% of inbound before it happened.`)
  }
}

function stepWave(state: GameState): void {
  const wave = WAVES[state.waveIndex]
  if (!wave) return
  state.waveTick++
  const t = state.waveTick / TICK_HZ

  // Maintenance windows take automation offline entirely.
  const inWindow = (wave.maintenanceWindows ?? []).some((w) => t >= w.at && t < w.at + w.seconds)
  if (inWindow && state.maintenanceTicks <= 0) {
    state.maintenanceTicks = 1
    pushLog(state, 'MAINTENANCE WINDOW. Every automation tower is offline. Hope you brought people.')
    state.events.push({ kind: 'maintenance', at: { x: 20, y: 2 }, text: 'MAINTENANCE WINDOW' })
  }
  state.maintenanceTicks = inWindow ? 2 : 0

  drainSpawns(state, t)
  while (state.pendingStakeholders.length > 0 && state.pendingStakeholders[0]!.at <= t) {
    const entry = state.pendingStakeholders.shift()!
    spawnStakeholder(state, entry.type, entry.lane)
  }
  stepRequests(state)
  stepStakeholders(state)
  stepTowers(state)
  stepLoot(state)
  stepWalls(state)

  if (state.morale <= 0) {
    state.phase = 'gameover'
    state.phaseTicks = -1
    pushLog(state, 'Morale hit zero. Two resignations this morning and one "let\'s grab a coffee" from your director.')
    return
  }
  if (state.compliance <= 0) {
    state.phase = 'gameover'
    state.phaseTicks = -1
    state.events.push({ kind: 'audit', at: { x: 20, y: 12 }, text: 'AUDIT' })
    pushLog(state, 'AUDIT. External counsel is in the building. Nobody is going home.')
    return
  }

  const spawnsDone = state.pending.length === 0 && state.pendingStakeholders.length === 0
  const lastSpawn = wave.groups.reduce((m, g) => Math.max(m, g.at + g.count * g.spacing), 0)
  const alive = state.requests.some((r) => r.hp > 0) || state.stakeholders.some((s) => s.hp > 0)
  if (spawnsDone && !alive && t > lastSpawn + Math.min(3, wave.tailSeconds)) endWave(state)
}

function drainSpawns(state: GameState, t: number): void {
  const filterStacks = countQuirk(state, 'spawn_filter')
  const filterChance = Math.min(0.6, filterStacks * 0.15)
  const justSayNo = state.unlocked.includes('justsayno')

  while (state.pending.length > 0 && state.pending[0]!.at <= t) {
    const entry = state.pending.shift()!
    const rng = createRng(state.rngState)
    let skip = false
    if (justSayNo && chance(rng, 0.05)) skip = true
    if (!skip && entry.type === 'policy_question' && filterChance > 0 && chance(rng, filterChance)) skip = true
    state.rngState = rng.state
    if (skip) continue
    spawnRequest(state, entry.type, entry.lane)
  }
}

function stepRequests(state: GameState): void {
  const remaining: RequestEntity[] = []

  for (const req of state.requests) {
    if (req.hp <= 0) continue
    const def = getRequest(req.type)

    // statuses
    let slow = 0
    let queued = false
    for (const status of req.statuses) {
      if (status.ticks > 0) status.ticks--
      if (status.kind === 'slowed') slow = Math.max(slow, status.amount ?? 0.4)
      if (status.kind === 'queued') queued = true
      if (status.kind === 'burning' && state.tick % TICK_HZ === 0) {
        damageRequest(state, req, status.amount ?? 10, 'human')
      }
    }
    req.statuses = req.statuses.filter((s) => s.ticks !== 0)

    // SLA
    if (req.slaTicks > 0) {
      req.slaTicks--
      if (req.slaTicks === 0) escalate(state, req)
    }

    // movement
    let speed = def.speed * (1 - slow)
    if (queued) speed *= 0.25
    if (req.escalated) speed *= ESCALATED_SPEED
    if (def.quirks?.includes('erratic')) {
      const rng = createRng(state.rngState + req.id)
      req.offset = Math.sin(state.tick * 0.08 + req.id) * 0.7
      state.rngState = rng.state
    }
    req.progress += speed * DT

    const total = laneLength(req.lane)
    if (req.progress >= total) {
      breach(state, req)
      continue
    }

    const p = pointAt(req.lane, req.progress)
    req.pos = { x: p.x, y: p.y + req.offset }
    remaining.push(req)
  }

  state.requests = remaining
}

function breach(state: GameState, req: RequestEntity): void {
  const def = getRequest(req.type)
  const mult = req.escalated ? ESCALATED_DAMAGE : 1
  if (def.complianceDamage) {
    state.compliance = Math.max(0, state.compliance - def.complianceDamage * mult)
  } else {
    state.morale = Math.max(0, state.morale - def.moraleDamage * mult)
  }
  state.stats.breached++
  state.breachedTypes.push(req.type)
  const total = state.stats.resolved + state.stats.breached
  state.stats.slaCompliance = total > 0 ? state.stats.resolved / total : 1
  state.events.push({
    kind: 'breach',
    at: pointAt(req.lane, laneLength(req.lane)),
    requestType: req.type,
    amount: def.complianceDamage ? -def.complianceDamage * mult : -def.moraleDamage * mult,
  })
}

function stepTowers(state: GameState): void {
  const survivors: TowerEntity[] = []

  for (const tower of state.towers) {
    if (tower.expiresIn > 0) {
      tower.expiresIn--
      if (tower.expiresIn === 0) continue
    }
    const def = getTower(tower.type)

    if (def.channel === 'automation' && state.maintenanceTicks > 0) {
      tower.offline = true
    } else if (!def.quirks?.includes('fragile_uptime')) {
      tower.offline = false
    }

    survivors.push(tower)

    if (tower.offline) continue
    if (def.fireRate <= 0) continue // prevention / spawn_filter towers never fire

    const stats = resolveTowerStats(state, tower)
    if (tower.cooldown > 0) {
      tower.cooldown--
      continue
    }

    const target = pickTarget(state, tower)
    tower.targetId = target?.id ?? null
    if (!target) continue

    tower.cooldown = Math.max(1, Math.round(TICK_HZ / Math.max(0.05, stats.fireRate)))

    // Ava misroutes. This is the price of Ava.
    if (def.quirks?.includes('misroute')) {
      const rng = createRng(state.rngState)
      const misrouted = chance(rng, 0.08)
      state.rngState = rng.state
      if (misrouted) {
        target.hp = Math.min(target.maxHp, target.hp + stats.damage * 0.5)
        state.events.push({ kind: 'bark', at: { ...target.pos }, text: 'Ava sent me here?', requestType: target.type })
        continue
      }
    }

    damageRequest(state, target, stats.damage, def.channel)

    if (def.applies) target.statuses.push({ kind: def.applies, ticks: Math.round(3 * TICK_HZ) })

    if (def.quirks?.includes('reroute')) {
      target.statuses.push({ kind: 'tracked', ticks: Math.round(4 * TICK_HZ) })
      target.slaTicks += Math.round(2 * TICK_HZ)
    }
  }

  state.towers = survivors
}

function stepPlayers(state: GameState): void {
  for (const player of Object.values(state.players)) {
    if (!player.connected) continue

    const moving = player.move.x !== 0 || player.move.y !== 0
    const len = Math.hypot(player.move.x, player.move.y) || 1
    if (moving) {
      player.pos.x = clamp(player.pos.x + (player.move.x / len) * PLAYER_SPEED * DT, 0.5, GRID_W - 1.5)
      player.pos.y = clamp(player.pos.y + (player.move.y / len) * PLAYER_SPEED * DT, 0.5, GRID_H - 1.5)
    }

    for (const slot of player.abilities) {
      if (slot.cooldown > 0) slot.cooldown--
      void cooldownScale
      if (slot.channelling > 0) {
        if (moving) {
          slot.channelling = 0
          pushLog(state, `${player.name} was interrupted. Of course they were.`)
          state.events.push({ kind: 'bark', at: { ...player.pos }, text: 'no NO no—', playerId: player.id })
        } else {
          slot.channelling--
          if (slot.channelling === 0) resolveCompCycle(state, player)
        }
      }
    }

    tickFlyBy(state, player, moving)
    tickMetrics(state, player)
    tickHeroBody(state, player)

    if (state.phase === 'wave') {
      heroAttack(state, player)
      requestsFightBack(state, player)
    }

    // Walking over a drop picks it up. No inventory dance mid-wave.
    for (const drop of [...state.loot]) {
      if (Math.hypot(drop.pos.x - player.pos.x, drop.pos.y - player.pos.y) > 1.2) continue
      player.hero.bag.push(drop.artifact)
      state.loot = state.loot.filter((l) => l.id !== drop.id)
      state.events.push({
        kind: 'pickup',
        at: { ...player.pos },
        playerId: player.id,
        text: drop.artifact.name,
      })
      pushLog(state, `${player.name} picked up ${drop.artifact.name}.`)
    }
  }

  if (state.overclockTicks > 0) {
    state.overclockTicks--
    if (state.overclockTicks === 0) {
      state.maintenanceTicks = Math.round(8 * TICK_HZ)
      pushLog(state, 'Go-live is over. Maintenance window. Everything automated is dark for eight seconds.')
    }
  }
}

function resolveCompCycle(state: GameState, player: Player): void {
  if (!player.role) return
  const role = getRole(player.role)
  const ability = role.abilities.find((a) => a.kind === 'channel_nuke')
  const damage = (ability?.damage ?? 900) * player.ownershipPenalty
  let hits = 0
  for (const req of [...state.requests]) {
    if (req.hp <= 0) continue
    hits++
    damageRequest(state, req, damage / Math.max(1, Math.sqrt(state.requests.length)), 'human', player.role)
  }
  pushLog(state, `THE COMP CYCLE IS COMPLETE. ${hits} open items addressed. ${player.name} needs a minute.`)
  state.events.push({ kind: 'ability', at: { ...player.pos }, text: 'COMP CYCLE', playerId: player.id })
}

function decayAuras(state: GameState): void {
  for (const aura of state.auras) aura.ticks--
  state.auras = state.auras.filter((a) => a.ticks > 0)
}

function endWave(state: GameState): void {
  const wave = WAVES[state.waveIndex]
  if (!wave) return
  state.budget += wave.budgetReward

  const total = state.stats.resolved + state.stats.breached
  state.stats.slaCompliance = total > 0 ? state.stats.resolved / total : 1

  state.events.push({ kind: 'wave_end', at: { x: 20, y: 12 }, text: wave.name })
  pushLog(state, `Wave clear: ${wave.name}. +${wave.budgetReward} Budget.`)

  const rng = createRng(state.rngState)
  pushLog(state, pick(rng, TICKER_LINES))
  state.rngState = rng.state

  if (state.waveIndex >= WAVES.length - 1) {
    state.phase = 'victory'
    state.phaseTicks = -1
    pushLog(state, 'You survived Open Enrollment. Nobody will ever know how close it was.')
    return
  }

  state.waveIndex++
  state.phase = 'steering'
  state.phaseTicks = Math.round(STEERING_SECONDS * TICK_HZ)
}

/**
 * Requests and Stakeholders engage a hero standing in their way. Without this
 * the hero layer is a damage turret with no risk, and there is no reason to ever
 * retreat — which is the decision OTTTD-style heroes exist to create.
 */
function requestsFightBack(state: GameState, player: Player): void {
  if (state.tick % TICK_HZ !== 0) return
  if (player.hero.downedTicks > 0) return
  const role = getRole(player.role!)
  if (role.ignoredByRequests) return

  let damage = 0
  for (const req of state.requests) {
    if (req.hp <= 0) continue
    if (Math.hypot(req.pos.x - player.pos.x, req.pos.y - player.pos.y) > 1.1) continue
    const def = getRequest(req.type)
    damage += def.moraleDamage * (req.escalated ? 2.4 : 1) * 1.5
  }
  for (const s of state.stakeholders) {
    if (s.hp <= 0) continue
    if (Math.hypot(s.pos.x - player.pos.x, s.pos.y - player.pos.y) > 1.6) continue
    damage += 9
  }
  if (damage > 0) damageHero(state, player, damage)
}

/** Drops decay so the floor does not silt up over a long run. */
function stepLoot(state: GameState): void {
  for (const drop of state.loot) drop.ticks--
  state.loot = state.loot.filter((l) => l.ticks > 0)
}

function stepWalls(state: GameState): void {
  for (const wall of state.walls) wall.ticks--
  state.walls = state.walls.filter((w) => w.ticks > 0)
}

function equipArtifact(state: GameState, playerId: PlayerId, artifactId: string): string | null {
  const player = state.players[playerId]
  if (!player?.role) return 'Not in this room.'
  const index = player.hero.bag.findIndex((a) => a.id === artifactId)
  if (index === -1) return 'Not in your bag.'
  const artifact = player.hero.bag[index]!
  const current = player.hero.equipment[artifact.slot]
  player.hero.equipment[artifact.slot] = artifact
  player.hero.bag.splice(index, 1)
  if (current) player.hero.bag.push(current)
  refreshHero(player.hero, player.role)
  return null
}

function unequipArtifact(state: GameState, playerId: PlayerId, slot: ArtifactSlot): string | null {
  const player = state.players[playerId]
  if (!player?.role) return 'Not in this room.'
  const current = player.hero.equipment[slot]
  if (!current) return 'Nothing equipped there.'
  player.hero.equipment[slot] = null
  player.hero.bag.push(current)
  refreshHero(player.hero, player.role)
  return null
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// ──────────────────────────────────────────────────────────────────── intents

export function applyIntent(state: GameState, playerId: PlayerId, intent: Intent): string | null {
  const player = state.players[playerId]

  switch (intent.t) {
    case 'join':
      return addPlayer(state, playerId, intent.name) ? null : 'Room is full.'

    case 'pick_role':
      if (!player) return 'Not in this room.'
      if (state.phase !== 'lobby') return 'Roles are locked once the day starts.'
      setRole(state, playerId, intent.role)
      return null

    case 'ready':
      if (!player) return 'Not in this room.'
      if (!player.role) return 'Pick a role first.'
      player.ready = intent.value
      return null

    case 'move':
      if (!player) return 'Not in this room.'
      player.move = { x: clamp(intent.x, -1, 1), y: clamp(intent.y, -1, 1) }
      return null

    case 'ability':
      if (!player) return 'Not in this room.'
      return castAbility(state, player, intent.key)

    case 'build':
      return buildTower(state, playerId, intent.tower, intent.tile)

    case 'upgrade':
      return upgradeTower(state, intent.towerId)

    case 'sell':
      return sellTower(state, intent.towerId)

    case 'unlock':
      return unlockTech(state, intent.tech)

    case 'talent': {
      if (!player?.role) return 'Not in this room.'
      return spendTalent(player.hero, player.role, intent.node)
    }

    case 'equip':
      return equipArtifact(state, playerId, intent.artifactId)

    case 'unequip':
      return unequipArtifact(state, playerId, intent.slot)

    case 'discard': {
      if (!player) return 'Not in this room.'
      player.hero.bag = player.hero.bag.filter((a) => a.id !== intent.artifactId)
      return null
    }

    case 'attack_move':
      if (!player) return 'Not in this room.'
      player.move = { x: clamp(intent.x, -1, 1), y: clamp(intent.y, -1, 1) }
      return null

    case 'start_wave':
      if (state.phase === 'briefing') {
        beginWave(state)
        return null
      }
      if (state.phase === 'steering') {
        beginBriefing(state)
        return null
      }
      return 'Nothing to start.'

    default:
      return 'Unknown intent.'
  }
}

function buildTower(
  state: GameState,
  playerId: PlayerId,
  type: string,
  tile: { x: number; y: number },
): string | null {
  const def = getTower(type)
  if (def.requires && !state.unlocked.includes(def.requires)) {
    return `${def.name} needs ${getTech(def.requires).name} first.`
  }
  if (state.towers.length >= state.towerSlots) return 'No free capacity. You would need headcount.'
  const x = Math.floor(tile.x)
  const y = Math.floor(tile.y)
  if (!isBuildable(x, y)) return 'Cannot build there.'
  if (state.towers.some((t) => t.tile.x === x && t.tile.y === y)) return 'Something is already there.'
  if (state.budget < def.cost) return `Not enough Budget (need ${def.cost}).`

  state.budget -= def.cost
  state.towers.push({
    id: state.nextEntityId++,
    type,
    tile: { x, y },
    level: 0,
    cooldown: 0,
    offline: false,
    builtBy: playerId,
    targetId: null,
    expiresIn: -1,
  })
  const player = state.players[playerId]
  if (player) player.stats.towersBuilt++
  state.events.push({ kind: 'build', at: { x: x + 0.5, y: y + 0.5 }, text: def.name, playerId })
  return null
}

function upgradeTower(state: GameState, towerId: number): string | null {
  const tower = state.towers.find((t) => t.id === towerId)
  if (!tower) return 'No such tower.'
  const def = getTower(tower.type)
  const upgrade = def.upgrades[tower.level]
  if (!upgrade) return 'Fully upgraded. There is no more roadmap.'
  if (state.budget < upgrade.cost) return `Not enough Budget (need ${upgrade.cost}).`
  if (state.socialCapital < upgrade.socialCost) {
    return `"Let's revisit this next quarter." (need ${upgrade.socialCost} Social Capital)`
  }
  state.budget -= upgrade.cost
  state.socialCapital -= upgrade.socialCost
  tower.level++
  state.events.push({
    kind: 'upgrade',
    at: { x: tower.tile.x + 0.5, y: tower.tile.y + 0.5 },
    text: upgrade.name,
  })
  return null
}

function sellTower(state: GameState, towerId: number): string | null {
  const index = state.towers.findIndex((t) => t.id === towerId)
  if (index === -1) return 'No such tower.'
  const tower = state.towers[index]!
  const def = getTower(tower.type)
  state.budget += Math.round(def.cost * SELL_REFUND)
  state.towers.splice(index, 1)
  return null
}

function unlockTech(state: GameState, techId: string): string | null {
  const check = canUnlock(techId, state.unlocked, state.socialCapital)
  if (!check.ok) return check.reason ?? 'Blocked.'
  const node = getTech(techId)
  state.socialCapital -= node.cost
  state.unlocked.push(techId)
  const rng = createRng(state.rngState)
  const line = pick(rng, CFO_APPROVALS)
  state.rngState = rng.state
  pushLog(state, `${node.name} approved. ${line}`)
  state.events.push({ kind: 'unlock', at: { x: 20, y: 12 }, text: node.name })
  return null
}

export { addPlayer, removePlayer, recomputeOwnership, setRole }
