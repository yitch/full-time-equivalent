import { DT, TICK_HZ } from '../constants.js'
import { STAKEHOLDER_BARKS, getStakeholder, getTower, laneLength, pointAt } from '../content/index.js'
import { grantXp, rollArtifact } from '../progression.js'
import { chance, createRng, nextInt, pick } from '../rng.js'
import type { GameState, Player, RoleId, StakeholderEntity, TowerEntity } from '../types.js'
import { spawnRequest } from './combat.js'
import { hasLegendary } from './heroes.js'
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

export function spawnStakeholder(state: GameState, type: RoleId, lane: number): StakeholderEntity {
  const def = getStakeholder(type)
  const { r, done } = rng(state)
  const bark: string = pick(r, STAKEHOLDER_BARKS[type] ?? [''])
  done()

  const entity: StakeholderEntity = {
    id: state.nextEntityId++,
    type,
    lane,
    progress: 0,
    hp: def.hp,
    maxHp: def.hp,
    pos: pointAt(lane, 0),
    pulse: Math.round(def.interval * TICK_HZ),
    targetTowerId: null,
    spent: false,
    bark,
  }
  state.stakeholders.push(entity)
  state.events.push({
    kind: 'stakeholder',
    at: { ...entity.pos },
    text: `${def.name} — ${bark}`,
  })
  pushLog(state, `${def.name} has arrived. ${def.flavour}`)
  return entity
}

function nearestTower(state: GameState, s: StakeholderEntity, radius: number): TowerEntity | null {
  let best: TowerEntity | null = null
  let bestD = Infinity
  for (const tower of state.towers) {
    const d = Math.hypot(tower.tile.x + 0.5 - s.pos.x, tower.tile.y + 0.5 - s.pos.y)
    if (d < bestD && d <= radius) {
      bestD = d
      best = tower
    }
  }
  return best
}

/**
 * One interference pulse. This is the whole reason Stakeholders exist: they do
 * not race you to the door, they degrade the machine you built, which you cannot
 * answer by building more machine. You have to walk over and deal with it.
 */
function interfere(state: GameState, s: StakeholderEntity): void {
  const def = getStakeholder(s.type)
  const tower = nearestTower(state, s, def.radius)

  switch (def.interference) {
    case 'override':
    case 'shrink': {
      // Applied as a live lookup in resolveTowerStats, so nothing to mutate here.
      if (tower) s.targetTowerId = tower.id
      break
    }

    case 'disable': {
      if (!tower) break
      tower.offline = true
      s.targetTowerId = tower.id
      state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'blocked', amount: tower.id })
      break
    }

    case 'destroy': {
      if (!tower) break
      const index = state.towers.findIndex((t) => t.id === tower.id)
      if (index >= 0) {
        state.towers.splice(index, 1)
        pushLog(state, `${def.name} had ${getTower(tower.type).name} removed. It is not coming back.`)
        state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'REMOVED' })
      }
      break
    }

    case 'downgrade': {
      if (!tower || tower.level <= 0) break
      tower.level--
      state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'reverted' })
      break
    }

    case 'generate': {
      const { r, done } = rng(state)
      const lane = nextInt(r, 0, 2)
      done()
      spawnRequest(state, s.type === 'puffin' ? 'onboarding_packet' : 'policy_question', lane)
      state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'and another thing' })
      break
    }

    case 'drain_budget': {
      const taken = Math.min(state.budget, 18)
      state.budget -= taken
      if (taken > 0) state.events.push({ kind: 'interference', at: { ...s.pos }, text: `-$${taken}` })
      break
    }

    case 'drain_social': {
      const taken = Math.min(state.socialCapital, 3)
      state.socialCapital -= taken
      if (taken > 0) state.events.push({ kind: 'interference', at: { ...s.pos }, text: `-${taken} SC` })
      break
    }

    case 'rally': {
      for (const req of state.requests) {
        if (req.hp <= 0) continue
        const d = Math.hypot(req.pos.x - s.pos.x, req.pos.y - s.pos.y)
        if (d > def.radius) continue
        req.hp = Math.min(req.maxHp, req.hp + req.maxHp * 0.06)
        req.slaTicks += Math.round(1.5 * TICK_HZ)
      }
      state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'let us revisit' })
      break
    }

    case 'unload': {
      state.morale = Math.max(0, state.morale - def.moraleDamage)
      state.events.push({ kind: 'interference', at: { ...s.pos }, text: 'ONE OBSERVATION', amount: -def.moraleDamage })
      pushLog(state, `${def.name} unloaded and left. Morale -${def.moraleDamage}.`)
      s.spent = true
      break
    }
  }
}

