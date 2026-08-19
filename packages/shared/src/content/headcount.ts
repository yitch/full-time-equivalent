/**
 * Headcount.
 *
 * Every process needs an owner. That is the whole idea: towers do not occupy
 * abstract "slots", they consume **people**, and an automated process needs
 * fewer people than a manual one. It is the game's thesis expressed as a budget
 * line rather than a lecture.
 *
 * Getting headcount is slow, political and reversible only at a price. Losing it
 * is fast, expensive and leaves a mark. Both of those are the point.
 */

import type { Channel, ExitKind } from '../types.js'

/** FTE consumed by a tower, by damage channel. Automation is cheaper to own. */
export const HEADCOUNT_COST: Record<Channel, number> = {
  automation: 1,
  process: 2,
  human: 2,
  specialist: 2,
}

/** Approved FTE at the start of a run. */
export const STARTING_HEADCOUNT = 14

/** Budget drained per approved head, per wave. Nobody works for nothing. */
export const SALARY_PER_HEAD = 4

/** Social Capital to raise a requisition. Rises with every head you already have. */
export function requisitionCost(approved: number): number {
  return Math.round(10 + Math.max(0, approved - STARTING_HEADCOUNT) * 6)
}

/** Budget cost of the new hire's first-year loading: agency, kit, onboarding. */
export function requisitionSetupCost(approved: number): number {
  return Math.round(60 + Math.max(0, approved - STARTING_HEADCOUNT) * 15)
}

// ─────────────────────────────────────────────────────── the approval pipeline

export interface ReqStageDef {
  name: string
  flavour: string
  /** Waves spent at this stage. */
  waves: number
}

/**
 * Approval is not a purchase, it is a queue. Each stage clears at the end of a
 * wave, so a req raised now arrives about three waves late — which is roughly
 * when you no longer need it and exactly when you get it.
 */
export const REQ_STAGES: ReqStageDef[] = [
  {
    name: 'Drafting the case',
    flavour: 'You are writing the justification. There is a template. The template is from 2018.',
    waves: 1,
  },
  {
    name: 'With Finance',
    flavour: 'Finance has questions about the assumptions. Finance always has questions about the assumptions.',
    waves: 1,
  },
  {
    name: 'With the CFO',
    flavour: 'It is in the pack. It is item eleven. They got to item seven.',
    waves: 1,
  },
]

/**
 * The catch-22, stated plainly: you cannot get people until you are running well,
 * and you are not running well because you have no people. Below this SLA the
 * CFO defers the req once and tells you to fix the process instead.
 */
export const APPROVAL_SLA_THRESHOLD = 0.72

export const DEFERRAL_LINES: string[] = [
  '"Before we add people, show me you can run what you have."',
  '"Your SLA is where it is. More heads will not fix a process problem."',
  '"Let us look again after the next quarter\'s numbers."',
  '"Have you looked at whether this can be automated?"',
]

export const APPROVAL_LINES: string[] = [
  '"Approved. One head. Do not come back in six weeks."',
  '"Fine — but this comes out of the same envelope."',
  '"You made the case. Start the search."',
  '"Approved, subject to the usual controls."',
]

// ────────────────────────────────────────────────────────────────── exits

export interface ExitDef {
  kind: ExitKind
  name: string
  flavour: string
  /** Immediate Budget cost. */
  budget: number
  /** Immediate Morale hit. */
  morale: number
  /** Social Capital lost — you spent credibility getting them. */
  social: number
  /** Seconds of consultation before the head actually leaves. */
  consultSeconds: number
  /** Morale drained per second across the consultation. */
  moralePerSecond: number
  /** Chance of an Employee Relations case being raised. */
  erRisk: number
}

/**
 * Three ways to lose a head, and the trade is real. Attrition is free and slow.
 * Voluntary is fast and expensive. Compulsory is cheap and it costs you in every
 * currency that is not money.
 */
export const EXIT_OPTIONS: Record<ExitKind, ExitDef> = {
  attrition: {
    kind: 'attrition',
    name: 'Do Not Backfill',
    flavour:
      'Someone resigned. You simply do not replace them. Free, invisible, and you keep paying the salary until they actually go.',
    budget: 0,
    morale: 0,
    social: 0,
    consultSeconds: 45,
    moralePerSecond: 0,
    erRisk: 0,
  },
  voluntary: {
    kind: 'voluntary',
    name: 'Voluntary Redundancy',
    flavour:
      'An enhanced package, taken willingly. Expensive, quick, and the people who remain still talk to you afterwards.',
    budget: 140,
    morale: 5,
    social: 4,
    consultSeconds: 12,
    moralePerSecond: 0,
    erRisk: 0.05,
  },
  compulsory: {
    kind: 'compulsory',
    name: 'Compulsory Redundancy',
    flavour:
      'Statutory minimum, a consultation period, and a room you will remember. Cheap in Budget and expensive in everything else.',
    budget: 45,
    morale: 14,
    social: 12,
    consultSeconds: 40,
    moralePerSecond: 0.22,
    erRisk: 0.45,
  },
}

export const EXIT_LINES: Record<ExitKind, string[]> = {
  attrition: [
    'The role has been closed rather than backfilled.',
    'We are absorbing the work within the existing team.',
    'No decision has been made about the vacancy.',
  ],
  voluntary: [
    'Expressions of interest have been invited.',
    'The window closes Friday.',
    'The package has been described as generous by the people who designed it.',
  ],
  compulsory: [
    'A collective consultation has commenced.',
    'At-risk letters have gone out.',
    'The meeting is at four. There is a note-taker.',
  ],
}
