import type { RequestDef, RequestTypeId, Resistances } from '../types.js'

/** Helper so resistance tables stay readable. Unlisted channels default to 1. */
function res(partial: Partial<Resistances>): Resistances {
  return {
    automation: partial.automation ?? 1,
    process: partial.process ?? 1,
    human: partial.human ?? 1,
    specialist: partial.specialist ?? 1,
  }
}

/**
 * Inbound requests. Every one of these is a real thing a real HR team receives,
 * with the exception of the elites, which are also real, which is the problem.
 *
 * Balance note: resistances are the whole combat model. A request that only
 * automation can kill is boring; a request that automation *cannot* kill is a
 * lesson. Prefer the second.
 */
export const REQUESTS: Record<RequestTypeId, RequestDef> = {
  leave_balance: {
    id: 'leave_balance',
    name: 'Leave Balance Query',
    flavour: '"Hi! Quick one — how many days do I have left?" It is in the portal. It has always been in the portal.',
    hp: 14,
    speed: 1.9,
    resist: res({}),
    moraleDamage: 1,
    slaSeconds: 40,
    socialCapital: 1,
    bounty: 3,
    sprite: 'req_trivial',
  },

  policy_question: {
    id: 'policy_question',
    name: 'Policy Question',
    flavour: '"I read the policy but I want you to tell me it says what I want it to say."',
    hp: 46,
    speed: 1.2,
    resist: res({ automation: 0.15 }),
    moraleDamage: 2,
    slaSeconds: 50,
    socialCapital: 3,
    bounty: 9,
    sprite: 'req_policy',
  },

  payroll_discrepancy: {
    id: 'payroll_discrepancy',
    name: 'Payroll Discrepancy',
    flavour: 'Short by $340. Payday is Thursday. There is no version of this where you get to go home.',
    hp: 70,
    speed: 2.3,
    resist: res({ automation: 0.4, process: 0.7, human: 0.6, specialist: 2.0 }),
    moraleDamage: 8,
    slaSeconds: 35,
    specialistRole: 'wolf',
    socialCapital: 6,
    bounty: 16,
    quirks: ['cutoff_split'],
    sprite: 'req_payroll',
  },

  expense_claim: {
    id: 'expense_claim',
    name: 'Expense Claim',
    flavour: 'Forty-one receipts. Nine currencies. One of them is a photograph of a different receipt.',
    hp: 95,
    speed: 0.85,
    resist: res({ automation: 0, process: 0.3, human: 0.2, specialist: 2.5 }),
    moraleDamage: 5,
    slaSeconds: 70,
    specialistRole: 'rhino',
    splitsInto: 2,
    socialCapital: 5,
    bounty: 14,
    sprite: 'req_expense',
  },

  er_case: {
    id: 'er_case',
    name: 'Employee Relations Case',
    flavour: 'Nobody has filed anything yet. That is not the same as nothing happening.',
    hp: 130,
    speed: 0.55,
    resist: res({ automation: 0, process: 0, human: 0.5, specialist: 3.0 }),
    moraleDamage: 0,
    complianceDamage: 14,
    slaSeconds: 110,
    stealth: true,
    specialistRole: 'viper',
    socialCapital: 12,
    bounty: 26,
    sprite: 'req_er',
  },

  onboarding_packet: {
    id: 'onboarding_packet',
    name: 'Onboarding Packet',
    flavour: 'Congratulations on the hire. Here are the forty-two things that must happen before Monday.',
    hp: 62,
    speed: 0.95,
    resist: res({ automation: 0.6, process: 1.2 }),
    moraleDamage: 4,
    slaSeconds: 60,
    socialCapital: 3,
    bounty: 11,
    sprite: 'req_onboarding',
  },

  benefits_enrollment: {
    id: 'benefits_enrollment',
    name: 'Benefits Enrollment',
    flavour: '"Which plan should I pick?" You are not allowed to answer this. You will answer this.',
    hp: 30,
    speed: 1.5,
    resist: res({ automation: 0.8, human: 0.9 }),
    moraleDamage: 2,
    slaSeconds: 45,
    socialCapital: 2,
    bounty: 6,
    sprite: 'req_benefits',
  },

  // ───────────────────────────────────────────────────────── named elites

  batman: {
    id: 'batman',
    name: 'Batman',
    flavour: 'Filled in the I-9 as "Batman". Twice. Says he legally changed it. He did not legally change it.',
    hp: 320,
    speed: 1.1,
    resist: res({ automation: 0.5, process: 0 }),
    moraleDamage: 14,
    slaSeconds: 80,
    socialCapital: 20,
    bounty: 60,
    elite: true,
    quirks: ['immune_process'],
    sprite: 'req_batman',
  },

  cat_sitter: {
    id: 'cat_sitter',
    name: 'The Cat-Sitter Claim',
    flavour: 'Submitted a cat-sitter as a business travel expense. Has cited precedent. There is no precedent.',
    hp: 150,
    speed: 0.8,
    resist: res({ automation: 0, process: 0.25, human: 0.2, specialist: 2.5 }),
    moraleDamage: 9,
    slaSeconds: 75,
    specialistRole: 'rhino',
    splitsInto: 3,
    socialCapital: 14,
    bounty: 40,
    elite: true,
    sprite: 'req_cat',
  },

  beauty_of_the_day: {
    id: 'beauty_of_the_day',
    name: 'Lost In The Beauty Of The Day',
    flavour: 'Contesting a tardiness point. Argues he was admiring God’s creation and missed the exit. Theologically, he has a case.',
    hp: 190,
    speed: 1.0,
    resist: res({ process: 0.7 }),
    moraleDamage: 10,
    slaSeconds: 70,
    socialCapital: 15,
    bounty: 42,
    elite: true,
    quirks: ['heals_from_automation'],
    sprite: 'req_beauty',
  },

  the_mustang: {
    id: 'the_mustang',
    name: 'The Mustang',
    flavour: 'Free upgrade to a convertible. Claim denied: "Mustangs use more gas than a compact." He would like to discuss this.',
    hp: 210,
    speed: 1.35,
    resist: res({ automation: 0.2, process: 0.5, specialist: 2.2 }),
    moraleDamage: 11,
    slaSeconds: 60,
    specialistRole: 'rhino',
    socialCapital: 16,
    bounty: 45,
    elite: true,
    quirks: ['reflects'],
    sprite: 'req_mustang',
  },

  facebook_parity: {
    id: 'facebook_parity',
    name: 'Facebook Friend Parity Complaint',
    flavour: 'Requests you instruct a colleague to friend everyone, or no one. Has proposed a policy. Has drafted the policy.',
    hp: 120,
    speed: 1.3,
    resist: res({ automation: 0.4 }),
    moraleDamage: 6,
    slaSeconds: 55,
    socialCapital: 10,
    bounty: 28,
    elite: true,
    quirks: ['shares_damage'],
    sprite: 'req_facebook',
  },

  support_squirrel: {
    id: 'support_squirrel',
    name: 'Emotional Support Squirrel',
    flavour: 'An accommodation request. You must engage in the interactive process. The squirrel is already in the building.',
    hp: 140,
    speed: 1.7,
    resist: res({ automation: 0, process: 0.3, human: 0.6, specialist: 2.5 }),
    moraleDamage: 4,
    complianceDamage: 10,
    slaSeconds: 65,
    stealth: true,
    specialistRole: 'viper',
    socialCapital: 18,
    bounty: 38,
    elite: true,
    quirks: ['erratic'],
    sprite: 'req_squirrel',
  },
}

/**
 * How often a request leaves something behind.
 *
 * Elites always drop. Everything else drops rarely but *from wave one* — the
 * previous rule of "elites only" meant a player saw no loot at all until wave
 * six and reasonably concluded the game had no equipment in it.
 */
export function dropChanceFor(def: RequestDef): number {
  if (def.dropChance !== undefined) return def.dropChance
  if (def.elite) return 1
  return Math.min(0.12, 0.035 + def.hp / 1400)
}

export const REQUEST_IDS = Object.keys(REQUESTS)

export function getRequest(id: RequestTypeId): RequestDef {
  const def = REQUESTS[id]
  if (!def) throw new Error(`Unknown request type: ${id}`)
  return def
}
