/**
 * Heroes, levelling and loot.
 *
 * Split out of types.ts because this is a whole subsystem: OTTTD-style deployed
 * heroes that walk the floor and fight, Diablo-style levels, talents and
 * affixed drops, and a persistent profile that survives the run.
 */

import type { AnimalId, EntityId, PlayerId, Vec2 } from './types.js'

// ─────────────────────────────────────────────────────────────────── stats

/**
 * Every number a hero has. Talents and artifact affixes both write into this
 * one bag, which is what makes "+8% tower range" and "+2 talent point" additive
 * in the same system rather than two parallel ones.
 */
export type StatKey =
  /** Hero attack and ability damage. */
  | 'power'
  /** Hero auto-attack reach, in tiles. */
  | 'reach'
  /** Hero attacks per second. */
  | 'attackSpeed'
  | 'maxHp'
  | 'moveSpeed'
  /** Fractional cooldown reduction, 0..0.6. */
  | 'cooldown'
  /** Flat damage reduction taken. */
  | 'armour'
  /** Multiplier on specialist damage — the class's counter identity. */
  | 'specialistPower'
  /** Buffs applied to every tower you own. */
  | 'towerDamage'
  | 'towerRange'
  /** Economy. */
  | 'socialGain'
  | 'budgetGain'
  | 'xpGain'
  /** Passive HP regained per second while not in combat. */
  | 'regen'
  /** Maximum Bandwidth — the pool every ability spends from. */
  | 'maxBandwidth'
  /** Bandwidth recovered per second, anywhere on the floor. */
  | 'focus'
  /** How hard your intern hits, as a multiplier. */
  | 'internPower'

export type Stats = Record<StatKey, number>

export const STAT_KEYS: readonly StatKey[] = [
  'power',
  'reach',
  'attackSpeed',
  'maxHp',
  'moveSpeed',
  'cooldown',
  'armour',
  'specialistPower',
  'towerDamage',
  'towerRange',
  'socialGain',
  'budgetGain',
  'xpGain',
  'regen',
  'maxBandwidth',
  'focus',
  'internPower',
]

/** Stats that read as percentages in the UI rather than flat numbers. */
export const PERCENT_STATS: ReadonlySet<StatKey> = new Set<StatKey>([
  'cooldown',
  'specialistPower',
  'towerDamage',
  'towerRange',
  'socialGain',
  'budgetGain',
  'xpGain',
  'internPower',
])

export function emptyStats(): Stats {
  return {
    power: 0,
    reach: 0,
    attackSpeed: 0,
    maxHp: 0,
    moveSpeed: 0,
    cooldown: 0,
    armour: 0,
    specialistPower: 0,
    towerDamage: 0,
    towerRange: 0,
    socialGain: 0,
    budgetGain: 0,
    xpGain: 0,
    regen: 0,
    maxBandwidth: 0,
    focus: 0,
    internPower: 0,
  }
}

export function addStats(into: Stats, from: Partial<Stats>): Stats {
  for (const key of STAT_KEYS) {
    const value = from[key]
    if (value) into[key] += value
  }
  return into
}

// ─────────────────────────────────────────────────────────────────── talents

export type TalentBranch = 'lean_in' | 'grow_out' | 'weaponise'

export interface TalentNode {
  id: string
  name: string
  /** Comedy goes here, but the mechanic must be in `stats` or `grants`. */
  flavour: string
  branch: TalentBranch
  /** Row in the tree, 0-indexed. Higher rows need more points spent in-branch. */
  tier: number
  maxRank: number
  /** Applied per rank. */
  stats?: Partial<Stats>
  /** Behaviour flags handed to the sim. */
  grants?: TalentGrant[]
  /** Requires this many points already spent in the same branch. */
  requires?: number
}

