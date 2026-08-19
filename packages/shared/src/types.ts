/** Core data model. Everything here is JSON-serialisable — snapshots go over the wire as-is. */

// ─────────────────────────────────────────────────────────────── ids & channels

export type PlayerId = string
export type EntityId = number
export type RequestTypeId = string
export type TowerTypeId = string
export type TechId = string
export type RoleId =
  | 'hrbp'
  | 'payroll'
  | 'talent'
  | 'rewards'
  | 'hris'
  | 'travel'

/**
 * Damage channels. Every source deals through exactly one; every request has a
 * resistance multiplier per channel. This is the whole combat model.
 */
export type Channel = 'automation' | 'process' | 'human' | 'specialist'

export const CHANNELS: readonly Channel[] = ['automation', 'process', 'human', 'specialist']

export type Resistances = Record<Channel, number>

export interface Vec2 {
  x: number
  y: number
}

// ───────────────────────────────────────────────────────────────── definitions

export interface RequestDef {
  id: RequestTypeId
  name: string
  /** Shown in the codex + on hover. Should be funny and true. */
  flavour: string
  hp: number
  /** Tiles per second. */
  speed: number
  resist: Resistances
  /** Morale drained if it reaches the CHRO door. */
  moraleDamage: number
  /** Compliance drained instead of morale, if set. ER cases use this. */
  complianceDamage?: number
  /** Seconds before it escalates. */
  slaSeconds: number
  /** Invisible to towers until revealed. */
  stealth?: boolean
  /** Splits into N copies at half hp when damaged by a non-specialist channel. */
  splitsInto?: number
  /** Only a role with this id can deal `specialist` damage to it. */
  specialistRole?: RoleId
  /** Social Capital awarded for an in-SLA resolve. */
  socialCapital: number
  /** Budget awarded on resolve. */
  bounty: number
  /** Elite/named requests get a badge and bespoke behaviour hooks. */
  elite?: boolean
  /** Behaviour hook keys handled in combat.ts. Keeps content data-only. */
  quirks?: RequestQuirk[]
  /** Sprite key for the renderer. */
  sprite: string
}

export type RequestQuirk =
  /** Healed rather than damaged by `automation`. */
  | 'heals_from_automation'
  /** Immune to `process` damage entirely. */
  | 'immune_process'
  /** Returns 25% of damage taken to the nearest player as a slow. */
  | 'reflects'
  /** Shares damage with the nearest other request. */
  | 'shares_damage'
  /** Wanders off-path laterally. */
  | 'erratic'
  /** Doubles instead of breaching when its cutoff clock expires. */
  | 'cutoff_split'

export interface TowerDef {
  id: TowerTypeId
  name: string
  flavour: string
  channel: Channel
  cost: number
  /** Tech node required before this can be built at all. */
  requires?: TechId
  /** Tiles. */
  range: number
  damage: number
  /** Shots per second. */
  fireRate: number
  targeting: TargetingMode
  /** Cannot damage requests carrying any of these tags. */
  cannotHit?: RequestTypeId[]
  /** Applies a status on hit. */
  applies?: StatusKind
  /** Behaviour hooks handled in combat.ts. */
  quirks?: TowerQuirk[]
  upgrades: TowerUpgrade[]
  sprite: string
}

export type TargetingMode = 'first' | 'last' | 'strongest' | 'weakest' | 'random'

export type TowerQuirk =
  /** 8% of shots heal the target instead. Ava. */
  | 'misroute'
  /** Disabled entirely during a Maintenance Window. */
  | 'fragile_uptime'
  /** Does not shoot. Reduces spawn counts at the source. */
  | 'prevention'
  /** Does not shoot. Deletes a share of Policy Questions at spawn. */
  | 'spawn_filter'
  /** Does not shoot. Nudges requests laterally between lanes. */
  | 'reroute'

export interface TowerUpgrade {
  name: string
  flavour: string
  cost: number
  socialCost: number
  damageMul: number
  rangeMul: number
  fireRateMul: number
}

export type StatusKind = 'tracked' | 'queued' | 'revealed' | 'slowed'

export interface TechNode {
  id: TechId
  name: string
  flavour: string
  branch: 'tier0' | 'casemgmt' | 'integration' | 'culture'
  /** Social Capital price. */
  cost: number
  requires: TechId[]
  /** Tower ids this node makes buildable. */
  unlocksTowers?: TowerTypeId[]
  /** Passive effect key, applied in sim. */
  passive?: TechPassive
  /** Grid position for the tech tree UI. */
  row: number
  col: number
}

