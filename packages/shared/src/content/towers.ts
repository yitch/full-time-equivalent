import type { Contribution, TowerDef, TowerTypeId, TowerUpgrade } from '../types.js'

function up(
  name: string,
  flavour: string,
  cost: number,
  socialCost: number,
  damageMul: number,
  rangeMul = 1,
  fireRateMul = 1,
): TowerUpgrade {
  return { name, flavour, cost, socialCost, damageMul, rangeMul, fireRateMul }
}

/**
 * Towers are processes and technology, never people. If you find yourself
 * wanting to add a tower called "Senior HR Advisor", stop — that is a role.
 *
 * Every tower's gag must also be its mechanic. Ava heals things sometimes.
 * The RPA Bot dies during maintenance. The intranet page does one damage.
 */
export const TOWERS: Record<TowerTypeId, TowerDef> = {
  intranet: {
    id: 'intranet',
    name: 'Intranet Page Nobody Reads',
    flavour: 'Last updated 2019 by someone who has since left. It is, technically, a defence.',
    channel: 'automation',
    cost: 25,
    range: 9,
    damage: 3.8,
    fireRate: 1.6,
    targeting: 'first',
    contributes: ['deflect'] as Contribution[],
    upgrades: [
      up('Pin To Homepage', 'Now nobody reads it from the homepage.', 40, 0, 2.2),
      up('Add A Banner', 'The banner has a megaphone icon. It changes nothing.', 90, 4, 2.0, 1.15),
    ],
    sprite: 'tw_intranet',
  },

  faq: {
    id: 'faq',
    name: 'FAQ Article',
    flavour: 'Twelve questions, none of them frequently asked, all of them asked by one director in 2022.',
    channel: 'automation',
    cost: 60,
    requires: 'kb',
    range: 6,
    damage: 25.6,
    fireRate: 2.1,
    targeting: 'first',
    contributes: ['deflect', 'damage'] as Contribution[],
    upgrades: [
      up('Search Indexing', 'People can now find it. Numbers go up immediately.', 70, 2, 1.6),
      up('Screenshots', 'Annotated in red. Genuinely helpful. Rare.', 130, 6, 1.7, 1.2),
    ],
    sprite: 'tw_faq',
  },

  portal: {
    id: 'portal',
    name: 'Employee Self-Service Portal',
    flavour: 'Deletes Leave Balance Queries outright. Does nothing whatsoever to anything else. Worth it.',
    channel: 'automation',
    cost: 140,
    requires: 'selfservice',
    range: 7.5,
    damage: 78.5,
    fireRate: 1.4,
    targeting: 'weakest',
    contributes: ['deflect'] as Contribution[],
    upgrades: [
      up('Mobile View', 'They will still email you. But fewer of them.', 120, 4, 1.5),
      up('Single Sign-On', 'Removing one password removed forty tickets.', 200, 10, 1.6, 1.25),
    ],
    sprite: 'tw_portal',
  },

  ava: {
    id: 'ava',
    name: 'Ava (Chatbot)',
    flavour: 'Hi, I am Ava! 8% of the time Ava misroutes the ticket and the requester comes back happier and harder to kill.',
    channel: 'automation',
    cost: 120,
    requires: 'chatbot',
    range: 7,
    damage: 37.3,
    fireRate: 3.6,
    targeting: 'random',
    quirks: ['misroute'],
    contributes: ['deflect', 'damage'] as Contribution[],
    upgrades: [
      up('Better Intents', 'Ava now misroutes with confidence.', 110, 3, 1.55),
      up('Handoff To Human', 'Ava learns to give up early. This is an improvement.', 190, 9, 1.4, 1.1, 1.3),
    ],
    sprite: 'tw_ava',
  },

  ticketing: {
    id: 'ticketing',
    name: 'Ticketing System',
    flavour: 'Applies TRACKED. It cannot be argued with, cannot be reopened by shouting, and remembers everything. The keystone.',
    channel: 'process',
    cost: 150,
    requires: 'ticketing',
    range: 8,
    damage: 59.0,
    fireRate: 2.0,
    targeting: 'first',
    applies: 'tracked',
    contributes: ['track', 'slow', 'sla'] as Contribution[],
    upgrades: [
      up('SLA Rules', 'The clock is now visible to everyone, including you.', 150, 5, 1.4),
      up('Auto-Acknowledgement', 'They feel heard. They have not been heard. Same effect.', 240, 12, 1.5, 1.2),
    ],
    sprite: 'tw_ticketing',
  },

  workflow: {
    id: 'workflow',
    name: 'Approval Workflow',
    flavour: 'Cannot kill anything. Makes it sit in a queue, which is the next best thing and, some days, better.',
    channel: 'process',
    cost: 160,
    requires: 'ticketing',
    range: 5,
    damage: 5.9,
    fireRate: 0.8,
    targeting: 'strongest',
    applies: 'queued',
    contributes: ['slow'] as Contribution[],
    upgrades: [
      up('Delegation Of Authority', 'Now it can sit in two queues.', 130, 4, 1.2, 1.2),
      up('Escalation Path', 'The queue now has a queue.', 210, 10, 1.3, 1.35),
    ],
    sprite: 'tw_workflow',
  },

  triage: {
    id: 'triage',
    name: 'Auto-Triage & Routing',
    flavour: 'Nudges requests sideways into the lane where somebody can actually help them. Radical.',
    channel: 'process',
    cost: 240,
    requires: 'triage',
    range: 6.5,
    damage: 35.4,
    fireRate: 1.7,
    targeting: 'first',
    quirks: ['reroute'],
    contributes: ['track', 'sla'] as Contribution[],
    upgrades: [
      up('Skills-Based Routing', 'It now knows who is on leave. Mostly.', 180, 6, 1.4),
      up('Sentiment Detection', 'Flags the ones typed in all caps.', 260, 14, 1.5, 1.2),
    ],
    sprite: 'tw_triage',
  },

  rpa: {
    id: 'rpa',
    name: 'RPA Bot',
    flavour: 'Highest automation damage in the game. Falls over completely the moment anyone changes a field label.',
    channel: 'automation',
    cost: 300,
    requires: 'rpa',
    range: 7,
    damage: 108.1,
    fireRate: 2.8,
    targeting: 'strongest',
    quirks: ['fragile_uptime'],
    contributes: ['damage'] as Contribution[],
    upgrades: [
      up('Exception Handling', 'It now emails you when it falls over.', 220, 8, 1.5),
      up('Attended Mode', 'A human watches it work. Nobody is sure who benefits.', 320, 16, 1.6, 1.15),
    ],
    sprite: 'tw_rpa',
  },

  finance_integration: {
    id: 'finance_integration',
    name: 'Finance Integration',
    flavour: 'The only tower in the game that can touch an Expense Claim. It touches it very, very gently.',
    channel: 'process',
    cost: 280,
    requires: 'hrfin',
    range: 7.5,
    damage: 74.7,
    fireRate: 1.4,
    targeting: 'strongest',
    contributes: ['expense', 'damage'] as Contribution[],
    upgrades: [
      up('Nightly Sync', 'Twelve hours of latency, presented as an achievement.', 200, 7, 1.45),
      up('Real-Time API', 'Finance said no. Then said yes. Then said "not this quarter". Then yes.', 300, 18, 1.6, 1.2),
    ],
    sprite: 'tw_finance',
  },

  manager_enablement: {
    id: 'manager_enablement',
    name: 'Manager Enablement',
    flavour: 'Reduces the number of requests that spawn at all. Invisible, unglamorous, never celebrated. Exactly like the real thing.',
    channel: 'process',
    cost: 220,
    requires: 'enablement',
    range: 0,
    damage: 0,
    fireRate: 0,
    targeting: 'first',
    quirks: ['prevention'],
    contributes: ['prevent'] as Contribution[],
    upgrades: [
      up('Manager Toolkit', 'A PDF. But a good PDF.', 160, 6, 1),
      up('Drop-In Clinics', 'Four people come. Those four never email you again.', 240, 14, 1),
    ],
    sprite: 'tw_enablement',
  },

  policy_rewrite: {
    id: 'policy_rewrite',
    name: 'Policy Rewrite (Plain English)',
    flavour: 'Deletes a share of Policy Questions before they spawn, by the radical method of writing down what the policy means.',
    channel: 'process',
    cost: 260,
    requires: 'plainpolicy',
    range: 0,
    damage: 0,
    fireRate: 0,
    targeting: 'first',
    quirks: ['spawn_filter'],
    contributes: ['prevent'] as Contribution[],
    upgrades: [
      up('Remove The Legalese', 'Legal pushed back. Legal lost, narrowly.', 190, 8, 1),
      up('One Page Maximum', 'Nobody believed it could be one page. It is one page.', 280, 20, 1),
    ],
    sprite: 'tw_policy',
  },
}

