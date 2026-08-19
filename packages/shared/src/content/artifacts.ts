import type { AffixPool, ArtifactBase, ArtifactSlot, Rarity, StatKey } from '../types.js'

/**
 * Corporate artifacts. Everything here is an object that exists in an actual
 * office and confers actual, unearned advantage. The comedy is in the item being
 * mundane; the mechanic is in the affix.
 */
export const ARTIFACT_BASES: ArtifactBase[] = [
  // badge — identity and standing
  { id: 'lanyard', name: 'Lanyard', slot: 'badge', flavour: 'Three years expired. Still opens every door on this floor.', implicit: { stat: 'socialGain', value: 0.05 }, sprite: 'it_badge' },
  { id: 'visitor_pass', name: 'Visitor Pass', slot: 'badge', flavour: 'Nobody has asked. It has been eleven months.', implicit: { stat: 'moveSpeed', value: 0.4 }, sprite: 'it_badge' },
  { id: 'exec_badge', name: 'Executive Floor Access', slot: 'badge', flavour: 'The lift goes higher than you had realised.', implicit: { stat: 'specialistPower', value: 0.12 }, sprite: 'it_badge' },

  // device — throughput
  { id: 'laptop', name: 'Company Laptop', slot: 'device', flavour: 'Four years old. Forty-one Chrome tabs. One of them is playing audio.', implicit: { stat: 'attackSpeed', value: 0.12 }, sprite: 'it_laptop' },
  { id: 'second_monitor', name: 'Second Monitor', slot: 'device', flavour: 'Took nine months and a business case. Doubled your output on day one.', implicit: { stat: 'reach', value: 0.7 }, sprite: 'it_monitor' },
  { id: 'headset', name: 'Wireless Headset', slot: 'device', flavour: 'Wearing it means you are on a call. You are not on a call.', implicit: { stat: 'cooldown', value: 0.06 }, sprite: 'it_headset' },
  { id: 'work_phone', name: 'The Work Phone', slot: 'device', flavour: 'It is 21:40 and it is face-up on the table.', implicit: { stat: 'power', value: 3 }, sprite: 'it_phone' },

  // document — leverage over process
  { id: 'agenda_item', name: 'Standing Agenda Item', slot: 'document', flavour: 'Every fortnight, forever, whether or not there is anything to say.', implicit: { stat: 'towerRange', value: 0.08 }, sprite: 'it_doc' },
  { id: 'one_pager', name: 'The One-Pager', slot: 'document', flavour: 'It is four pages. It has always been four pages.', implicit: { stat: 'towerDamage', value: 0.07 }, sprite: 'it_doc' },
  { id: 'raci', name: 'RACI Matrix', slot: 'document', flavour: 'Everyone is Consulted. Nobody is Accountable. This was signed off.', implicit: { stat: 'budgetGain', value: 0.08 }, sprite: 'it_doc' },
  { id: 'policy_v14', name: 'The Policy (v14, Final, FINAL)', slot: 'document', flavour: 'v13 is still the one on the intranet.', implicit: { stat: 'towerDamage', value: 0.09 }, sprite: 'it_doc' },

  // beverage — sustain
  { id: 'lukewarm_coffee', name: 'Lukewarm Coffee', slot: 'beverage', flavour: 'Made at 09:15. It is 11:50. You are going to drink it.', implicit: { stat: 'regen', value: 1.2 }, sprite: 'it_mug' },
  { id: 'herbal_tea', name: 'Herbal Tea', slot: 'beverage', flavour: 'A gesture towards wellbeing that changes nothing structural.', implicit: { stat: 'maxHp', value: 18 }, sprite: 'it_mug' },
  { id: 'energy_drink', name: 'Energy Drink', slot: 'beverage', flavour: 'The third one today. You can hear colours.', implicit: { stat: 'attackSpeed', value: 0.18 }, sprite: 'it_can' },
  { id: 'good_biscuits', name: 'The Good Biscuits', slot: 'beverage', flavour: 'Kept in a drawer. Deployed strategically. Never for the whole team.', implicit: { stat: 'socialGain', value: 0.1 }, sprite: 'it_can' },

  // furniture — durability
  { id: 'ergo_chair', name: 'Ergonomic Chair', slot: 'furniture', flavour: 'Assessed, approved, and delivered eight days after you left the team.', implicit: { stat: 'maxHp', value: 30 }, sprite: 'it_chair' },
  { id: 'standing_desk', name: 'Standing Desk', slot: 'furniture', flavour: 'Raised once, in the first week. Lowered permanently in the second.', implicit: { stat: 'armour', value: 3 }, sprite: 'it_desk' },
  { id: 'whiteboard', name: 'Whiteboard On Wheels', slot: 'furniture', flavour: 'DO NOT ERASE. It has said DO NOT ERASE since 2019.', implicit: { stat: 'towerDamage', value: 0.08 }, sprite: 'it_board' },
  { id: 'hot_desk', name: 'Hot Desk', slot: 'furniture', flavour: 'Yours between 09:00 and 17:00 unless somebody else gets there first.', implicit: { stat: 'moveSpeed', value: 0.6 }, sprite: 'it_desk' },
]

