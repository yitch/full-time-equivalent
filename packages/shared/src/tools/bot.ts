/**
 * A scripted auto-player, shared by the balance report and the balance
 * regression test. It is deliberately mediocre: it buys along one fixed path,
 * chases whatever is closest to the door, and fires abilities off cooldown.
 *
 * Treat its results as a floor, not a ceiling. If the floor cannot clear wave 3,
 * the early game is overtuned; if it sails through Open Enrollment untouched,
 * the boss is not doing its job.
 */
import { LANES, TECH, TOWERS, TOWER_IDS, WAVES, isBuildable, pointAt } from '../content/index.js'
import { TICK_HZ } from '../constants.js'
import { applyIntent, createGame, step } from '../sim/index.js'
import type { GameState, RoleId, TechId, TowerTypeId, Vec2 } from '../types.js'

const ROLES_IN_LOBBY: RoleId[] = ['hris', 'travel', 'payroll']

/** Tiles the bot will try, in preference order: near lanes, spread across the floor. */
function candidateTiles(): Vec2[] {
  const samples: Vec2[] = []
  for (const lane of LANES) {
    for (let d = 0; d < 60; d += 0.5) samples.push(pointAt(lane.index, d))
  }
  const tiles: Vec2[] = []
  for (let y = 1; y < 23; y++) {
    for (let x = 1; x < 39; x++) {
      if (!isBuildable(x, y)) continue
      let best = Infinity
      for (const s of samples) best = Math.min(best, Math.hypot(s.x - x, s.y - y))
      if (best <= 3.2) tiles.push({ x, y })
    }
  }
  // Stride through the list so consecutive placements land far apart. Taking
  // tiles in scan order piles every tower into one corner and the run reports a
  // coverage problem as a balance problem.
  const spread: Vec2[] = []
  const seen = new Set<number>()
  for (let i = 0; i < tiles.length; i++) {
    const index = (i * 7919) % tiles.length
    if (seen.has(index)) continue
    seen.add(index)
    spread.push(tiles[index]!)
  }
  return spread
}

/** Cheapest-first, but always prefers a tower we do not have enough of yet. */
function chooseTower(state: GameState): TowerTypeId | null {
  const buildable = TOWER_IDS.filter((id) => {
    const def = TOWERS[id]
    if (!def) return false
    if (def.requires && !state.unlocked.includes(def.requires)) return false
    return def.cost <= state.budget
  })
  if (buildable.length === 0) return null
  return buildable.sort((a, b) => (TOWERS[b]!.cost ?? 0) - (TOWERS[a]!.cost ?? 0))[0] ?? null
}

/**
 * The intended progression path, and the bot's shopping list. Keeping this here
 * doubles as documentation: if a content change makes this order wrong, the
 * balance run regresses and says so.
 */
const TECH_PRIORITY: TechId[] = [
  'inbox',
  'ticketing',
  'kb',
  'selfservice',
  'casemgmt',
  'townhall',
  'enablement',
  'chatbot',
  'sso',
  'triage',
  'hrfin',
  'plainpolicy',
  'masterdata',
  'aiagent',
  'rpa',
  'justsayno',
]

