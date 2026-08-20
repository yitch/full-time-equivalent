/**
 * A scripted auto-player, shared by the balance report and the balance
 * regression test. It is deliberately mediocre: it buys along one fixed path,
 * chases whatever is closest to the door, and fires abilities off cooldown.
 *
 * Treat its results as a floor, not a ceiling. If the floor cannot clear wave 3,
 * the early game is overtuned; if it sails through Open Enrollment untouched,
 * the boss is not doing its job.
 */
import {
  LANES,
  RECHARGE_POINTS,
  REQUESTS,
  ROLES,
  TALENT_TREES,
  TECH,
  TOWERS,
  TOWER_IDS,
  WAVES,
  isBuildable,
  pointAt,
} from '../content/index.js'
import { artifactScore, spendTalent } from '../progression.js'
import { HEADCOUNT_COST, requisitionCost, requisitionSetupCost } from '../content/index.js'
import { headcountFree } from '../sim/headcount.js'
import { TICK_HZ } from '../constants.js'
import { applyIntent, createGame, step } from '../sim/index.js'
import type { GameState, RoleId, TechId, TowerTypeId, Vec2 } from '../types.js'

const ROLES_IN_LOBBY: RoleId[] = ['puffin', 'rhino', 'viper']

/**
 * Candidate build tiles, ordered by greedy set cover over the three lanes.
 *
 * Two earlier versions were worse for instructive reasons. Striding through the
 * list at a fixed interval meant any map change reshuffled every placement, so
 * the balance numbers moved for reasons that were not balance. Sorting by raw
 * coverage piled every tower where the lanes converge, which kills things at the
 * door instead of along the route.
 *
 * Greedy set cover picks the tile covering the most *not-yet-covered* lane, which
 * is what a competent player does: cover the whole walk, not the best spot.
 */
function candidateTiles(): Vec2[] {
  const samples: Vec2[] = []
  for (const lane of LANES) {
    for (let d = 0; d < 60; d += 0.75) samples.push(pointAt(lane.index, d))
  }

  const tiles: { tile: Vec2; covers: number[] }[] = []
  for (let y = 1; y < 23; y++) {
    for (let x = 1; x < 39; x++) {
      if (!isBuildable(x, y)) continue
      const covers: number[] = []
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!
        if (Math.hypot(s.x - x, s.y - y) <= 6) covers.push(i)
      }
      if (covers.length > 0) tiles.push({ tile: { x, y }, covers })
    }
  }

  const covered = new Set<number>()
  const order: Vec2[] = []
  const taken = new Set<number>()

  // Enough picks for any plausible establishment, then the rest as fallback.
  for (let pick = 0; pick < 40; pick++) {
    let best = -1
    let bestGain = 0
    for (let i = 0; i < tiles.length; i++) {
      if (taken.has(i)) continue
      let gain = 0
      for (const c of tiles[i]!.covers) if (!covered.has(c)) gain++
      if (gain > bestGain) {
        bestGain = gain
        best = i
      }
    }
    if (best === -1) break
    taken.add(best)
    for (const c of tiles[best]!.covers) covered.add(c)
    order.push(tiles[best]!.tile)
    // Once the whole route is covered, start again so later towers double up.
    if (covered.size >= samples.length) covered.clear()
  }

  for (let i = 0; i < tiles.length; i++) if (!taken.has(i)) order.push(tiles[i]!.tile)
  return order
}

/** Cheapest-first, but always prefers a tower we do not have enough of yet. */
/**
 * Best tower we can actually put up right now — which means affordable in Budget
 * *and* in headcount. Forgetting the second one makes the bot try, fail, and
 * stop building entirely, which reads as a balance change when it is a bug.
 */
/**
 * The best tower we could build if headcount were not in the way. Used to decide
 * whether it is worth closing an existing process to make room for a better one.
 */
function bestUnlockedTower(state: GameState): TowerTypeId | null {
  const options = TOWER_IDS.filter((id) => {
    const def = TOWERS[id]
    if (!def) return false
    if (def.requires && !state.unlocked.includes(def.requires)) return false
    return def.cost <= state.budget
  })
  if (options.length === 0) return null
  return options.sort((a, b) => (TOWERS[b]!.cost ?? 0) - (TOWERS[a]!.cost ?? 0))[0] ?? null
}

