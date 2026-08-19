/**
 * Levelling, stat aggregation and loot rolling.
 *
 * Two clocks run at once, deliberately:
 *  - the **run** clock: hero levels 1..30, earned and lost inside one campaign,
 *    so a run has its own arc and a late pick is not hopeless;
 *  - the **profile** clock: account level and a stash that persist, so the
 *    fiftieth run starts from somewhere better than the first.
 *
 * Everything a hero has flows into one `Stats` bag. Talents and affixes write
 * into the same keys, which is why "+8% tower range" from a talent and from a
 * chair stack without a special case anywhere.
 */

import { ARTIFACT_BASES, AFFIX_POOLS, LEGENDARIES, NAME_PREFIX, NAME_SUFFIX, rarityWeights } from './content/artifacts.js'
import { TALENT_TREES } from './content/talents.js'
import { getRole } from './content/roles.js'
import { chance, next, nextFloat, nextInt, pick, type Rng } from './rng.js'
import type {
  Artifact,
  ArtifactSlot,
  HeroState,
  Rarity,
  RoleId,
  Stats,
  StatKey,
} from './types.js'
import { ARTIFACT_SLOTS, addStats, emptyStats } from './types-progression.js'

export const MAX_HERO_LEVEL = 30

/**
 * Deliberately shallow early and steep late: you should hit level 5 during wave
 * one and feel it, and still be chasing 30 at Open Enrollment.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(38 * (level - 1) ** 1.9)
}

export function xpToNext(level: number): number {
  if (level >= MAX_HERO_LEVEL) return Number.POSITIVE_INFINITY
  return xpForLevel(level + 1) - xpForLevel(level)
}

/** Account XP is a slower, flatter curve — meta-progression, not a treadmill. */
export function accountXpToNext(level: number): number {
  return Math.round(900 * level ** 1.25)
}

// ───────────────────────────────────────────────────────────── stat assembly

/**
 * The single source of truth for what a hero's numbers are. Call this whenever
 * level, talents or equipment change; never mutate `hero.stats` directly.
 */
export function computeStats(
  role: RoleId,
  level: number,
  talents: Record<string, number>,
  equipment: Record<ArtifactSlot, Artifact | null>,
): Stats {
  const def = getRole(role)
  const stats = emptyStats()

  addStats(stats, def.base)
  for (let i = 1; i < level; i++) addStats(stats, def.growth)

  const tree = TALENT_TREES[role]
  if (tree) {
    for (const node of tree.nodes) {
      const ranks = talents[node.id] ?? 0
      if (ranks <= 0 || !node.stats) continue
      for (let r = 0; r < ranks; r++) addStats(stats, node.stats)
    }
  }

  for (const slot of ARTIFACT_SLOTS) {
    const item = equipment[slot]
    if (!item) continue
    for (const affix of item.affixes) {
      stats[affix.stat] += affix.value
    }
  }

  // Cooldown reduction has to be capped or the late game becomes ability soup.
  stats.cooldown = Math.min(0.6, stats.cooldown)
  stats.maxHp = Math.max(1, stats.maxHp)
  stats.attackSpeed = Math.max(0.15, stats.attackSpeed)
  return stats
}

export function emptyEquipment(): Record<ArtifactSlot, Artifact | null> {
  return { badge: null, device: null, document: null, beverage: null, furniture: null }
}

export function createHero(role: RoleId, startLevel = 1): HeroState {
  const equipment = emptyEquipment()
  const stats = computeStats(role, startLevel, {}, equipment)
  return {
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    downedTicks: 0,
    outOfCombat: 0,
    level: startLevel,
    xp: 0,
    xpToNext: xpToNext(startLevel),
    talentPoints: startLevel - 1,
    talents: {},
    equipment,
    bag: [],
    attackCooldown: 0,
    stats,
    lastAttackTarget: null,
  }
}

/** Recomputes derived stats, preserving the current HP fraction. */
export function refreshHero(hero: HeroState, role: RoleId): void {
  const fraction = hero.maxHp > 0 ? hero.hp / hero.maxHp : 1
  hero.stats = computeStats(role, hero.level, hero.talents, hero.equipment)
  hero.maxHp = hero.stats.maxHp
  hero.hp = Math.min(hero.maxHp, Math.max(1, Math.round(hero.maxHp * fraction)))
}

/** Returns the number of levels gained, so the caller can raise events. */
export function grantXp(hero: HeroState, role: RoleId, amount: number): number {
  if (hero.level >= MAX_HERO_LEVEL) return 0
  const scaled = amount * (1 + hero.stats.xpGain)
  hero.xp += scaled
  let gained = 0
  while (hero.level < MAX_HERO_LEVEL && hero.xp >= hero.xpToNext) {
    hero.xp -= hero.xpToNext
    hero.level++
    hero.talentPoints++
    hero.xpToNext = xpToNext(hero.level)
    gained++
  }
  if (gained > 0) {
    const fraction = hero.hp / Math.max(1, hero.maxHp)
    hero.stats = computeStats(role, hero.level, hero.talents, hero.equipment)
    hero.maxHp = hero.stats.maxHp
    // Levelling heals proportionally — a level-up should feel like relief.
    hero.hp = Math.min(hero.maxHp, Math.round(hero.maxHp * Math.min(1, fraction + 0.35)))
  }
  return gained
}

// ────────────────────────────────────────────────────────────── talent rules

