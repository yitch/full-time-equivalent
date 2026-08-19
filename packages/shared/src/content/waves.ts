import type { SpawnGroup, WaveDef } from '../types.js'

function g(at: number, requestType: string, count: number, lane: number, spacing = 0.8): SpawnGroup {
  return { at, requestType, count, lane, spacing }
}

/**
 * Eight waves and a boss. Each wave teaches exactly one thing and then tests it.
 * If you cannot write the `teaches` line, the wave is not designed yet.
 */
export const WAVES: WaveDef[] = [
  {
    index: 0,
    name: 'Monday',
    briefing:
      'It is 08:57. There are already nineteen unread. None of them are urgent and all of them say "urgent".',
    teaches: 'Tier 0 exists. Cheap deflection beats expensive attention.',
    groups: [g(1, 'leave_balance', 14, 1, 1.0), g(9, 'leave_balance', 10, 0, 0.9)],
    budgetReward: 90,
    tailSeconds: 6,
  },
  {
    index: 1,
    name: '"Quick Question"',
    briefing:
      'Nobody has ever had a quick question. The phrase is load-bearing dishonesty and we have all agreed to accept it.',
    teaches: 'Policy Questions shrug off automation. You need process or a person.',
    groups: [
      g(1, 'leave_balance', 12, 1, 0.8),
      g(5, 'policy_question', 5, 0, 1.8),
      g(15, 'policy_question', 6, 2, 1.6),
    ],
    budgetReward: 110,
    tailSeconds: 8,
  },
  {
    index: 2,
    name: 'Payday Minus Two',
    briefing:
      'Payroll cutoff is Wednesday 17:00. This is not a preference, a guideline, or a starting position for a negotiation.',
    teaches: 'Cutoff clocks. Miss one and it does not breach — it doubles.',
    groups: [
      g(1, 'payroll_discrepancy', 5, 0, 2.2),
      g(8, 'leave_balance', 10, 1, 0.7),
      g(16, 'payroll_discrepancy', 6, 0, 1.8),
      g(24, 'policy_question', 5, 2, 1.5),
    ],
    budgetReward: 140,
    tailSeconds: 10,
  },
  {
    index: 3,
    name: 'The Receipts',
    briefing:
      'Q3 travel has landed. Somebody has expensed a hotel minibar as "client hospitality (self)".',
    teaches: 'Expense Claims are immune to every automation tower you own. Splitting is real.',
    groups: [
      g(1, 'expense_claim', 6, 2, 2.4),
      g(10, 'benefits_enrollment', 12, 1, 0.7),
      g(18, 'expense_claim', 7, 2, 2.0),
      g(26, 'payroll_discrepancy', 4, 0, 2.0),
    ],
    budgetReward: 170,
    tailSeconds: 12,
  },
  {
    index: 4,
    name: 'Something Happened At The Offsite',
    briefing:
      'Nobody has filed anything. Three people have separately asked you a hypothetical question "on behalf of a friend".',
    teaches: 'ER cases are invisible to every tower and drain Compliance, not Morale.',
    groups: [
      g(2, 'er_case', 2, 1, 6),
      g(6, 'leave_balance', 14, 0, 0.6),
      g(16, 'policy_question', 8, 2, 1.2),
      g(28, 'er_case', 2, 1, 6),
    ],
    budgetReward: 200,
    tailSeconds: 14,
  },
  {
    index: 5,
    name: 'Reorg Rumours',
    briefing:
      'Someone saw a slide. The slide had boxes on it. The boxes had no names, which everybody has interpreted as their name.',
    teaches: 'Everything at once, and your first Escalations. Failures come back stronger.',
    groups: [
      g(1, 'policy_question', 9, 0, 1.1),
      g(4, 'leave_balance', 18, 1, 0.5),
      g(10, 'onboarding_packet', 6, 2, 1.6),
      g(18, 'payroll_discrepancy', 5, 0, 1.8),
      g(24, 'expense_claim', 6, 2, 1.8),
      g(30, 'benefits_enrollment', 14, 1, 0.6),
    ],
    budgetReward: 230,
    tailSeconds: 16,
  },
  {
    index: 6,
    name: 'Batman',
    briefing:
      'The new starter has completed his I-9 as "Batman". Twice. He has been told. He has acknowledged being told.',
    teaches: 'Named elites. Your ticketing system has no field for this.',
    groups: [
      g(2, 'batman', 1, 1, 1),
      g(4, 'onboarding_packet', 8, 2, 1.2),
      g(12, 'facebook_parity', 2, 0, 3),
      g(20, 'leave_balance', 16, 1, 0.5),
      g(26, 'beauty_of_the_day', 1, 0, 1),
      g(32, 'expense_claim', 5, 2, 1.8),
    ],
    budgetReward: 270,
    tailSeconds: 18,
  },
  {
    index: 7,
    name: 'Systems Maintenance',
    briefing:
      'The vendor has scheduled the upgrade for a Tuesday afternoon. You asked for a weekend. They said Tuesday afternoon.',
    teaches: 'Automation goes dark. Human and specialist damage is all you have.',
    groups: [
      g(1, 'leave_balance', 16, 1, 0.6),
      g(6, 'policy_question', 8, 0, 1.2),
      g(12, 'expense_claim', 8, 2, 1.5),
      g(20, 'payroll_discrepancy', 7, 0, 1.5),
      g(28, 'the_mustang', 1, 2, 1),
      g(34, 'support_squirrel', 2, 1, 4),
    ],
    budgetReward: 320,
    tailSeconds: 18,
    maintenanceWindows: [
      { at: 10, seconds: 12 },
      { at: 26, seconds: 14 },
    ],
  },
  {
    index: 8,
    name: 'OPEN ENROLLMENT',
    briefing:
      'Volume is up between five and ten times for the next three weeks. This is documented, expected, planned for, and completely survivable, say the people who do not work here.',
    teaches: 'Everything. All of it. At once. This is the exam.',
    boss: true,
    groups: [
      g(0, 'benefits_enrollment', 24, 1, 0.4),
      g(2, 'benefits_enrollment', 24, 0, 0.4),
      g(4, 'benefits_enrollment', 24, 2, 0.4),
      g(8, 'leave_balance', 20, 1, 0.35),
      g(12, 'policy_question', 14, 0, 0.9),
      g(16, 'expense_claim', 9, 2, 1.4),
      g(20, 'payroll_discrepancy', 9, 0, 1.2),
      g(24, 'benefits_enrollment', 30, 1, 0.3),
      g(28, 'er_case', 3, 2, 5),
      g(32, 'cat_sitter', 1, 2, 1),
      g(36, 'batman', 1, 0, 1),
      g(40, 'benefits_enrollment', 34, 0, 0.28),
      g(44, 'onboarding_packet', 12, 2, 0.8),
      g(50, 'beauty_of_the_day', 1, 1, 1),
      g(54, 'benefits_enrollment', 38, 1, 0.26),
      g(60, 'support_squirrel', 3, 0, 3),
      g(66, 'the_mustang', 1, 2, 1),
      g(70, 'benefits_enrollment', 44, 2, 0.24),
      g(78, 'facebook_parity', 3, 1, 2),
      g(84, 'policy_question', 20, 0, 0.6),
    ],
    budgetReward: 500,
    tailSeconds: 25,
    maintenanceWindows: [{ at: 58, seconds: 10 }],
  },
]

export function getWave(index: number): WaveDef | undefined {
  return WAVES[index]
}

export const WAVE_COUNT = WAVES.length