/** Which affixes can roll on which slot, and how big they get per item level. */
export const AFFIX_POOLS: Record<ArtifactSlot, AffixPool[]> = {
  badge: [
    { stat: 'socialGain', min: 0.04, max: 0.14, label: 'Social Capital gained' },
    { stat: 'xpGain', min: 0.05, max: 0.18, label: 'XP gained' },
    { stat: 'specialistPower', min: 0.06, max: 0.2, label: 'specialist damage' },
    { stat: 'moveSpeed', min: 0.2, max: 0.9, label: 'move speed' },
  ],
  device: [
    { stat: 'attackSpeed', min: 0.06, max: 0.22, label: 'attack speed' },
    { stat: 'power', min: 2, max: 11, label: 'power' },
    { stat: 'reach', min: 0.3, max: 1.4, label: 'reach' },
    { stat: 'cooldown', min: 0.03, max: 0.12, label: 'cooldown reduction' },
  ],
  document: [
    { stat: 'towerDamage', min: 0.04, max: 0.16, label: 'tower damage' },
    { stat: 'towerRange', min: 0.04, max: 0.15, label: 'tower range' },
    { stat: 'budgetGain', min: 0.05, max: 0.18, label: 'Budget gained' },
    { stat: 'socialGain', min: 0.04, max: 0.13, label: 'Social Capital gained' },
  ],
  beverage: [
    { stat: 'regen', min: 0.6, max: 3.4, label: 'HP per second' },
    { stat: 'moveSpeed', min: 0.2, max: 1.1, label: 'move speed' },
    { stat: 'cooldown', min: 0.03, max: 0.13, label: 'cooldown reduction' },
    { stat: 'maxHp', min: 10, max: 48, label: 'max HP' },
  ],
  furniture: [
    { stat: 'maxHp', min: 14, max: 70, label: 'max HP' },
    { stat: 'armour', min: 1, max: 9, label: 'armour' },
    { stat: 'towerDamage', min: 0.04, max: 0.15, label: 'tower damage' },
    { stat: 'power', min: 2, max: 9, label: 'power' },
  ],
}

/** Prefixes and suffixes, applied by rarity, purely for flavour on the name. */
export const NAME_PREFIX: Record<Rarity, string[]> = {
  common: ['Standard', 'Issued', 'Shared'],
  uncommon: ['Approved', 'Requisitioned', 'Personal'],
  rare: ['Escalated', 'Business-Critical', 'Board-Reported'],
  epic: ['Strategic', 'Transformational', 'Enterprise'],
  legendary: ['Legendary', 'Untouchable', 'Historic'],
}

export const NAME_SUFFIX: string[] = [
  'of the Q3 Reorg',
  'of Unclear Ownership',
  'of the Offsite',
  'of Deferred Maintenance',
  'of the Merger',
  'of Prior Approval',
  'of the Consultation Period',
  'of the Retained Organisation',
]

/** Named legendaries. Each bends one rule; there are only five for a reason. */
export interface LegendaryDef {
  id: string
  name: string
  base: string
  power: 'shadow_it' | 'escalation_specialist' | 'pre_approved' | 'garden_leave' | 'kingmaker'
  flavour: string
  text: string
}

export const LEGENDARIES: LegendaryDef[] = [
  {
    id: 'shadow_spreadsheet',
    name: 'The Shadow Spreadsheet',
    base: 'laptop',
    power: 'shadow_it',
    flavour: 'Runs the department. Maintained by one person. That person is on annual leave.',
    text: 'Your attacks also deal damage through the automation channel.',
  },
  {
    id: 'escalation_inbox',
    name: 'The Escalation Inbox',
    base: 'work_phone',
    power: 'escalation_specialist',
    flavour: 'You have notifications on for this one folder. You know exactly why.',
    text: 'Escalated requests take 45% more damage from you.',
  },
  {
    id: 'pre_approved_case',
    name: 'Pre-Approved Business Case',
    base: 'raci',
    power: 'pre_approved',
    flavour: 'Signed before it was written. Nobody can find who signed it.',
    text: 'Every tower you build arrives already upgraded once.',
  },
  {
    id: 'garden_leave',
    name: 'Garden Leave Letter',
    base: 'policy_v14',
    power: 'garden_leave',
    flavour: 'Still on payroll. No longer in the building. Technically unkillable.',
    text: 'You cannot be downed. Instead you are removed to spawn at 1 HP.',
  },
  {
    id: 'chairmans_ear',
    name: "The Chairman's Ear",
    base: 'exec_badge',
    power: 'kingmaker',
    flavour: 'You sat next to him at a dinner in 2021 and it has been worth more than any promotion.',
    text: 'Managing a Stakeholder grants double Social Capital.',
  },
]

/** Rarity odds by wave. Later waves drop better things, as is traditional. */
export function rarityWeights(wave: number): Record<Rarity, number> {
  const t = Math.min(1, wave / 9)
  return {
    common: 60 - 40 * t,
    uncommon: 25 + 5 * t,
    rare: 10 + 15 * t,
    epic: 4 + 12 * t,
    legendary: 1 + 5 * t,
  }
}
