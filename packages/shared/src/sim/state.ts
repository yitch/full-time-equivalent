import {
  DUPLICATE_ROLE_PENALTY,
  MAX_PLAYERS,
  START_BUDGET,
  START_COMPLIANCE,
  START_MORALE,
  START_SOCIAL_CAPITAL,
} from '../constants.js'
import { STARTING_HEADCOUNT, STARTING_TECH, getRole } from '../content/index.js'
import { createHero, refreshHero } from '../progression.js'
import type { GameState, Player, PlayerId, RoleId } from '../types.js'

export function createGame(seed: number): GameState {
  return {
    tick: 0,
    seed,
    rngState: seed >>> 0,
    phase: 'lobby',
    phaseTicks: -1,
    waveIndex: 0,
    waveTick: 0,
    spawnCursor: 0,
    pending: [],
    pendingStakeholders: [],

    morale: START_MORALE,
    compliance: START_COMPLIANCE,
    budget: START_BUDGET,
    socialCapital: START_SOCIAL_CAPITAL,

    players: {},
    requests: [],
    towers: [],
    unlocked: [...STARTING_TECH],

    maintenanceTicks: 0,
    stakeholders: [],
    loot: [],
    interns: [],
    breachedTypes: [],
    walls: [],
    auras: [],
    overclockTicks: 0,
    overclockAmount: 1,
    headcount: {
      approved: STARTING_HEADCOUNT,
      requisitions: [],
      exits: [],
      lastSalary: 0,
    },
    storedDamage: {},

    nextEntityId: 1,
    stats: {
      resolved: 0,
      breached: 0,
      deflected: 0,
      firstContactResolved: 0,
      escalations: 0,
      slaCompliance: 1,
      damageByTowers: 0,
      damageByPlayers: 0,
    },
    events: [],
    log: ['Floor 3 — Shared Services. Coffee is in the corner. Good luck.'],
  }
}

export function addPlayer(state: GameState, id: PlayerId, name: string): Player | null {
  const existing = state.players[id]
  if (existing) {
    existing.connected = true
    return existing
  }
  if (Object.keys(state.players).length >= MAX_PLAYERS) return null
  const player: Player = {
    id,
    name: name.slice(0, 18) || 'New Starter',
    role: null,
    ready: false,
    connected: true,
    pos: { x: 20, y: 12 },
    move: { x: 0, y: 0 },
    abilities: [],
    ownershipPenalty: 1,
    stats: {
      resolved: 0,
      deflected: 0,
      escalationsPrevented: 0,
      towersBuilt: 0,
      socialCapitalEarned: 0,
      kills: 0,
      stakeholdersManaged: 0,
      timesDowned: 0,
      damageDealt: 0,
    },
    // Placeholder until a role is picked; setRole rebuilds it properly.
    hero: createHero('mouse'),
    profileId: null,
    killsByType: {},
    stillTicks: 0,
    shield: 0,
    recharging: false,
    pendingNuke: null,
  }
  state.players[id] = player
  return player
}

export function setRole(state: GameState, id: PlayerId, role: RoleId, startLevel = 1): void {
  const player = state.players[id]
  if (!player) return
  player.role = role
  player.hero = createHero(role, startLevel)
  refreshHero(player.hero, role)
  const def = getRole(role)
  player.abilities = def.abilities.map((a) => ({
    id: a.id,
    cooldown: 0,
    disabled: false,
    channelling: 0,
    stored: 0,
  }))
  recomputeOwnership(state)
}

/**
 * Two people on the same role is not forbidden, it is just worse — which is
 * exactly how it works in a real team, and is the cheapest balance lever we have.
 */
export function recomputeOwnership(state: GameState): void {
  const seen = new Map<RoleId, number>()
  for (const player of Object.values(state.players)) {
    if (!player.role) {
      player.ownershipPenalty = 1
      continue
    }
    const count = (seen.get(player.role) ?? 0) + 1
    seen.set(player.role, count)
    player.ownershipPenalty = count === 1 ? 1 : DUPLICATE_ROLE_PENALTY ** (count - 1)
  }
}

export function removePlayer(state: GameState, id: PlayerId): void {
  const player = state.players[id]
  if (!player) return
  player.connected = false
  player.move = { x: 0, y: 0 }
}

export function pushLog(state: GameState, line: string): void {
  state.log.push(line)
  if (state.log.length > 40) state.log.shift()
}