function botSpend(state: GameState, tiles: Vec2[]): void {
  // Walk the priority list and stop at the first thing we cannot yet afford —
  // that models saving credibility for a business case rather than frittering it.
  for (const id of TECH_PRIORITY) {
    if (state.unlocked.includes(id)) continue
    const node = TECH[id]
    if (!node) continue
    if (node.requires.some((r) => !state.unlocked.includes(r))) continue
    if (state.socialCapital < node.cost) break
    applyIntent(state, 'bot', { t: 'unlock', tech: id })
  }

  // If capacity is full but we can afford something much better, replace the
  // weakest thing on the floor. A human would; a fair floor should too.
  const best = chooseTower(state)
  if (best && state.towers.length >= state.towerSlots) {
    const weakest = [...state.towers].sort((a, b) => (TOWERS[a.type]?.cost ?? 0) - (TOWERS[b.type]?.cost ?? 0))[0]
    if (weakest && (TOWERS[weakest.type]?.cost ?? 0) < (TOWERS[best]?.cost ?? 0) / 2) {
      applyIntent(state, 'bot', { t: 'sell', towerId: weakest.id })
    }
  }

  let guard = 0
  while (state.towers.length < state.towerSlots && guard++ < 40) {
    const tower = chooseTower(state)
    if (!tower) break
    const tile = tiles.find(
      (t) => !state.towers.some((existing) => existing.tile.x === t.x && existing.tile.y === t.y),
    )
    if (!tile) break
    if (applyIntent(state, 'bot', { t: 'build', tower, tile })) break
  }

  // Then pour leftover budget into upgrades.
  for (const tower of state.towers) {
    applyIntent(state, 'bot', { t: 'upgrade', towerId: tower.id })
  }
}

/**
 * In-wave behaviour: walk to whatever is closest to the door and fire everything
 * off cooldown. Crude, but it exercises contact damage and abilities, which is
 * most of a real player's output in the early waves.
 */
function botFight(state: GameState): void {
  if (state.tick % 6 !== 0) return

  for (const player of Object.values(state.players)) {
    let target = null as null | { pos: Vec2; progress: number }
    for (const req of state.requests) {
      if (req.hp <= 0 || !req.revealed) continue
      if (!target || req.progress > target.progress) target = { pos: req.pos, progress: req.progress }
    }
    if (target) {
      const dx = target.pos.x - player.pos.x
      const dy = target.pos.y - player.pos.y
      const len = Math.hypot(dx, dy) || 1
      applyIntent(state, player.id, { t: 'move', x: dx / len, y: dy / len })
    } else {
      applyIntent(state, player.id, { t: 'move', x: 0, y: 0 })
    }

    // Total Rewards' channel breaks on movement, so the bot never casts it.
    for (const key of ['Q', 'W', 'E'] as const) {
      applyIntent(state, player.id, { t: 'ability', key })
    }
  }
}


export interface RunResult {
  state: GameState
  wavesCleared: number
  towerDamageShare: number
}

/** Plays a full campaign and returns the final state. Deterministic per seed. */
export interface RunOptions {
  /** Joins and readies up, then does nothing at all. Models the null strategy. */
  passive?: boolean
  onWave?: (state: GameState) => void
}

export function playRun(seed: number, roles: RoleId[] = ROLES_IN_LOBBY, options: RunOptions = {}): RunResult {
  const { passive = false, onWave } = options
  const state = createGame(seed)
  const tiles = candidateTiles()

  roles.forEach((role, index) => {
    const id = index === 0 ? 'bot' : `bot${index}`
    applyIntent(state, id, { t: 'join', name: `Bot ${index + 1}` })
    applyIntent(state, id, { t: 'pick_role', role })
    applyIntent(state, id, { t: 'ready', value: true })
  })

  let lastWave = -1
  let guard = 0
  const maxTicks = TICK_HZ * 60 * 40

  while (guard++ < maxTicks) {
    const phase: string = state.phase
    if (phase === 'gameover' || phase === 'victory') break
    if (phase === 'briefing' || phase === 'steering') {
      if (!passive) botSpend(state, tiles)
      applyIntent(state, 'bot', { t: 'start_wave' })
    }
    if (phase === 'wave' && !passive) botFight(state)
    step(state)

    const after: string = state.phase
    if (state.waveIndex !== lastWave && (after === 'steering' || after === 'victory')) {
      lastWave = state.waveIndex
      onWave?.(state)
    }
  }

  const total = state.stats.damageByTowers + state.stats.damageByPlayers
  return {
    state,
    wavesCleared: state.phase === 'victory' ? WAVES.length : state.waveIndex,
    towerDamageShare: total > 0 ? state.stats.damageByTowers / total : 0,
  }
}
