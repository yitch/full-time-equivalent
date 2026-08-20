import type { RoleId, TechId, TechNode } from '../types.js'
import { TECH } from './tech.js'

/**
 * Why a thing is locked, and exactly what opens it.
 *
 * Both halves of this file exist because "locked" on its own is a dead end for
 * the player. Every lock in the game has to be able to answer two questions in
 * one line: why can I not have this, and what precisely do I do about it.
 */

// ────────────────────────────────────────────────────────── animal unlocks

/** Free from the first run. Four is enough to have a real choice on day one. */
export const STARTER_ANIMALS: RoleId[] = ['hippo', 'wolf', 'mouse', 'rhino']

/**
 * The order the remaining animals open up in. Deliberately front-loads the ones
 * that teach a mechanic — VIPER shows you stealth, COBRA shows you stacking —
 * and saves the weird ones for players who have stuck around.
 */
export const ANIMAL_UNLOCK_ORDER: RoleId[] = [
  'viper',
  'cobra',
  'yak',
  'seagull',
  'zebra',
  'donkey',
  'goose',
  'puffin',
  'puma',
  'dodo',
]

/** Account levels between each new animal. */
export const LEVELS_PER_ANIMAL = 2

/** The account level that opens this animal, or null if it is free from the start. */
export function unlockLevelFor(animal: RoleId): number | null {
  if (STARTER_ANIMALS.includes(animal)) return null
  const index = ANIMAL_UNLOCK_ORDER.indexOf(animal)
  if (index === -1) return null
  return (index + 1) * LEVELS_PER_ANIMAL
}

/** Everything a profile at this account level should have. */
export function animalsUnlockedAt(accountLevel: number): RoleId[] {
  const count = Math.min(ANIMAL_UNLOCK_ORDER.length, Math.floor(accountLevel / LEVELS_PER_ANIMAL))
  return [...STARTER_ANIMALS, ...ANIMAL_UNLOCK_ORDER.slice(0, count)]
}

/** The next animal that will open, for the "coming up" line in the roster. */
export function nextAnimalUnlock(accountLevel: number): { animal: RoleId; atLevel: number } | null {
  const index = Math.floor(accountLevel / LEVELS_PER_ANIMAL)
  const animal = ANIMAL_UNLOCK_ORDER[index]
  if (!animal) return null
  return { animal, atLevel: (index + 1) * LEVELS_PER_ANIMAL }
}

/** How account XP is earned, in the player's words. Shown on a locked card. */
export const ACCOUNT_XP_SOURCES: string[] = [
  'finishing a run — further is worth more',
  'managing Stakeholders (60 XP each)',
  'surviving Open Enrollment (900 XP)',
]

// ─────────────────────────────────────────────────────────── tech unlocks

export interface TechPath {
  /** Nodes still to buy, in the order they must be bought. */
  nodes: TechNode[]
  /** Total Social Capital for the whole chain. */
  cost: number
  /** True once nothing is left to buy. */
  owned: boolean
}

/**
 * The full remaining chain to a tech node, in buy order, with the total price.
 *
 * A player looking at a locked tower needs the whole road, not just the next
 * step — "needs Knowledge Base" is useless if Knowledge Base itself needs three
 * things you also do not have.
 */
export function pathToTech(id: TechId, unlocked: TechId[]): TechPath {
  const ordered: TechNode[] = []
  const seen = new Set<TechId>()

  const walk = (nodeId: TechId): void => {
    if (seen.has(nodeId) || unlocked.includes(nodeId)) return
    seen.add(nodeId)
    const node = TECH[nodeId]
    if (!node) return
    for (const requirement of node.requires) walk(requirement)
    ordered.push(node)
  }

  walk(id)
  return {
    nodes: ordered,
    cost: ordered.reduce((sum, n) => sum + n.cost, 0),
    owned: ordered.length === 0,
  }
}

/** One line explaining why something is locked and what to do. */
export function lockReason(id: TechId, unlocked: TechId[], socialCapital: number): string | null {
  const path = pathToTech(id, unlocked)
  if (path.owned) return null
  const names = path.nodes.map((n) => n.name).join(' → ')
  const short = socialCapital < path.cost ? ` — you have ${Math.floor(socialCapital)}` : ' — affordable now'
  return `Needs ${names}. ${path.cost} Social Capital${short}.`
}