export function canSpendTalent(
  hero: HeroState,
  role: RoleId,
  nodeId: string,
): { ok: boolean; reason?: string } {
  const tree = TALENT_TREES[role]
  const node = tree?.nodes.find((n) => n.id === nodeId)
  if (!node) return { ok: false, reason: 'No such talent.' }
  if (hero.talentPoints <= 0) return { ok: false, reason: 'No talent points. Level up first.' }
  const ranks = hero.talents[nodeId] ?? 0
  if (ranks >= node.maxRank) return { ok: false, reason: 'Already maxed.' }
  if (node.requires) {
    const spentInBranch = tree!.nodes
      .filter((n) => n.branch === node.branch)
      .reduce((sum, n) => sum + (hero.talents[n.id] ?? 0), 0)
    if (spentInBranch < node.requires) {
      return { ok: false, reason: `Needs ${node.requires} points in this branch (you have ${spentInBranch}).` }
    }
  }
  return { ok: true }
}

export function spendTalent(hero: HeroState, role: RoleId, nodeId: string): string | null {
  const check = canSpendTalent(hero, role, nodeId)
  if (!check.ok) return check.reason ?? 'Blocked.'
  hero.talents[nodeId] = (hero.talents[nodeId] ?? 0) + 1
  hero.talentPoints--
  refreshHero(hero, role)
  return null
}

export function hasGrant(hero: HeroState, role: RoleId, grant: string): boolean {
  const tree = TALENT_TREES[role]
  if (!tree) return false
  for (const node of tree.nodes) {
    if (!node.grants?.includes(grant as never)) continue
    if ((hero.talents[node.id] ?? 0) > 0) return true
  }
  return false
}

// ──────────────────────────────────────────────────────────────── loot roll

function rollRarity(rng: Rng, wave: number, luckTiers: number): Rarity {
  const weights = rarityWeights(wave)
  const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const total = order.reduce((sum, r) => sum + weights[r], 0)
  let roll = next(rng) * total
  let chosen: Rarity = 'common'
  for (const r of order) {
    roll -= weights[r]
    if (roll <= 0) {
      chosen = r
      break
    }
  }
  // The Magpie talent nudges a result up a tier rather than rerolling.
  for (let i = 0; i < luckTiers; i++) {
    const index = order.indexOf(chosen)
    if (index < order.length - 1 && chance(rng, 0.45)) chosen = order[index + 1]!
  }
  return chosen
}

/** Affix magnitude scales from the low end of the band at ilvl 1 to the high end at 30. */
function scaleAffix(rng: Rng, min: number, max: number, ilvl: number): number {
  const t = Math.min(1, ilvl / 30)
  const lo = min + (max - min) * t * 0.45
  const hi = min + (max - min) * (0.35 + t * 0.65)
  const raw = nextFloat(rng, lo, Math.max(lo, hi))
  return Math.round(raw * 1000) / 1000
}

/**
 * Rolls one artifact. `wave` drives both rarity odds and item level, so drops
 * stay relevant without a separate difficulty knob.
 */
export function rollArtifact(rng: Rng, wave: number, luckTiers = 0): Artifact {
  const rarity = rollRarity(rng, wave, luckTiers)
  const ilvl = Math.max(1, Math.round(wave * 3 + nextInt(rng, 0, 4)))

  if (rarity === 'legendary') {
    const def = pick(rng, LEGENDARIES)
    const base = ARTIFACT_BASES.find((b) => b.id === def.base) ?? ARTIFACT_BASES[0]!
    const affixes = rollAffixes(rng, base.slot, 3, ilvl, base.implicit)
    return {
      id: `art_${Math.floor(next(rng) * 1e9).toString(36)}`,
      base: base.id,
      name: def.name,
      slot: base.slot,
      rarity,
      ilvl,
      affixes,
      legendary: def.power,
    }
  }

  const base = pick(rng, ARTIFACT_BASES)
  const count = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }[rarity]
  const affixes = rollAffixes(rng, base.slot, count, ilvl, base.implicit)

  const prefix = pick(rng, NAME_PREFIX[rarity])
  const name =
    rarity === 'common'
      ? base.name
      : rarity === 'epic'
        ? `${prefix} ${base.name} ${pick(rng, NAME_SUFFIX)}`
        : `${prefix} ${base.name}`

  return {
    id: `art_${Math.floor(next(rng) * 1e9).toString(36)}`,
    base: base.id,
    name,
    slot: base.slot,
    rarity,
    ilvl,
    affixes,
  }
}

function rollAffixes(
  rng: Rng,
  slot: ArtifactSlot,
  count: number,
  ilvl: number,
  implicit?: { stat: StatKey; value: number },
): { stat: StatKey; value: number }[] {
  const pool = AFFIX_POOLS[slot]
  const used = new Set<StatKey>()
  const affixes: { stat: StatKey; value: number }[] = []

  if (implicit) {
    affixes.push({ ...implicit })
    used.add(implicit.stat)
  }

  let guard = 0
  while (affixes.length < count + (implicit ? 1 : 0) && guard++ < 30) {
    const entry = pick(rng, pool)
    if (used.has(entry.stat)) continue
    used.add(entry.stat)
    affixes.push({ stat: entry.stat, value: scaleAffix(rng, entry.min, entry.max, ilvl) })
  }
  return affixes
}

/** A rough single number for comparing two items in the UI. */
export function artifactScore(artifact: Artifact): number {
  return artifact.affixes.reduce((sum, a) => {
    const weight = a.stat === 'maxHp' ? 0.35 : a.stat === 'power' ? 3 : a.stat === 'armour' ? 2.5 : 60
    return sum + a.value * weight
  }, 0)
}