export type TalentGrant =
  /** Auto-attacks hit a second nearby target for 50%. */
  | 'cleave'
  /** Abilities refund 20% cooldown on a kill. */
  | 'momentum'
  /** Reveals stealth permanently in a radius. */
  | 'always_watching'
  /** Downed timer halved. */
  | 'resilient'
  /** Towers you personally built gain the buff even when you are away. */
  | 'remote_management'
  /** Killing a Stakeholder grants Social Capital. */
  | 'political_capital'
  /** Drops are one rarity tier more likely. */
  | 'magpie'

/** A class's full tree: three branches expressing lean-in, grow-out, weaponise. */
export interface TalentTree {
  animal: AnimalId
  branches: Record<TalentBranch, { name: string; flavour: string }>
  nodes: TalentNode[]
}

// ────────────────────────────────────────────────────────────────── artifacts

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITY_ORDER: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

/** How many random affixes each rarity rolls, and its colour in the UI. */
export const RARITY_INFO: Record<Rarity, { affixes: number; colour: string; label: string }> = {
  common: { affixes: 1, colour: '#b9b298', label: 'Standard Issue' },
  uncommon: { affixes: 2, colour: '#7fae7a', label: 'Approved' },
  rare: { affixes: 3, colour: '#5a7fa8', label: 'Business Critical' },
  epic: { affixes: 4, colour: '#a05fc0', label: 'Board Visible' },
  legendary: { affixes: 5, colour: '#e0c05a', label: 'Career Defining' },
}

export type ArtifactSlot = 'badge' | 'device' | 'document' | 'beverage' | 'furniture' | 'intern'

export const ARTIFACT_SLOTS: readonly ArtifactSlot[] = [
  'badge',
  'device',
  'document',
  'beverage',
  'furniture',
  'intern',
]

export interface Affix {
  stat: StatKey
  value: number
}

export interface Artifact {
  id: string
  /** Base item id from content/artifacts.ts. */
  base: string
  name: string
  slot: ArtifactSlot
  rarity: Rarity
  /** Item level: scales affix magnitude. Rises with wave number. */
  ilvl: number
  affixes: Affix[]
  /** Legendary items carry one fixed, rule-bending property. */
  legendary?: LegendaryPower
}

export type LegendaryPower =
  /** Your auto-attacks also damage through the `automation` channel. */
  | 'shadow_it'
  /** Escalated requests take 40% more from you specifically. */
  | 'escalation_specialist'
  /** Every tower you build starts at level 1. */
  | 'pre_approved'
  /** You cannot be downed; instead you are teleported to spawn at 1 HP. */
  | 'garden_leave'
  /** Social Capital is also granted on Stakeholder kills, doubled. */
  | 'kingmaker'

/** One rollable affix line: which stat, and its magnitude band before ilvl scaling. */
export interface AffixPool {
  stat: StatKey
  min: number
  max: number
  /** Human phrasing for the tooltip, e.g. "tower damage". */
  label: string
}

export interface ArtifactBase {
  id: string
  name: string
  slot: ArtifactSlot
  flavour: string
  /** Guaranteed affix on every roll of this base. */
  implicit?: Affix
  sprite: string
}

// ───────────────────────────────────────────────────────────────── hero state

export interface HeroState {
  hp: number
  maxHp: number
  /**
   * Bandwidth. Every ability spends it; it comes back slowly on the floor and
   * quickly at a water cooler, the canteen, or the nap area nobody admits to.
   * "Do you have bandwidth for this" is the only honest question in the building.
   */
  bandwidth: number
  maxBandwidth: number
  /** True while standing in a recharge zone, for the renderer and the HUD. */
  recharging: boolean
  /** Ticks until revival. 0 means active. */
  downedTicks: number
  /** Ticks since last dealt or took damage — gates out-of-combat regen. */
  outOfCombat: number
  level: number
  xp: number
  /** XP required to reach the next level. */
  xpToNext: number
  talentPoints: number
  /** Talent id → ranks purchased. */
  talents: Record<string, number>
  /** Slot → artifact, or null. */
  equipment: Record<ArtifactSlot, Artifact | null>
  /** Unequipped drops picked up this run. */
  bag: Artifact[]
  /** Ticks until the next auto-attack. */
  attackCooldown: number
  /** Cached, recomputed whenever talents or equipment change. */
  stats: Stats
  /** Development options offered at the last performance review, awaiting a pick. */
  pendingPerks: string[]
  /** Perks already taken, by id. */
  perks: string[]
  /** Set while the hero is in the middle of an auto-attack, for the renderer. */
  lastAttackTarget: EntityId | null
}

