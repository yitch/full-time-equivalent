import { describe, expect, it } from 'vitest'
import { ROLES, ROLE_IDS, STAKEHOLDERS, TALENT_TREES, ARTIFACT_BASES, AFFIX_POOLS } from './content/index.js'
import {
  MAX_HERO_LEVEL,
  computeStats,
  createHero,
  emptyEquipment,
  grantXp,
  rollArtifact,
  spendTalent,
  xpToNext,
} from './progression.js'
import { createRng } from './rng.js'
import { ARTIFACT_SLOTS, RARITY_INFO } from './types-progression.js'

describe('class integrity', () => {
  it('all fourteen animals exist and are distinct', () => {
    expect(ROLE_IDS.length).toBe(14)
    expect(new Set(ROLE_IDS).size).toBe(14)
  })

  it('every animal has four abilities on Q/W/E/R', () => {
    for (const id of ROLE_IDS) {
      const keys = ROLES[id]!.abilities.map((a) => a.key).sort()
      expect(keys, id).toEqual(['E', 'Q', 'R', 'W'])
    }
  })

  it('every animal states its dysfunction — a class without a cost is a bonus', () => {
    for (const id of ROLE_IDS) {
      const role = ROLES[id]!
      expect(role.dysfunction.length, id).toBeGreaterThan(20)
      expect(role.passiveText.length, id).toBeGreaterThan(20)
      expect(role.expansion.length, id).toBeGreaterThan(8)
    }
  })

  it('every animal has a talent tree with three branches of three nodes', () => {
    for (const id of ROLE_IDS) {
      const tree = TALENT_TREES[id]!
      expect(tree, id).toBeDefined()
      expect(tree.nodes.length, id).toBe(9)
      for (const branch of ['lean_in', 'grow_out', 'weaponise'] as const) {
        expect(tree.nodes.filter((n) => n.branch === branch).length, `${id}/${branch}`).toBe(3)
      }
    }
  })

  it('has a Stakeholder mirror for every playable animal', () => {
    for (const id of ROLE_IDS) expect(STAKEHOLDERS[id], id).toBeDefined()
  })
})

describe('levelling', () => {
  it('reaches level 5 quickly and level 30 slowly', () => {
    expect(xpToNext(1)).toBeLessThan(60)
    expect(xpToNext(29)).toBeGreaterThan(xpToNext(5) * 5)
  })

  it('grants exactly one talent point per level', () => {
    const hero = createHero('wolf')
    expect(hero.talentPoints).toBe(0)
    grantXp(hero, 'wolf', 100000)
    expect(hero.level).toBe(MAX_HERO_LEVEL)
    expect(hero.talentPoints).toBe(MAX_HERO_LEVEL - 1)
  })

  it('you can never max every branch — the build is a choice', () => {
    const totalCost = TALENT_TREES.wolf!.nodes.reduce((sum, n) => sum + n.maxRank, 0)
    expect(totalCost).toBeGreaterThan(MAX_HERO_LEVEL - 1)
  })

  it('levelling raises max HP and heals proportionally', () => {
    const hero = createHero('rhino')
    const startHp = hero.maxHp
    hero.hp = hero.maxHp * 0.2
    grantXp(hero, 'rhino', 5000)
    expect(hero.maxHp).toBeGreaterThan(startHp)
    expect(hero.hp / hero.maxHp).toBeGreaterThan(0.2)
  })
})

describe('talents', () => {
  it('gates deeper nodes behind points already spent in the branch', () => {
    const hero = createHero('cobra')
    hero.talentPoints = 20
    const capstone = TALENT_TREES.cobra!.nodes.find((n) => n.tier === 2)!
    expect(spendTalent(hero, 'cobra', capstone.id)).toContain('Needs')
  })

  it('actually changes the hero once purchased', () => {
    const hero = createHero('wolf')
    hero.talentPoints = 5
    const first = TALENT_TREES.wolf!.nodes.find((n) => n.tier === 0 && n.branch === 'lean_in')!
    const before = hero.stats.power
    expect(spendTalent(hero, 'wolf', first.id)).toBeNull()
    expect(hero.stats.power).toBeGreaterThan(before)
    expect(hero.talentPoints).toBe(4)
  })

  it('refuses to spend points you do not have', () => {
    const hero = createHero('wolf')
    const first = TALENT_TREES.wolf!.nodes[0]!
    expect(spendTalent(hero, 'wolf', first.id)).toContain('No talent points')
  })
})

describe('loot', () => {
  it('every affix pool references a slot that exists, and every base a real pool', () => {
    for (const slot of ARTIFACT_SLOTS) expect(AFFIX_POOLS[slot]?.length, slot).toBeGreaterThan(2)
    for (const base of ARTIFACT_BASES) expect(ARTIFACT_SLOTS).toContain(base.slot)
  })

  it('rolls affixes matching the rarity, and never duplicates a stat', () => {
    const rng = createRng(1234)
    for (let i = 0; i < 300; i++) {
      const item = rollArtifact(rng, 5)
      const stats = item.affixes.map((a) => a.stat)
      expect(new Set(stats).size, item.name).toBe(stats.length)
      if (item.rarity !== 'legendary') {
        const expected = RARITY_INFO[item.rarity].affixes
        expect(item.affixes.length, `${item.name} (${item.rarity})`).toBeGreaterThanOrEqual(expected)
      }
    }
  })

  it('later waves roll better items', () => {
    const early = createRng(7)
    const late = createRng(7)
    const score = (rng: ReturnType<typeof createRng>, wave: number) => {
      let epics = 0
      for (let i = 0; i < 400; i++) {
        const r = rollArtifact(rng, wave).rarity
        if (r === 'epic' || r === 'legendary') epics++
      }
      return epics
    }
    expect(score(late, 9)).toBeGreaterThan(score(early, 1))
  })

  it('equipping an artifact changes the hero stats', () => {
    const rng = createRng(99)
    const equipment = emptyEquipment()
    const bare = computeStats('donkey', 5, {}, equipment)
    const item = rollArtifact(rng, 8)
    equipment[item.slot] = item
    const geared = computeStats('donkey', 5, {}, equipment)
    const changed = Object.keys(bare).some(
      (k) => geared[k as keyof typeof geared] !== bare[k as keyof typeof bare],
    )
    expect(changed).toBe(true)
  })

  it('caps cooldown reduction so the late game does not become ability soup', () => {
    const equipment = emptyEquipment()
    const stats = computeStats('goose', 30, {}, equipment)
    expect(stats.cooldown).toBeLessThanOrEqual(0.6)
  })
})
