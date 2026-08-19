import type { TechId, TechNode } from '../types.js'

/**
 * The tech tree. Priced in Social Capital, which you earn by doing the job
 * *well* — never by doing more of it. A player who brute-forces with human
 * towers survives the early waves and then cannot afford anything, and dies at
 * Open Enrollment. That is the intended lesson and the balance target.
 */
export const TECH: Record<TechId, TechNode> = {
  // ── Tier 0: Deflection ───────────────────────────────────────────────────
  intranet: {
    id: 'intranet',
    name: 'Intranet Page',
    flavour: 'You have a page. It is a start. It is barely a start.',
    branch: 'tier0',
    cost: 0,
    requires: [],
    unlocksTowers: ['intranet'],
    row: 0,
    col: 0,
  },
  kb: {
    id: 'kb',
    name: 'Knowledge Base',
    flavour: 'Someone finally wrote it down. Every Tier-0 deflection now earns Social Capital.',
    branch: 'tier0',
    cost: 12,
    requires: ['intranet'],
    unlocksTowers: ['faq'],
    passive: 'sc_per_deflection',
    row: 0,
    col: 1,
  },
  selfservice: {
    id: 'selfservice',
    name: 'Employee Self-Service',
    flavour: 'They can change their own address. This took eighteen months to approve.',
    branch: 'tier0',
    cost: 26,
    requires: ['kb'],
    unlocksTowers: ['portal'],
    row: 0,
    col: 2,
  },
  chatbot: {
    id: 'chatbot',
    name: 'Conversational Assistant',
    flavour: 'The vendor demo was flawless. The vendor demo is always flawless.',
    branch: 'tier0',
    cost: 40,
    requires: ['selfservice'],
    unlocksTowers: ['ava'],
    row: 0,
    col: 3,
  },
  aiagent: {
    id: 'aiagent',
    name: 'AI Agent',
    flavour: 'All automation towers hit 25% harder. Nobody can explain to Legal how it works.',
    branch: 'tier0',
    cost: 70,
    requires: ['chatbot'],
    passive: 'automation_up',
    row: 0,
    col: 4,
  },

  // ── Tier 1: Case management ──────────────────────────────────────────────
  inbox: {
    id: 'inbox',
    name: 'Shared Inbox',
    flavour: 'hr@. Four people have it open. Two of them reply. Sometimes to the same person.',
    branch: 'casemgmt',
    cost: 6,
    requires: [],
    passive: 'sla_extension',
    row: 1,
    col: 0,
  },
  ticketing: {
    id: 'ticketing',
    name: 'Ticketing System',
    flavour: 'The single highest-leverage purchase in this building. Unlocks the keystone tower.',
    branch: 'casemgmt',
    cost: 18,
    requires: ['inbox'],
    unlocksTowers: ['ticketing', 'workflow'],
    row: 1,
    col: 1,
  },
  casemgmt: {
    id: 'casemgmt',
    name: 'Case Management',
    flavour: 'Escalated requests can now be talked back down. You have never needed anything more.',
    branch: 'casemgmt',
    cost: 55,
    requires: ['ticketing'],
    passive: 'deescalation',
    row: 1,
    col: 2,
  },
  triage: {
    id: 'triage',
    name: 'Auto-Triage & Routing',
    flavour: 'Requests get sent to the person who can help. Revolutionary. Cost a fortune.',
    branch: 'casemgmt',
    cost: 62,
    requires: ['casemgmt'],
    unlocksTowers: ['triage'],
    row: 1,
    col: 3,
  },

  // ── Integration ──────────────────────────────────────────────────────────
  sso: {
    id: 'sso',
    name: 'Single Sign-On',
    flavour: 'One password. IT took the credit. You did the change management.',
    branch: 'integration',
    cost: 18,
    requires: [],
    row: 2,
    col: 0,
  },
  hrfin: {
    id: 'hrfin',
    name: 'HRIS ↔ Finance',
    flavour: 'Two systems that have never spoken now exchange one file a night, badly.',
    branch: 'integration',
    cost: 44,
    requires: ['sso'],
    unlocksTowers: ['finance_integration'],
    row: 2,
    col: 1,
  },
  masterdata: {
    id: 'masterdata',
    name: 'Master Data Governance',
    flavour: 'Removes the 10% chance that a resolved request quietly comes back as a data error.',
    branch: 'integration',
    cost: 60,
    requires: ['hrfin'],
    passive: 'no_data_errors',
    row: 2,
    col: 2,
  },
  rpa: {
    id: 'rpa',
    name: 'Robotic Process Automation',
    flavour: 'It does the thing. Until someone renames a column. Then it does not do the thing.',
    branch: 'integration',
    cost: 78,
    requires: ['masterdata'],
    unlocksTowers: ['rpa'],
    row: 2,
    col: 3,
  },

  // ── Culture ──────────────────────────────────────────────────────────────
  townhall: {
    id: 'townhall',
    name: 'Town Hall',
    flavour: 'Forty minutes of slides. Six minutes of questions. One of them useful.',
    branch: 'culture',
    cost: 14,
    requires: [],
    row: 3,
    col: 0,
  },
  enablement: {
    id: 'enablement',
    name: 'Manager Enablement',
    flavour: 'Teach the managers to manage. Fewer things arrive. Nobody thanks you.',
    branch: 'culture',
    cost: 38,
    requires: ['townhall'],
    unlocksTowers: ['manager_enablement'],
    row: 3,
    col: 1,
  },
  plainpolicy: {
    id: 'plainpolicy',
    name: 'Plain-English Policy',
    flavour: 'Deletes Policy Questions before they exist, by writing down what the policy means.',
    branch: 'culture',
    cost: 58,
    requires: ['enablement'],
    unlocksTowers: ['policy_rewrite'],
    row: 3,
    col: 2,
  },
  justsayno: {
    id: 'justsayno',
    name: '"Just Say No"',
    flavour: '5% of all inbound never happens. The most powerful node in the game, and the hardest permission to get in real life.',
    branch: 'culture',
    cost: 120,
    requires: ['plainpolicy', 'casemgmt'],
    passive: 'just_say_no',
    row: 3,
    col: 3,
  },
}

export const TECH_IDS = Object.keys(TECH)

export function getTech(id: TechId): TechNode {
  const node = TECH[id]
  if (!node) throw new Error(`Unknown tech node: ${id}`)
  return node
}

/** Nodes the run begins with, free. */
export const STARTING_TECH: TechId[] = ['intranet']

export function canUnlock(id: TechId, unlocked: TechId[], socialCapital: number): { ok: boolean; reason?: string } {
  const node = TECH[id]
  if (!node) return { ok: false, reason: 'No such initiative.' }
  if (unlocked.includes(id)) return { ok: false, reason: 'Already delivered.' }
  const missing = node.requires.filter((r) => !unlocked.includes(r))
  if (missing.length > 0) {
    return { ok: false, reason: `Blocked by: ${missing.map((m) => TECH[m]?.name ?? m).join(', ')}` }
  }
  if (socialCapital < node.cost) {
    return { ok: false, reason: `"Let's revisit this next quarter." (need ${node.cost} Social Capital)` }
  }
  return { ok: true }
}
