import { describe, expect, it } from 'vitest'
import {
  ANIMAL_UNLOCK_ORDER,
  ACCOUNT_XP_SOURCES,
  CONTRIBUTIONS,
  LEVELS_PER_ANIMAL,
  ROLE_IDS,
  STARTER_ANIMALS,
  TOWERS,
  TOWER_IDS,
  TUTORIAL_STEPS,
  TECH,
  animalsUnlockedAt,
  nextAnimalUnlock,
  pathToTech,
  unlockLevelFor,
} from './index.js'

/**
 * Every lock in the game has to answer two questions in one line: why can I not
 * have this, and what precisely do I do about it. These tests keep that true.
 */

describe('why a character is locked', () => {
  it('covers every animal exactly once between starters and the unlock order', () => {
    const all = [...STARTER_ANIMALS, ...ANIMAL_UNLOCK_ORDER]
    expect(all.length).toBe(ROLE_IDS.length)
    expect(new Set(all).size).toBe(ROLE_IDS.length)
    for (const id of ROLE_IDS) expect(all, id).toContain(id)
  })

  it('starters have no unlock level; everything else names one', () => {
    for (const id of STARTER_ANIMALS) expect(unlockLevelFor(id), id).toBeNull()
    for (const id of ANIMAL_UNLOCK_ORDER) {
      const level = unlockLevelFor(id)
      expect(level, id).not.toBeNull()
      expect(level!, id).toBeGreaterThan(0)
    }
  })

  it('the level a card advertises is the level the server actually unlocks at', () => {
    for (const id of ANIMAL_UNLOCK_ORDER) {
      const level = unlockLevelFor(id)!
      expect(animalsUnlockedAt(level - 1), `${id} early`).not.toContain(id)
      expect(animalsUnlockedAt(level), `${id} on time`).toContain(id)
    }
  })

  it('always has a next unlock to point at until everything is open', () => {
    expect(nextAnimalUnlock(1)?.animal).toBe(ANIMAL_UNLOCK_ORDER[0])
    const maxLevel = ANIMAL_UNLOCK_ORDER.length * LEVELS_PER_ANIMAL
    expect(nextAnimalUnlock(maxLevel)).toBeNull()
  })

  it('tells the player where account XP comes from', () => {
    expect(ACCOUNT_XP_SOURCES.length).toBeGreaterThan(2)
  })
})

describe('why a defence is locked', () => {
  it('gives the whole remaining chain, in buy order, not just the next step', () => {
    const path = pathToTech('rpa', ['intranet'])
    expect(path.nodes.map((n) => n.id)).toEqual(['sso', 'hrfin', 'masterdata', 'rpa'])
    expect(path.cost).toBe(path.nodes.reduce((sum, n) => sum + n.cost, 0))
  })

  it('every node in a path has its own prerequisites earlier in that path', () => {
    for (const id of Object.keys(TECH)) {
      const path = pathToTech(id, [])
      const seen = new Set<string>()
      for (const node of path.nodes) {
        for (const req of node.requires) expect(seen, `${id}: ${node.id} needs ${req}`).toContain(req)
        seen.add(node.id)
      }
    }
  })

  it('reports nothing to buy once a node is owned', () => {
    const path = pathToTech('kb', ['intranet', 'kb'])
    expect(path.owned).toBe(true)
    expect(path.nodes).toEqual([])
    expect(path.cost).toBe(0)
  })

  it('every locked tower can explain itself through a real chain', () => {
    for (const id of TOWER_IDS) {
      const def = TOWERS[id]!
      if (!def.requires) continue
      const path = pathToTech(def.requires, [])
      expect(path.nodes.length, id).toBeGreaterThan(0)
      expect(path.cost, id).toBeGreaterThan(0)
    }
  })
})

describe('what a defence contributes', () => {
  it('every tower says what it is for', () => {
    for (const id of TOWER_IDS) {
      const def = TOWERS[id]!
      expect(def.contributes.length, id).toBeGreaterThan(0)
      for (const c of def.contributes) expect(CONTRIBUTIONS[c], `${id} -> ${c}`).toBeDefined()
    }
  })

  it('every contribution has an icon, a label and the resource it protects', () => {
    for (const [key, info] of Object.entries(CONTRIBUTIONS)) {
      expect(info.icon.length, key).toBeGreaterThan(2)
      expect(info.label.length, key).toBeGreaterThan(3)
      expect(info.blurb.length, key).toBeGreaterThan(25)
      expect(['morale', 'compliance', 'budget', 'social', 'sla'], key).toContain(info.resource)
    }
  })
})

describe('the tutorial', () => {
  it('is short enough to read and long enough to matter', () => {
    expect(TUTORIAL_STEPS.length).toBeGreaterThan(6)
    expect(TUTORIAL_STEPS.length).toBeLessThan(16)
  })

  it('every step has a title and a body, and no step is a wall of text', () => {
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length, step.id).toBeGreaterThan(8)
      expect(step.body.length, step.id).toBeGreaterThan(40)
      expect(step.body.length, `${step.id} too long`).toBeLessThan(420)
    }
  })

  it('has unique ids and at least a few steps that advance by doing', () => {
    const ids = TUTORIAL_STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TUTORIAL_STEPS.filter((s) => s.doneWhen).length).toBeGreaterThanOrEqual(3)
  })
})