export type TechPassive =
  | 'sc_per_deflection'
  | 'deescalation'
  | 'no_data_errors'
  | 'just_say_no'
  | 'automation_up'
  | 'sla_extension'

export interface AbilityDef {
  id: string
  name: string
  flavour: string
  key: 'Q' | 'W' | 'E' | 'R'
  cooldownSeconds: number
  /** Budget spent on cast. */
  budgetCost?: number
  /** Seconds of channel; interrupted by moving. */
  channelSeconds?: number
  kind: AbilityKind
  radius?: number
  damage?: number
  durationSeconds?: number
  amount?: number
}

export type AbilityKind =
  | 'buff_towers'
  | 'single_target'
  | 'slow_lane'
  | 'purge_tag'
  | 'grant_social'
  | 'summon_intern'
  | 'despawn'
  | 'cone'
  | 'store_damage'
  | 'channel_nuke'
  | 'repair_tower'
  | 'reveal'
  | 'overclock'
  | 'stop_split'
  | 'line_damage'
  | 'per_diem'

export interface RoleDef {
  id: RoleId
  name: string
  title: string
  flavour: string
  /** Multiplier applied to this role's `specialist` damage. */
  specialistPower: number
  /** Request type ids this role can hit with `specialist` damage. */
  specialistTargets: RequestTypeId[]
  seesStealth: boolean
  /** Requests will not target this player. Travel & Claims. */
  ignoredByRequests: boolean
  /** Cannot receive other players' buffs. Travel & Claims. */
  refusesBuffs: boolean
  /** Loses one random ability at the start of every wave. HRBP. */
  losesAbilityEachWave: boolean
  abilities: AbilityDef[]
  /** Base melee/contact damage the player deals via `human`. */
  contactDamage: number
  colour: string
  sprite: string
}

// ────────────────────────────────────────────────────────────────── wave script

export interface SpawnGroup {
  /** Seconds into the wave. */
  at: number
  requestType: RequestTypeId
  count: number
  lane: number
  /** Seconds between each spawn in the group. */
  spacing: number
}

export interface WaveDef {
  index: number
  name: string
  /** Shown on the briefing card. Comedy goes here. */
  briefing: string
  /** Teaching note, shown smaller. */
  teaches: string
  groups: SpawnGroup[]
  budgetReward: number
  boss?: boolean
  /** Seconds after the last spawn before the wave can end. */
  tailSeconds: number
  /** Windows during which automation towers are offline. */
  maintenanceWindows?: { at: number; seconds: number }[]
}

// ────────────────────────────────────────────────────────────────── live state

export interface StatusEffect {
  kind: StatusKind
  /** Ticks remaining. -1 = permanent. */
  ticks: number
  /** Magnitude, where the status has one (e.g. slow fraction). */
  amount?: number
}

/** A transient area effect emitted by a player ability. */
export interface Aura {
  pos: Vec2
  radius: number
  /** Fractional damage bonus applied to towers inside. */
  amount: number
  ticks: number
  ownerId: PlayerId
}

export interface RequestEntity {
  id: EntityId
  type: RequestTypeId
  lane: number
  /** Distance travelled along the lane path, in tiles. */
  progress: number
  /** Lateral offset from path centre, in tiles. Used by erratic + reroute. */
  offset: number
  hp: number
  maxHp: number
  /** Ticks remaining before escalation. */
  slaTicks: number
  escalated: boolean
  /** Ticks remaining on a payroll cutoff clock, or -1. */
  cutoffTicks: number
  statuses: StatusEffect[]
  /** True once a player has revealed a stealth request. */
  revealed: boolean
  /** Set when spawned by a split, so we don't infinitely split. */
  generation: number
  /** True once this request has already split, so it only ever splits once. */
  hasSplit: boolean
  /** Suppresses splitting entirely. Travel & Claims' "Receipt Required". */
  splitBlocked: boolean
  /** Speech bubble shown on spawn / escalation. */
  bark: string
  /** Cached position for renderer + targeting. */
  pos: Vec2
}

export interface TowerEntity {
  id: EntityId
  type: TowerTypeId
  tile: Vec2
  level: number
  /** Ticks until it can fire again. */
  cooldown: number
  /** Disabled by a Maintenance Window. */
  offline: boolean
  /** Who paid for it — used for the assist stat and nothing else. */
  builtBy: PlayerId | null
  targetId: EntityId | null
  /** Ticks until this tower despawns. -1 = permanent. Interns are temporary. */
  expiresIn: number
}

