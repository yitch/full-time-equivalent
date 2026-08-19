import type { RequestTypeId, RoleId } from '../types.js'

/**
 * Speech bubbles. Cheap to add, highest laugh-per-byte in the repo.
 *
 * House style: no punchlines. These are things people genuinely say, placed
 * somewhere that makes them funny. If a line reads like a joke, cut it and
 * write down what someone actually emailed you instead.
 */

/** Spoken by a request when it spawns. */
export const SPAWN_BARKS: Record<RequestTypeId, string[]> = {
  leave_balance: [
    'sorry to bother you!!',
    'quick one',
    'I know this is in the system but',
    'happy Friday :) quick q',
    'apologies for the multiple emails',
    'not urgent!',
    'per my last email',
  ],
  policy_question: [
    'I read the policy but',
    'hypothetically',
    'asking for a friend',
    'where does it actually SAY that',
    'my previous employer allowed this',
    'can you point me to the clause',
  ],
  payroll_discrepancy: [
    'my payslip is wrong',
    'I am short $340',
    'this is the third month',
    'has this been escalated',
    'I have screenshots',
  ],
  expense_claim: [
    'attaching receipts',
    're-attaching receipts',
    'the receipt is a photo of a receipt',
    'this was pre-approved verbally',
    'the currency conversion is my own estimate',
  ],
  er_case: [
    '...',
    'do you have five minutes',
    'is this confidential',
    'I do not want to make a thing of it',
    'off the record',
  ],
  onboarding_packet: [
    'starts Monday',
    'no laptop yet',
    'not in the system',
    'which system do I use for the thing',
    'nobody sent me the link',
  ],
  benefits_enrollment: [
    'which plan should I pick',
    'what would YOU pick',
    'can I change it after',
    'is the dental one worth it',
    'my spouse says the other one is better',
  ],
  batman: ['I am Batman.', 'I legally changed it.', 'check again'],
  cat_sitter: ['she gets anxious', 'it was a business trip', 'there is precedent'],
  beauty_of_the_day: [
    'I was admiring creation',
    'the sunrise was genuinely remarkable',
    'you cannot penalise wonder',
  ],
  the_mustang: [
    'it was the same price',
    'the upgrade was FREE',
    'this is about principle now',
  ],
  facebook_parity: ['everyone or no one', 'I have drafted a policy', 'it is about consistency'],
  support_squirrel: ['he is very calm', 'he has a harness', 'he is already inside'],
}

/** Spoken by a request the moment it escalates. */
export const ESCALATION_BARKS: string[] = [
  'cc-ing your manager',
  '+ Head of HR',
  'adding the CHRO for visibility',
  'FOLLOWING UP',
  'third attempt',
  'I will just call then',
  'bumping this to the top of your inbox',
  'looping in Legal',
]

/** Spoken by the CHRO door when something reaches it. */
export const BREACH_BARKS: string[] = [
  '"Why am I hearing about this from them?"',
  '"I thought we had a system for this."',
  '"Walk me through what happened."',
  '"This should never have reached me."',
  '"Do we have a process? Genuinely asking."',
]

/** Spoken by a player when an ability lands. */
export const ROLE_BARKS: Record<RoleId, string[]> = {
  hrbp: ['let me take that offline', 'circling back', 'what does good look like here', 'I will socialise it'],
  payroll: ['the cutoff is the cutoff', 'that is a Finance question', 'it will be in the next run', 'no'],
  talent: ['great news!', 'they start Monday', 'strong pipeline', 'we lost them to comp'],
  rewards: ['benchmarked at the 50th', 'that is outside the band', 'let me pull the data', 'per the matrix'],
  hris: ['I can pull a report', 'that is a config change', 'do NOT touch anything', 'restoring from backup'],
  travel: ['receipt required', 'that is above the cap', 'per diem', 'nobody knows my name'],
}

/** Shown in the HUD ticker between waves. */
export const TICKER_LINES: string[] = [
  'Reminder: the annual engagement survey closes Friday. Participation is voluntary and tracked.',
  'The printer on 3 is still being fixed.',
  'Please do not reply-all.',
  'Please do not reply-all.',
  'Someone has left a labelled lunch in the fridge. It is now unlabelled.',
  'Wellness Wednesday: a 20-minute session on resilience, scheduled over your lunch break.',
  'The intranet has been redesigned. All links have moved. There is no redirect.',
  'A calendar invite has been sent titled "Quick sync" with no agenda and eleven attendees.',
  'IT has scheduled maintenance for Tuesday afternoon. You asked for a weekend.',
  'HR is a business partner, not a cost centre, says the slide from the cost centre review.',
]

/** Steering committee rejections. */
export const CFO_REJECTIONS: string[] = [
  '"Let\'s revisit this next quarter."',
  '"What\'s the ROI on that?"',
  '"Can you not just do it manually for now?"',
  '"Is this a nice-to-have?"',
  '"Put it in the FY plan."',
  '"How much does the vendor want? ...No."',
]

export const CFO_APPROVALS: string[] = [
  '"Fine. But this is the last one."',
  '"You made a good case."',
  '"I want to see the numbers in six months."',
  '"Approved. Do not tell Facilities."',
  '"About time, honestly."',
]
