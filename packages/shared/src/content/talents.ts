import type { RoleId, TalentBranch, TalentGrant, TalentNode, TalentTree } from '../types.js'

/**
 * Three branches per class, three nodes each, and you can never fill all three.
 * Levelling to 30 gives 29 points; maxing every node costs 33. The build is a
 * choice, not a checklist.
 *
 * The branches always mean the same three things, which is what makes fourteen
 * trees learnable:
 *
 *   LEAN IN    — double down on the dysfunction. Highest ceiling, worst habits.
 *   GROW OUT   — mitigate it. You become a functional adult. Less spectacular.
 *   WEAPONISE  — point the dysfunction at the organisation instead of the work.
 *
 * Stat shapes are shared archetypes so balance is tunable in one place; the
 * names and flavour are per class, because that is where the joke lives.
 */

interface NodeCopy {
  name: string
  flavour: string
}

interface TreeCopy {
  branches: Record<TalentBranch, { name: string; flavour: string }>
  leanIn: [NodeCopy, NodeCopy, NodeCopy]
  growOut: [NodeCopy, NodeCopy, NodeCopy]
  weaponise: [NodeCopy, NodeCopy, NodeCopy]
  /** Capstone grant for each branch, in order. */
  grants: [TalentGrant, TalentGrant, TalentGrant]
}

/** Stat archetypes. Tuning the whole game's talent power happens right here. */
const SHAPES = {
  leanIn: [{ power: 2.2 }, { attackSpeed: 0.07, power: 1.4 }],
  growOut: [{ maxHp: 16, armour: 0.8 }, { regen: 0.7, cooldown: 0.02 }],
  weaponise: [{ towerDamage: 0.035 }, { socialGain: 0.05, towerRange: 0.025 }],
} as const

function branchNodes(
  animal: RoleId,
  branch: TalentBranch,
  copy: [NodeCopy, NodeCopy, NodeCopy],
  shapes: readonly [Partial<Record<string, number>>, Partial<Record<string, number>>],
  grant: TalentGrant,
): TalentNode[] {
  return [
    {
      id: `${animal}_${branch}_1`,
      name: copy[0].name,
      flavour: copy[0].flavour,
      branch,
      tier: 0,
      maxRank: 5,
      stats: shapes[0] as TalentNode['stats'],
    },
    {
      id: `${animal}_${branch}_2`,
      name: copy[1].name,
      flavour: copy[1].flavour,
      branch,
      tier: 1,
      maxRank: 5,
      requires: 3,
      stats: shapes[1] as TalentNode['stats'],
    },
    {
      id: `${animal}_${branch}_3`,
      name: copy[2].name,
      flavour: copy[2].flavour,
      branch,
      tier: 2,
      maxRank: 1,
      requires: 8,
      grants: [grant],
    },
  ]
}

function tree(animal: RoleId, copy: TreeCopy): TalentTree {
  return {
    animal,
    branches: copy.branches,
    nodes: [
      ...branchNodes(animal, 'lean_in', copy.leanIn, SHAPES.leanIn, copy.grants[0]),
      ...branchNodes(animal, 'grow_out', copy.growOut, SHAPES.growOut, copy.grants[1]),
      ...branchNodes(animal, 'weaponise', copy.weaponise, SHAPES.weaponise, copy.grants[2]),
    ],
  }
}