function chooseTower(state: GameState): TowerTypeId | null {
  const free = headcountFree(state)
  const buildable = TOWER_IDS.filter((id) => {
    const def = TOWERS[id]
    if (!def) return false
    if (def.requires && !state.unlocked.includes(def.requires)) return false
    if (def.cost > state.budget) return false
    return HEADCOUNT_COST[def.channel] <= free
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

  // Raise a req when capacity is the thing stopping us, and we can still afford
  // to make the case. Reqs take three waves, so the bot has to ask early.
  if (
    headcountFree(state) < 2 &&
    state.headcount.requisitions.length < 2 &&
    state.socialCapital > requisitionCost(state.headcount.approved) + 25 &&
    state.budget > requisitionSetupCost(state.headcount.approved) + 200
  ) {
    applyIntent(state, 'bot', { t: 'raise_req' })
  }

  // Decommission to upgrade. Once the establishment is full of cheap early
  // towers, the only way to afford a better one is to close an old process and
  // free the person running it — which is the whole headcount loop, and the bot
  // has to do it or it stays on wave-one technology all campaign.
  for (let swap = 0; swap < 4; swap++) {
    const want = bestUnlockedTower(state)
    if (!want) break
    const wantDef = TOWERS[want]!
    if (headcountFree(state) >= HEADCOUNT_COST[wantDef.channel]) break

    const weakest = [...state.towers]
      .filter((t) => t.expiresIn <= 0)
      .sort((a, b) => (TOWERS[a.type]?.cost ?? 0) - (TOWERS[b.type]?.cost ?? 0))[0]
    if (!weakest) break
    if ((TOWERS[weakest.type]?.cost ?? 0) >= wantDef.cost / 2) break
    applyIntent(state, 'bot', { t: 'sell', towerId: weakest.id })
  }

  let guard = 0
  while (guard++ < 40) {
    const tower = chooseTower(state)
    if (!tower) break
    const tile = tiles.find(
      (t) => !state.towers.some((existing) => existing.tile.x === t.x && existing.tile.y === t.y),
    )
    if (!tile) break
    // A single refusal is not a reason to stop building; try the next tile.
    if (applyIntent(state, 'bot', { t: 'build', tower, tile }) !== null) continue
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
/** Closest place to get your Bandwidth back. */
function nearestRecharge(pos: { x: number; y: number }) {
  let best = null as (typeof RECHARGE_POINTS)[number] | null
  let bestD = Infinity
  for (const point of RECHARGE_POINTS) {
    const d = Math.hypot(point.tile.x + 0.5 - pos.x, point.tile.y + 0.5 - pos.y)
    if (d < bestD) {
      bestD = d
      best = point
    }
  }
  return best
}

function botFight(state: GameState): void {
  if (state.tick % 6 !== 0) return

  for (const player of Object.values(state.players)) {
    if (player.hero.downedTicks > 0) continue

    // Out of bandwidth: go and get a coffee. Standing in the fight with nothing
    // to spend is worse than spending twenty seconds at the water cooler.
    const hero = player.hero
    const depleted = hero.bandwidth < hero.maxBandwidth * 0.15
    const topped = hero.bandwidth > hero.maxBandwidth * 0.85
    if (depleted) player.recharging = true
    if (topped) player.recharging = false
    if (player.recharging) {
      const point = nearestRecharge(player.pos)
      if (point) {
        const dx = point.tile.x + 0.5 - player.pos.x
        const dy = point.tile.y + 0.5 - player.pos.y
        const len = Math.hypot(dx, dy) || 1
        applyIntent(state, player.id, { t: 'move', x: dx / len, y: dy / len })
        continue
      }
    }

    // Priority order, which is also the advice you would give a new player:
    //   1. Stakeholders — they degrade the machine and only a person can stop them
    //   2. Compliance threats — quiet, slow, and they end runs
    //   3. Whatever is closest to the door
    let target: { pos: { x: number; y: number } } | null = null

    let bestStake = Infinity
    for (const s of state.stakeholders) {
      if (s.hp <= 0) continue
      const d = Math.hypot(s.pos.x - player.pos.x, s.pos.y - player.pos.y)
      if (d < bestStake) {
        bestStake = d
        target = s
      }
    }

    if (!target) {
      let bestCompliance = -Infinity
      for (const req of state.requests) {
        if (req.hp <= 0) continue
        const def = REQUESTS[req.type]
        if (!def?.complianceDamage) continue
        if (!req.revealed && !ROLES[player.role!]!.seesStealth) continue
        if (req.progress > bestCompliance) {
          bestCompliance = req.progress
          target = req
        }
      }
    }

    if (!target) {
      let leading = -Infinity
      for (const req of state.requests) {
        if (req.hp <= 0 || !req.revealed) continue
        if (req.progress > leading) {
          leading = req.progress
          target = req
        }
      }
    }

    if (target) {
      const dx = target.pos.x - player.pos.x
      const dy = target.pos.y - player.pos.y
      const len = Math.hypot(dx, dy) || 1
      applyIntent(state, player.id, { t: 'move', x: dx / len, y: dy / len })
    } else {
      applyIntent(state, player.id, { t: 'move', x: 0, y: 0 })
    }

    for (const key of ['Q', 'W', 'E'] as const) {
      applyIntent(state, player.id, { t: 'ability', key })
    }

    // Spend talent points down the lean-in branch, and wear whatever drops.
    if (player.hero.talentPoints > 0 && player.role) {
      const tree = TALENT_TREES[player.role]
      if (tree) {
        for (const node of tree.nodes) {
          if (spendTalent(player.hero, player.role, node.id) === null) break
        }
      }
    }
    for (const item of [...player.hero.bag]) {
      const current = player.hero.equipment[item.slot]
      if (!current || artifactScore(item) > artifactScore(current)) {
        applyIntent(state, player.id, { t: 'equip', artifactId: item.id })
      } else {
        applyIntent(state, player.id, { t: 'discard', artifactId: item.id })
      }
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
      for (const player of Object.values(state.players)) {
        if (player.hero.pendingPerks.length === 0) continue
        applyIntent(state, player.id, { t: 'pick_perk', perk: player.hero.pendingPerks[0]! })
      }
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