export const TOWER_IDS = Object.keys(TOWERS)

export function getTower(id: TowerTypeId): TowerDef {
  const def = TOWERS[id]
  if (!def) throw new Error(`Unknown tower type: ${id}`)
  return def
}

/**
 * What each outcome means, in one line, with the resource it protects. This is
 * the text that appears under a build card so a player never has to infer what
 * they are buying from a damage number.
 */
export const CONTRIBUTIONS: Record<Contribution, { icon: string; label: string; blurb: string; resource: string }> = {
  deflect: {
    icon: 'deflect',
    label: 'Deflects',
    blurb: 'Kills trivia early, before it becomes a ticket. In-SLA kills near the door earn Social Capital.',
    resource: 'social',
  },
  damage: {
    icon: 'damage',
    label: 'Resolves',
    blurb: 'Straightforward throughput. Fewer things reach the CHRO, so Morale holds.',
    resource: 'morale',
  },
  slow: {
    icon: 'slow',
    label: 'Buys time',
    blurb: 'Holds requests in a queue so your other defences get more shots at them.',
    resource: 'morale',
  },
  track: {
    icon: 'track',
    label: 'Makes everything else hit harder',
    blurb: 'Applies TRACKED: +30% damage taken from every source. The keystone multiplier.',
    resource: 'morale',
  },
  prevent: {
    icon: 'prevent',
    label: 'Stops it happening',
    blurb: 'Reduces how much arrives at all. Invisible, unglamorous, and the best value in the game.',
    resource: 'sla',
  },
  sla: {
    icon: 'sla',
    label: 'Protects the clock',
    blurb: 'Buys SLA headroom, so fewer requests escalate into something twice as dangerous.',
    resource: 'sla',
  },
  expense: {
    icon: 'expense',
    label: 'Touches Expense Claims',
    blurb: 'One of the only things in the game that can damage an Expense Claim at all.',
    resource: 'budget',
  },
  stealth: {
    icon: 'stealth',
    label: 'Sees hidden work',
    blurb: 'Reveals what no other tower can target. Protects Compliance rather than Morale.',
    resource: 'compliance',
  },
}

/** Sell refund rate. Deliberately punishing: undoing a process costs you. */
export const SELL_REFUND = 0.45