const COPY: Record<RoleId, TreeCopy> = {
  hippo: {
    branches: {
      lean_in: { name: 'Unquestioned', flavour: 'Nobody has said no to you since 2014.' },
      grow_out: { name: 'Actually Reads It', flavour: 'A late-career discovery of evidence.' },
      weaponise: { name: 'Sponsorship', flavour: 'Your name on a project is worth more than the project.' },
    },
    leanIn: [
      { name: 'Because I Said So', flavour: 'The reasoning is that you are the one saying it.' },
      { name: 'Room Command', flavour: 'You speak first and last. The middle is decoration.' },
      { name: 'Nobody Contradicts You', flavour: 'Your attacks strike a second target, who also does not argue.' },
    ],
    growOut: [
      { name: 'Pre-Read', flavour: 'You looked at it on the way in. Genuinely a first.' },
      { name: 'Asks A Question', flavour: 'Not a statement disguised as one. A real question.' },
      { name: 'Delegates Properly', flavour: 'Your towers keep your buff even when you leave the room.' },
    ],
    weaponise: [
      { name: 'Executive Sponsor', flavour: 'The project now cannot be cancelled.' },
      { name: 'Air Cover', flavour: 'You absorb the politics so the work can happen.' },
      { name: 'Kingmaker', flavour: 'Managing a Stakeholder is worth Social Capital. You know people.' },
    ],
    grants: ['cleave', 'remote_management', 'political_capital'],
  },

  zebra: {
    branches: {
      lean_in: { name: 'Louder', flavour: 'Volume is a substitute for validation.' },
      grow_out: { name: 'Cites Sources', flavour: 'Reluctantly, and in a smaller font.' },
      weaponise: { name: 'Narrative', flavour: 'The story beats the spreadsheet every time.' },
    },
    leanIn: [
      { name: 'No Caveats', flavour: 'You removed the word "approximately" and nobody noticed.' },
      { name: 'Round Numbers', flavour: '"About 40%." It is 11%.' },
      { name: 'Say It Twice', flavour: 'Your attacks hit a second target. Repetition is evidence.' },
    ],
    growOut: [
      { name: 'Footnote', flavour: 'A single, tiny, technically-present source.' },
      { name: 'Peer Review', flavour: 'Someone checked. Some of it held up.' },
      { name: 'Actually Rigorous', flavour: 'Cooldowns refund on a kill. The work compounds now.' },
    ],
    weaponise: [
      { name: 'Compelling Slide', flavour: 'One chart. No axis labels. Devastating.' },
      { name: 'Board Narrative', flavour: 'It is in the pack now. It is true now.' },
      { name: 'Unfalsifiable', flavour: 'Drops come up a rarity tier. You have a story about why.' },
    ],
    grants: ['cleave', 'momentum', 'magpie'],
  },

  wolf: {
    branches: {
      lean_in: { name: 'Always On', flavour: 'The phone is face-up. It is Sunday.' },
      grow_out: { name: 'Root Cause', flavour: 'A radical idea: fix why it keeps happening.' },
      weaponise: { name: 'Incident Command', flavour: 'You are extremely good at this and it is a problem.' },
    },
    leanIn: [
      { name: 'First Responder', flavour: 'You saw it before the alert did.' },
      { name: 'Adrenaline', flavour: 'You have never felt better than at 23:00 during an outage.' },
      { name: 'Two At Once', flavour: 'Your attacks hit a second fire. There is always a second fire.' },
    ],
    growOut: [
      { name: 'Post-Incident Review', flavour: 'Blameless, thorough, and quietly ignored.' },
      { name: 'Runbook', flavour: 'Written at 03:00. Genuinely useful.' },
      { name: 'Sustainable Pace', flavour: 'You get up faster when you go down. You have practised.' },
    ],
    weaponise: [
      { name: 'Escalation Path', flavour: 'You know exactly who to wake and when.' },
      { name: 'War Room', flavour: 'A room, a screen, and everyone who matters.' },
      { name: 'Crisis Currency', flavour: 'Managing a Stakeholder pays. Chaos made you visible.' },
    ],
    grants: ['cleave', 'resilient', 'political_capital'],
  },

  rhino: {
    branches: {
      lean_in: { name: 'Even Later', flavour: 'Arrive last. Arrive enormous.' },
      grow_out: { name: 'Shows Up', flavour: 'Turns out being present is most of it.' },
      weaponise: { name: 'Institutional Weight', flavour: 'You are load-bearing and everyone knows it.' },
    },
    leanIn: [
      { name: 'Momentum', flavour: 'Slow to start. Impossible to stop.' },
      { name: 'Full Weight', flavour: 'When you finally engage, the furniture moves.' },
      { name: 'Wide Berth', flavour: 'Your attacks catch a second target standing too close.' },
    ],
    growOut: [
      { name: 'Calendar Hygiene', flavour: 'You declined three meetings and the world continued.' },
      { name: 'Actually Attends', flavour: 'Camera on. Contributing. Alarming.' },
      { name: 'Too Big To Fail', flavour: 'Downed timer halved. They need you back.' },
    ],
    weaponise: [
      { name: 'The Budget Holder', flavour: 'Nothing happens without your line.' },
      { name: 'Immovable', flavour: 'You said no in January and it is still no.' },
      { name: 'Remote Oversight', flavour: 'Your towers keep your buff while you are elsewhere. As usual.' },
    ],
    grants: ['cleave', 'resilient', 'remote_management'],
  },

  seagull: {
    branches: {
      lean_in: { name: 'Higher, Faster', flavour: 'More sites, less time at each.' },
      grow_out: { name: 'Stays For Q&A', flavour: 'Astonishing scenes.' },
      weaponise: { name: 'The Visit', flavour: 'Your arrival reorganises a department.' },
    },
    leanIn: [
      { name: 'Tailwind', flavour: 'You are already at the next thing.' },
      { name: 'Drive-By', flavour: 'A comment, delivered at speed, that ruins a quarter.' },
      { name: 'Both Sides', flavour: 'Your attacks hit a second person on the way past.' },
    ],
    growOut: [
      { name: 'Sits Down', flavour: 'Physically. In a chair. For a whole hour.' },
      { name: 'Follows Up', flavour: 'An email that arrives when it said it would.' },
      { name: 'Bounces Back', flavour: 'Downed timer halved. You were barely here anyway.' },
    ],
    weaponise: [
      { name: 'Site Visit', flavour: 'Everyone tidied for a week beforehand.' },
      { name: 'The Anecdote', flavour: 'A story from another region that becomes policy here.' },
      { name: 'Rainmaker', flavour: 'Managing a Stakeholder pays. You know the whole board socially.' },
    ],
    grants: ['cleave', 'resilient', 'political_capital'],
  },

  goose: {
    branches: {
      lean_in: { name: 'More Optimistic', flavour: 'It is a one-day job now.' },
      grow_out: { name: 'Learns To Estimate', flavour: 'Three-point estimation. Reluctantly.' },
      weaponise: { name: 'Velocity Theatre', flavour: 'The burndown chart looks incredible.' },
    },
    leanIn: [
      { name: 'Aggressive Timeline', flavour: 'Committed in the room, regretted in the corridor.' },
      { name: 'Just Ship It', flavour: 'Testing is a phase we can compress.' },
      { name: 'Parallel Workstreams', flavour: 'Your attacks hit a second thing. Simultaneously. Allegedly.' },
    ],
    growOut: [
      { name: 'Contingency', flavour: 'You added a buffer and did not tell anyone. Correct.' },
      { name: 'Historical Data', flavour: 'Looked at how long it took last time. Revelatory.' },
      { name: 'Recovers Schedule', flavour: 'Kills refund cooldown. You are making up the time.' },
    ],
    weaponise: [
      { name: 'Green Status', flavour: 'The project is green. The project has always been green.' },
      { name: 'Story Points', flavour: 'A number that means nothing, defended fiercely.' },
      { name: 'Lucky Sprint', flavour: 'Drops come up a rarity tier. Something finally went right.' },
    ],
    grants: ['cleave', 'momentum', 'magpie'],
  },

  puffin: {
    branches: {
      lean_in: { name: 'More Features', flavour: 'The backlog is a promise, not a problem.' },
      grow_out: { name: 'Asks Why', flavour: 'Terrifying for everyone involved.' },
      weaponise: { name: 'The Platform', flavour: 'Everything you build makes the next thing easier.' },
    },
    leanIn: [
      { name: 'Backlog Depth', flavour: 'Four hundred items. Twelve will ship. All are groomed.' },
      { name: 'Fast Follow', flavour: 'The fix for the thing you shipped yesterday.' },
      { name: 'Bundled Release', flavour: 'Your attacks hit a second target. It was in the same release.' },
    ],
    growOut: [
      { name: 'Discovery', flavour: 'You spoke to a user. One. It changed everything.' },
      { name: 'Kill Criteria', flavour: 'A written definition of when to stop. Unprecedented.' },
      { name: 'Sustainable Roadmap', flavour: 'Kills refund cooldown. You are building on something.' },
    ],
    weaponise: [
      { name: 'Reusable Component', flavour: 'Built once, used everywhere, credited to nobody.' },
      { name: 'Self-Serve', flavour: 'They can do it themselves now. You are free.' },
      { name: 'Runs Without You', flavour: 'Your towers keep your buff while you are away. As designed.' },
    ],
    grants: ['cleave', 'momentum', 'remote_management'],
  },

  puma: {
    branches: {
      lean_in: { name: 'Trust The Gut', flavour: 'Wider swings, bigger numbers.' },
      grow_out: { name: 'Checks The Gut', flavour: 'Against something. Anything.' },
      weaponise: { name: 'Conviction', flavour: 'Belief, applied to other people, becomes strategy.' },
    },
    leanIn: [
      { name: 'Bold Call', flavour: 'Made in eleven seconds. Defended for eleven months.' },
      { name: 'Instinct', flavour: 'You cannot show your working because there is none.' },
      { name: 'Double Down', flavour: 'Your attacks hit a second target. In for a penny.' },
    ],
    growOut: [
      { name: 'Sense Check', flavour: 'You asked one person. They said "hmm".' },
      { name: 'Small Bets', flavour: 'Test it cheaply first. Genuinely mature.' },
      { name: 'Hedged', flavour: 'Downed timer halved. You had a plan B this time.' },
    ],
    weaponise: [
      { name: 'Infectious Confidence', flavour: 'The team believes because you do.' },
      { name: 'Vision', flavour: 'Unfalsifiable, motivating, and occasionally correct.' },
      { name: 'Lucky Streak', flavour: 'Drops come up a rarity tier. You are on a run.' },
    ],
    grants: ['cleave', 'resilient', 'magpie'],
  },

  cobra: {
    branches: {
      lean_in: { name: 'More Certain', flavour: 'The pattern matched. Stop talking.' },
      grow_out: { name: 'Considers Disconfirming Evidence', flavour: 'Physically uncomfortable.' },
      weaponise: { name: 'Authority', flavour: 'Certainty, deployed at the right moment, is power.' },
    },
    leanIn: [
      { name: 'Seen It Before', flavour: 'In 2016. It was not the same. It is never the same.' },
      { name: 'Snap To Pattern', flavour: 'Diagnosis in four seconds. Occasionally right.' },
      { name: 'Two Assertions', flavour: 'Your attacks hit a second target. You had a view on them too.' },
    ],
    growOut: [
      { name: 'Steel Man', flavour: 'You argued the other side out loud and hated it.' },
      { name: 'Updates Priors', flavour: 'Visibly. In a meeting. People noticed.' },
      { name: 'Learns Fast', flavour: 'Kills refund cooldown. Each one taught you something real.' },
    ],
    weaponise: [
      { name: 'The Precedent', flavour: 'Cited from memory. Nobody will check.' },
      { name: 'Settles It', flavour: 'The discussion ends because you ended it.' },
      { name: 'Always Watching', flavour: 'You permanently see what is hidden. You always suspected.' },
    ],
    grants: ['cleave', 'momentum', 'always_watching'],
  },

  yak: {
    branches: {
      lean_in: { name: 'More Metrics', flavour: 'A KPI for the KPIs.' },
      grow_out: { name: 'One Number', flavour: 'Picks the metric that matters. Deletes the rest.' },
      weaponise: { name: 'Visibility', flavour: 'What is measured gets funded.' },
    },
    leanIn: [
      { name: 'Leading Indicator', flavour: 'Predicts the lagging indicator, which predicts nothing.' },
      { name: 'Weekly Cadence', flavour: 'Reported every Monday to a distribution list of ninety.' },
      { name: 'Cross-Tab', flavour: 'Your attacks hit a second target, broken down by region.' },
    ],
    growOut: [
      { name: 'North Star', flavour: 'One metric. The team can actually recite it.' },
      { name: 'Deletes A Dashboard', flavour: 'Nobody complained. Nobody had opened it.' },
      { name: 'Signal Over Noise', flavour: 'Kills refund cooldown. You measured the right thing.' },
    ],
    weaponise: [
      { name: 'On The Board Pack', flavour: 'Your number is in the pack. Your number is now real.' },
      { name: 'Budget Justification', flavour: 'The chart got the headcount.' },
      { name: 'Political Capital', flavour: 'Managing a Stakeholder pays. You had the data on them.' },
    ],
    grants: ['cleave', 'momentum', 'political_capital'],
  },

  donkey: {
    branches: {
      lean_in: { name: 'More Rows', flavour: 'Faster, smaller, endless.' },
      grow_out: { name: 'Adds Context', flavour: 'A sentence explaining what the number means.' },
      weaponise: { name: 'The Source Of Truth', flavour: 'Everyone comes to you because only you can find it.' },
    },
    leanIn: [
      { name: 'Bulk Export', flavour: 'Two hundred thousand rows, attached, unfiltered.' },
      { name: 'Refresh Rate', flavour: 'The report now runs hourly. Nobody reads it hourly.' },
      { name: 'Two Tabs', flavour: 'Your attacks hit a second target. They are on the other sheet.' },
    ],
    growOut: [
      { name: 'Executive Summary', flavour: 'Three bullets at the top. Transformational.' },
      { name: 'So What', flavour: 'You wrote down why it matters. Everyone was shocked.' },
      { name: 'Trusted', flavour: 'Kills refund cooldown. People act on your numbers now.' },
    ],
    weaponise: [
      { name: 'Single Source', flavour: 'All other versions are declared wrong. By you.' },
      { name: 'Query Access', flavour: 'You can see everything. This is never taken away.' },
      { name: 'Sees Everything', flavour: 'You permanently reveal what is hidden. It was in the data.' },
    ],
    grants: ['cleave', 'momentum', 'always_watching'],
  },

  mouse: {
    branches: {
      lean_in: { name: 'Even Vaguer', flavour: 'A position so soft it cannot be quoted.' },
      grow_out: { name: 'Takes A View', flavour: 'Out loud. On the record. Once.' },
      weaponise: { name: 'Consensus Broker', flavour: 'Having no position lets you carry everyone else’s.' },
    },
    leanIn: [
      { name: 'Both Sides Have Merit', flavour: 'Deployed for the ninth consecutive meeting.' },
      { name: 'Let Us Park That', flavour: 'The car park is full. Nothing has ever left it.' },
      { name: 'Copies In Everyone', flavour: 'Your attacks hit a second target, who was cc-ed.' },
    ],
    growOut: [
      { name: 'On The Record', flavour: 'You said the thing. In writing. With your name on it.' },
      { name: 'Owns It', flavour: 'The word "I" instead of "we". Enormous.' },
      { name: 'Hard To Pin Down', flavour: 'Downed timer halved. Nobody could find you to finish the job.' },
    ],
    weaponise: [
      { name: 'Trusted By Both', flavour: 'Neither side thinks you are on the other side.' },
      { name: 'Quiet Word', flavour: 'The corridor, not the room. This is where it happens.' },
      { name: 'Everybody Owes You', flavour: 'Managing a Stakeholder pays. You never made an enemy.' },
    ],
    grants: ['cleave', 'resilient', 'political_capital'],
  },

  viper: {
    branches: {
      lean_in: { name: 'Longer Memory', flavour: 'The document goes back further than anyone realises.' },
      grow_out: { name: 'Lets It Go', flavour: 'One item. From 2019. A start.' },
      weaponise: { name: 'Leverage', flavour: 'You never spend it. You just let people know you have it.' },
    },
    leanIn: [
      { name: 'The Document', flavour: 'Dates, times, attendees, and one line of verbatim quote.' },
      { name: 'Waits', flavour: 'Six months, if that is what it takes. It usually is.' },
      { name: 'Two Birds', flavour: 'Your attacks hit a second target. They were both in that meeting.' },
    ],
    growOut: [
      { name: 'Deletes One Email', flavour: 'Physically difficult. You did it anyway.' },
      { name: 'Assumes Good Faith', flavour: 'For the first time, and only provisionally.' },
      { name: 'Survives It', flavour: 'Downed timer halved. You have been through worse and kept notes.' },
    ],
    weaponise: [
      { name: 'Knows Where It Is Buried', flavour: 'And roughly what it cost.' },
      { name: 'The Quiet Threat', flavour: 'Never stated. Perfectly understood.' },
      { name: 'Sees Everything', flavour: 'You permanently reveal what is hidden. You were always looking.' },
    ],
    grants: ['cleave', 'resilient', 'always_watching'],
  },

  dodo: {
    branches: {
      lean_in: { name: 'Even Older', flavour: 'The old way, but more so.' },
      grow_out: { name: 'Attends Training', flavour: 'Sat at the back. Took notes on paper. Learned something.' },
      weaponise: { name: 'Corporate Memory', flavour: 'You are the only one who knows why the rule exists.' },
    },
    leanIn: [
      { name: 'Tried And Tested', flavour: 'It worked in 2009 and 2009 was fine.' },
      { name: 'Wet Signature', flavour: 'Printed, signed, scanned, emailed, printed again.' },
      { name: 'Carbon Copy', flavour: 'Your attacks hit a second target. Literally, with carbon paper.' },
    ],
    growOut: [
      { name: 'Learns The New System', flavour: 'Badly, slowly, and genuinely.' },
      { name: 'Stops Saying At My Old Company', flavour: 'Mid-sentence. Visible effort.' },
      { name: 'Adapts', flavour: 'Kills refund cooldown. You are getting the hang of this.' },
    ],
    weaponise: [
      { name: 'Knows Why The Rule Exists', flavour: 'There was an incident. There is always an incident.' },
      { name: 'The Only One Left', flavour: 'Everyone who built this has gone. You remain.' },
      { name: 'Irreplaceable', flavour: 'Your towers keep your buff while you are away. Nobody else can run them.' },
    ],
    grants: ['cleave', 'momentum', 'remote_management'],
  },
}

export const TALENT_TREES: Record<RoleId, TalentTree> = Object.fromEntries(
  (Object.keys(COPY) as RoleId[]).map((animal) => [animal, tree(animal, COPY[animal])]),
) as Record<RoleId, TalentTree>

export function getTalentNode(role: RoleId, id: string): TalentNode | undefined {
  return TALENT_TREES[role]?.nodes.find((n) => n.id === id)
}

export const BRANCH_ORDER: TalentBranch[] = ['lean_in', 'grow_out', 'weaponise']
