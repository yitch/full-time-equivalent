import type { Stats } from '../types.js'

/**
 * The Performance Review.
 *
 * At the end of every wave you are guaranteed a level and offered three
 * development opportunities, of which you may select one. This is the corporate
 * version of a Dungeon Crawler Carl boon: the choice is real, the options are
 * random, and the framing is a form.
 *
 * Every perk is something an organisation would genuinely give you instead of
 * money.
 */
export interface PerkDef {
  id: string
  name: string
  /** The line on the form. */
  flavour: string
  /** What it actually does, spelled out. */
  effect: string
  stats: Partial<Stats>
  /** Icon key from the client icon set. */
  icon: string
  /** Higher is rarer. 1 = common. */
  weight: number
}

export const PERKS: PerkDef[] = [
  {
    id: 'mandatory_training',
    name: 'Mandatory Training',
    flavour: 'Completed. Certificate issued. Ninety minutes you will not get back.',
    effect: '+3 Power',
    stats: { power: 3 },
    icon: 'damage',
    weight: 1,
  },
  {
    id: 'ergonomic_assessment',
    name: 'Ergonomic Assessment',
    flavour: 'Someone came and looked at your chair and wrote it down.',
    effect: '+28 max HP',
    stats: { maxHp: 28 },
    icon: 'morale',
    weight: 1,
  },
  {
    id: 'noise_cancelling',
    name: 'Noise-Cancelling Headphones',
    flavour: 'Approved on the third attempt, as a reasonable adjustment.',
    effect: '+1.4 Bandwidth per second',
    stats: { focus: 1.4 },
    icon: 'automation',
    weight: 1,
  },
  {
    id: 'coffee_budget',
    name: 'Team Coffee Budget',
    flavour: 'Forty pounds a month for a team of nine. It is the gesture.',
    effect: '+18 max Bandwidth',
    stats: { maxBandwidth: 18 },
    icon: 'budget',
    weight: 1,
  },
  {
    id: 'standing_desk',
    name: 'Standing Desk',
    flavour: 'Raised once, in week one. You will raise it again in the new year.',
    effect: '+10% attack speed',
    stats: { attackSpeed: 0.1 },
    icon: 'slow',
    weight: 1,
  },
  {
    id: 'mentoring',
    name: 'Mentoring Scheme',
    flavour: 'Paired with someone two grades up. You meet quarterly. It is fine.',
    effect: '+14% XP gained',
    stats: { xpGain: 0.14 },
    icon: 'social',
    weight: 1,
  },
  {
    id: 'delegation',
    name: 'Delegation Training',
    flavour: 'You learned to let other people do things badly. Growth.',
    effect: '+7% damage from every tower you built',
    stats: { towerDamage: 0.07 },
    icon: 'process',
    weight: 1,
  },
  {
    id: 'visibility',
    name: 'Exposure To Senior Leadership',
    flavour: 'You presented for four minutes. Somebody remembered your name.',
    effect: '+12% Social Capital gained',
    stats: { socialGain: 0.12 },
    icon: 'social',
    weight: 1,
  },
  {
    id: 'second_monitor',
    name: 'Second Monitor',
    flavour: 'A nine-month business case, approved the week you stopped needing it.',
    effect: '+0.6 reach',
    stats: { reach: 0.6 },
    icon: 'track',
    weight: 1,
  },
  {
    id: 'flexible_hours',
    name: 'Flexible Working Arrangement',
    flavour: 'Agreed informally with your line manager and recorded nowhere.',
    effect: '+0.7 move speed',
    stats: { moveSpeed: 0.7 },
    icon: 'human',
    weight: 1,
  },
  {
    id: 'ppe',
    name: 'Personal Protective Equipment',
    flavour: 'For an office. Nobody could explain it. You signed for it.',
    effect: '+4 armour',
    stats: { armour: 4 },
    icon: 'compliance',
    weight: 1,
  },
  {
    id: 'wellbeing_app',
    name: 'Wellbeing App Subscription',
    flavour: 'Instead of headcount. There is a breathing exercise and a bear.',
    effect: '+1.6 HP per second out of combat',
    stats: { regen: 1.6 },
    icon: 'morale',
    weight: 1,
  },
  {
    id: 'process_owner',
    name: 'Named Process Owner',
    flavour: 'Your name is now on a document. This is treated as a reward.',
    effect: '+6% tower range',
    stats: { towerRange: 0.06 },
    icon: 'prevent',
    weight: 1,
  },
  {
    id: 'subject_matter',
    name: 'Recognised Subject Matter Expert',
    flavour: 'A title with no salary attached, awarded enthusiastically.',
    effect: '+15% specialist damage',
    stats: { specialistPower: 0.15 },
    icon: 'specialist',
    weight: 1,
  },
  {
    id: 'intern_supervision',
    name: 'Intern Supervision Duty',
    flavour: 'Congratulations, this is a development opportunity for you both.',
    effect: '+35% intern damage',
    stats: { internPower: 0.35 },
    icon: 'headcount',
    weight: 1,
  },
  {
    id: 'expenses_delegation',
    name: 'Expense Approval Authority',
    flavour: 'Up to £250, which covers almost nothing anyone actually claims.',
    effect: '+14% Budget gained',
    stats: { budgetGain: 0.14 },
    icon: 'expense',
    weight: 1,
  },
]

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]))

/** How many options a review offers. Three is a choice; five is a menu. */
export const REVIEW_OPTIONS = 3