// ─────────────────────────────────────────────────────────────── persistence

/** A follower. Replaceable, enthusiastic, and technically not your responsibility. */
export interface InternEntity {
  id: EntityId
  ownerId: PlayerId
  /** The artifact that summoned them, so we can despawn on unequip. */
  artifactId: string
  pos: Vec2
  hp: number
  maxHp: number
  attackCooldown: number
  /** Ticks until the placement resumes after they are knocked out. */
  outTicks: number
  name: string
}

export interface Profile {
  id: string
  name: string
  accountLevel: number
  accountXp: number
  /** Animals the player has unlocked. Four are free; the rest unlock by play. */
  unlocked: AnimalId[]
  /** Artifacts kept between runs. */
  stash: Artifact[]
  /** Per-animal persistent level, so a main character stays a main character. */
  animalLevels: Partial<Record<AnimalId, number>>
  records: {
    bestWave: number
    runs: number
    victories: number
    stakeholdersManaged: number
  }
}

export function emptyProfile(id: string, name: string): Profile {
  return {
    id,
    name,
    accountLevel: 1,
    accountXp: 0,
    unlocked: ['hippo', 'wolf', 'mouse', 'rhino'],
    stash: [],
    animalLevels: {},
    records: { bestWave: 0, runs: 0, victories: 0, stakeholdersManaged: 0 },
  }
}

// ───────────────────────────────────────────────────────────── stakeholders

/**
 * The enemy mirror of the classes. Stakeholders do not walk to the CHRO door to
 * cost you Morale — they walk to your *towers* and interfere with them, which is
 * a different threat model and needs a different verb from the player.
 */
export interface StakeholderDef {
  id: AnimalId
  name: string
  title: string
  flavour: string
  hp: number
  speed: number
  /** What it does when it reaches a tower. */
  interference: Interference
  /** Radius in tiles for aura-type interference. */
  radius: number
  /** Seconds between interference pulses. */
  interval: number
  moraleDamage: number
  complianceDamage: number
  xp: number
  socialCapital: number
  /** Chance of dropping an artifact, 0..1. */
  dropChance: number
  sprite: string
}

export type Interference =
  /** Nearby towers deal 40% less. Seniority is not evidence. */
  | 'override'
  /** Disables one tower outright until killed. */
  | 'disable'
  /** Permanently destroys a tower and leaves. */
  | 'destroy'
  /** Spawns extra requests on a timer. */
  | 'generate'
  /** Steals Budget. */
  | 'drain_budget'
  /** Steals Social Capital. */
  | 'drain_social'
  /** Halves nearby towers' range. */
  | 'shrink'
  /** Heals and speeds up nearby requests. */
  | 'rally'
  /** Reverts a tower one upgrade level. */
  | 'downgrade'
  /** Big burst of morale damage, then despawns itself. */
  | 'unload'

export interface StakeholderEntity {
  id: EntityId
  type: AnimalId
  lane: number
  progress: number
  hp: number
  maxHp: number
  pos: Vec2
  /** Ticks until the next interference pulse. */
  pulse: number
  /** Tower currently being interfered with, if any. */
  targetTowerId: EntityId | null
  /** Set once an `unload` stakeholder has fired, so it leaves. */
  spent: boolean
  bark: string
}

export type ExitKind = 'attrition' | 'voluntary' | 'compulsory'

// ─────────────────────────────────────────────────────────────────── loot log

export interface DropEvent {
  artifact: Artifact
  at: Vec2
  playerId: PlayerId
}