/** True while a Stakeholder is suppressing this tower's output. */
export function overrideFactor(state: GameState, tower: TowerEntity): { damage: number; range: number } {
  let damage = 1
  let range = 1
  for (const s of state.stakeholders) {
    if (s.hp <= 0) continue
    const def = getStakeholder(s.type)
    if (def.interference !== 'override' && def.interference !== 'shrink') continue
    const d = Math.hypot(tower.tile.x + 0.5 - s.pos.x, tower.tile.y + 0.5 - s.pos.y)
    if (d > def.radius) continue
    if (def.interference === 'override') damage *= 0.6
    else range *= 0.55
  }
  return { damage, range }
}

export function stepStakeholders(state: GameState): void {
  const survivors: StakeholderEntity[] = []

  for (const s of state.stakeholders) {
    if (s.hp <= 0) {
      killStakeholder(state, s)
      continue
    }
    if (s.spent) {
      state.events.push({ kind: 'bark', at: { ...s.pos }, text: 'must dash' })
      continue
    }

    const def = getStakeholder(s.type)
    s.progress += def.speed * DT
    const total = laneLength(s.lane)

    if (s.progress >= total) {
      state.morale = Math.max(0, state.morale - def.moraleDamage)
      if (def.complianceDamage > 0) {
        state.compliance = Math.max(0, state.compliance - def.complianceDamage)
      }
      state.events.push({ kind: 'breach', at: pointAt(s.lane, total), amount: -def.moraleDamage })
      pushLog(state, `${def.name} reached the CHRO. That conversation is happening without you.`)
      continue
    }

    s.pos = pointAt(s.lane, s.progress)

    s.pulse--
    if (s.pulse <= 0) {
      s.pulse = Math.round(def.interval * TICK_HZ)
      interfere(state, s)
    }

    survivors.push(s)
  }

  state.stakeholders = survivors

  // A disabled tower comes back the moment nothing is sitting on it.
  for (const tower of state.towers) {
    if (!tower.offline) continue
    const blocked = state.stakeholders.some((s) => {
      if (s.hp <= 0) return false
      const def = getStakeholder(s.type)
      if (def.interference !== 'disable') return false
      return Math.hypot(tower.tile.x + 0.5 - s.pos.x, tower.tile.y + 0.5 - s.pos.y) <= def.radius
    })
    if (!blocked && state.maintenanceTicks <= 0) tower.offline = false
  }
}

function killStakeholder(state: GameState, s: StakeholderEntity): void {
  const def = getStakeholder(s.type)
  state.stats.resolved++

  // Credit goes to whoever is standing closest — crude, but it keeps the
  // reward attached to the person who physically went and dealt with it.
  let closest: Player | null = null
  let bestD = Infinity
  for (const player of Object.values(state.players)) {
    if (!player.connected || !player.role) continue
    const d = Math.hypot(player.pos.x - s.pos.x, player.pos.y - s.pos.y)
    if (d < bestD) {
      bestD = d
      closest = player
    }
  }

  let social = def.socialCapital
  if (closest?.role) {
    closest.stats.stakeholdersManaged++
    if (hasLegendary(closest, 'kingmaker')) social *= 2
    state.socialCapital += social
    closest.stats.socialCapitalEarned += social
  }

  state.budget += Math.round(def.hp * 0.12)

  for (const player of Object.values(state.players)) {
    if (!player.connected || !player.role) continue
    if (grantXp(player.hero, player.role, def.xp) > 0) {
      state.events.push({
        kind: 'levelup',
        at: { ...player.pos },
        playerId: player.id,
        amount: player.hero.level,
        text: `LEVEL ${player.hero.level}`,
      })
    }
  }
  state.events.push({ kind: 'resolve', at: { ...s.pos }, amount: social, text: 'managed' })
  pushLog(state, `${def.name} has been managed. +${Math.round(social)} Social Capital.`)

  const { r, done } = rng(state)
  const drops = chance(r, def.dropChance)
  if (drops) {
    const artifact = rollArtifact(r, state.waveIndex + 1, 0)
    state.loot.push({
      id: state.nextEntityId++,
      artifact,
      pos: { ...s.pos },
      ticks: TICK_HZ * 45,
    })
    state.events.push({ kind: 'drop', at: { ...s.pos }, text: artifact.name })
  }
  done()
}