export interface AbilityState {
  id: string
  cooldown: number
  disabled: boolean
  /** Ticks remaining on a channel. */
  channelling: number
  stored: number
}

export interface Player {
  id: PlayerId
  name: string
  role: RoleId | null
  ready: boolean
  connected: boolean
  pos: Vec2
  /** Normalised movement intent, -1..1 each axis. */
  move: Vec2
  abilities: AbilityState[]
  /** Applied when two players share a role. */
  ownershipPenalty: number
  stats: PlayerStats
}

export interface PlayerStats {
  resolved: number
  deflected: number
  escalationsPrevented: number
  towersBuilt: number
  socialCapitalEarned: number
}

export type Phase = 'lobby' | 'briefing' | 'wave' | 'steering' | 'gameover' | 'victory'

export interface RunStats {
  resolved: number
  breached: number
  deflected: number
  firstContactResolved: number
  escalations: number
  /** Rolling 0..1. Drives the Engagement Survey boss. */
  slaCompliance: number
  /** Damage dealt by towers vs by players. The thesis says towers should win. */
  damageByTowers: number
  damageByPlayers: number
}

export interface GameEvent {
  /** Cleared every tick. Client renders FX and speech bubbles from these. */
  kind:
    | 'resolve'
    | 'deflect'
    | 'breach'
    | 'escalate'
    | 'split'
    | 'build'
    | 'upgrade'
    | 'unlock'
    | 'ability'
    | 'bark'
    | 'wave_start'
    | 'wave_end'
    | 'maintenance'
    | 'audit'
  at: Vec2
  text?: string
  amount?: number
  playerId?: PlayerId
  requestType?: RequestTypeId
}

export interface GameState {
  tick: number
  seed: number
  rngState: number
  phase: Phase
  /** Ticks remaining in the current phase, or -1 for indefinite. */
  phaseTicks: number
  waveIndex: number
  /** Ticks elapsed inside the current wave. */
  waveTick: number
  /** Indices into the current wave's groups that have already been queued. */
  spawnCursor: number
  /** Pending spawns, produced by groups and drained over time. */
  pending: { at: number; type: RequestTypeId; lane: number }[]

  morale: number
  compliance: number
  budget: number
  socialCapital: number

  players: Record<PlayerId, Player>
  requests: RequestEntity[]
  towers: TowerEntity[]
  unlocked: TechId[]

  /** Ticks remaining of a global automation blackout. */
  maintenanceTicks: number
  /** Transient tower buffs from abilities. */
  auras: Aura[]
  /** Global fire-rate multiplier from HRIS Go-Live. */
  overclockTicks: number
  overclockAmount: number
  /** Maximum number of towers that may exist. Talent Acquisition raises this. */
  towerSlots: number
  /** Damage banked by Total Rewards' Bonus Accrual, keyed by player. */
  storedDamage: Record<PlayerId, number>

  nextEntityId: EntityId
  stats: RunStats
  events: GameEvent[]
  /** Server-authored log line for the ticker at the bottom of the HUD. */
  log: string[]
}

// ──────────────────────────────────────────────────────────────────── intents

export type Intent =
  | { t: 'join'; name: string }
  | { t: 'pick_role'; role: RoleId }
  | { t: 'ready'; value: boolean }
  | { t: 'move'; x: number; y: number }
  | { t: 'build'; tower: TowerTypeId; tile: Vec2 }
  | { t: 'sell'; towerId: EntityId }
  | { t: 'upgrade'; towerId: EntityId }
  | { t: 'ability'; key: 'Q' | 'W' | 'E' | 'R'; target?: Vec2 }
  | { t: 'unlock'; tech: TechId }
  | { t: 'start_wave' }

export interface IntentEnvelope {
  playerId: PlayerId
  intent: Intent
}

// ──────────────────────────────────────────────────────────── wire protocol

export type ServerMessage =
  | { t: 'welcome'; playerId: PlayerId; roomCode: string; state: GameState }
  | { t: 'snapshot'; state: GameState }
  | { t: 'error'; message: string }

export type ClientMessage =
  | { t: 'hello'; name: string; roomCode?: string }
  | { t: 'intent'; intent: Intent }
