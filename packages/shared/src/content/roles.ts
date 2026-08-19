import type { AbilityDef, RoleDef, RoleId } from '../types.js'
import { PALETTE } from './palette.js'

/**
 * The fourteen dangerous animals of the corporate world, as playable classes.
 *
 * The premise: you are not a hero of the people function. You are one of the
 * animals. Every class's passive is its documented dysfunction, and in every
 * case the dysfunction is simultaneously the strongest thing about the class and
 * the reason it costs you something. HIPPO ignores evidence and therefore
 * ignores resistances — and earns almost no Social Capital, because being
 * obeyed is not the same as being right.
 *
 * If you add an animal, the passive must cut both ways. A pure upside is not a
 * dysfunction, it is a bonus, and it does not belong here.
 */

function ability(
  key: 'Q' | 'W' | 'E' | 'R',
  id: string,
  name: string,
  flavour: string,
  kind: AbilityDef['kind'],
  extra: Partial<AbilityDef> = {},
): AbilityDef {
  return { id, name, flavour, key, kind, cooldownSeconds: 14, ...extra }
}

export const ROLES: Record<RoleId, RoleDef> = {
  // ─────────────────────────────────────────────────────────────────── HIPPO
  hippo: {
    id: 'hippo',
    name: 'HIPPO',
    expansion: "Highest Paid Person's Opinion",
    title: 'Overpowers discussions using seniority, not evidence',
    flavour: 'Has not read the deck. Has views on the deck. The views will prevail.',
    dysfunction: 'Wins arguments by rank. Being obeyed is not the same as being right.',
    passive: 'seniority',
    passiveName: 'Seniority',
    passiveText:
      'Your damage ignores all resistances — evidence was never the point. You gain 55% less Social Capital.',
    base: { power: 15, reach: 2.2, attackSpeed: 0.9, maxHp: 150, moveSpeed: 4.6, armour: 3 },
    growth: { power: 1.08, maxHp: 14, armour: 0.4 },
    specialistPower: 2.0,
    specialistTargets: ['er_case', 'support_squirrel'],
    seesStealth: true,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 15,
    colour: PALETTE.tubeGreen,
    sprite: 'pc_hippo',
    abilities: [
      ability('Q', 'overrule', 'Overrule', 'Resolves one request outright. No discussion. Costs Compliance.', 'purge_tag', {
        cooldownSeconds: 18,
        amount: 1,
      }),
      ability('W', 'weigh_in', 'Weigh In', 'Nearby towers borrow your damage for eight seconds, which they did not ask for.', 'buff_towers', {
        cooldownSeconds: 20,
        radius: 7,
        durationSeconds: 8,
        amount: 0.7,
      }),
      ability('E', 'presence', 'Executive Presence', 'Everything nearby slows down and looks busy.', 'slow_lane', {
        cooldownSeconds: 16,
        radius: 6,
        durationSeconds: 6,
        amount: 0.55,
      }),
      ability('R', 'final_say', 'Final Say', 'Clears a lane. The decision is made. It was always made.', 'percent_damage', {
        cooldownSeconds: 110,
        damage: 0.85,
        radius: 99,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── ZEBRA
  zebra: {
    id: 'zebra',
    name: 'ZEBRA',
    expansion: 'Zero Evidence But Really Arrogant',
    title: 'Boldly replaces validated data with loud confidence',
    flavour: 'Says "the data clearly shows" about data that does not exist and has never existed.',
    dysfunction: 'Devastating on first contact, useless once anyone checks the work.',
    passive: 'confidently_wrong',
    passiveName: 'Confidently Wrong',
    passiveText:
      'Double damage to anything at full health. Half damage to anything already damaged. Nobody re-reads your slide.',
    base: { power: 13, reach: 4.5, attackSpeed: 1.1, maxHp: 95, moveSpeed: 5.4 },
    growth: { power: 0.99, maxHp: 8, reach: 0.03 },
    specialistPower: 1.8,
    specialistTargets: ['benefits_enrollment', 'facebook_parity'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 13,
    colour: PALETTE.paper,
    sprite: 'pc_zebra',
    abilities: [
      ability('Q', 'bold_claim', 'Bold Claim', 'Enormous damage. One time in five it is simply wrong and heals them.', 'gamble', {
        cooldownSeconds: 11,
        damage: 190,
        radius: 5,
      }),
      ability('W', 'anecdata', 'Anecdata', 'A single story, told loudly, outperforms the dashboard for six seconds.', 'buff_towers', {
        cooldownSeconds: 19,
        radius: 6,
        durationSeconds: 6,
        amount: 0.5,
      }),
      ability('E', 'stand_firm', 'Stand Firm', 'You are not going to be moved on this. Brief invulnerability.', 'shield', {
        cooldownSeconds: 22,
        durationSeconds: 3.5,
        amount: 160,
      }),
      ability('R', 'the_deck', 'The Deck', 'Forty-one slides. Board-wide damage, scaled by how many towers back you up.', 'percent_damage', {
        cooldownSeconds: 120,
        damage: 0.4,
        radius: 99,
      }),
    ],
  },

  // ──────────────────────────────────────────────────────────────────── WOLF
  wolf: {
    id: 'wolf',
    name: 'WOLF',
    expansion: 'Works On Latest Fire',
    title: 'Chases new issues reactively, neglects long-term strategy',
    flavour: 'Genuinely excellent in a crisis. Has arranged for there to always be a crisis.',
    dysfunction: 'Unmatched against whatever just arrived. Nearly useless against the backlog.',
    passive: 'firefighter',
    passiveName: 'Latest Fire',
    passiveText:
      '+110% damage to the three most recently spawned requests. -35% to everything older. You do not do backlog.',
    base: { power: 16, reach: 2.0, attackSpeed: 1.5, maxHp: 120, moveSpeed: 6.4 },
    growth: { power: 1.17, maxHp: 10, moveSpeed: 0.04 },
    specialistPower: 2.2,
    specialistTargets: ['payroll_discrepancy'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 16,
    colour: PALETTE.wallLight,
    sprite: 'pc_wolf',
    abilities: [
      ability('Q', 'pounce', 'Pounce', 'Dash to the newest thing on the board and hit it. You were already moving.', 'dash', {
        cooldownSeconds: 8,
        damage: 95,
        radius: 14,
      }),
      ability('W', 'triage', 'Triage By Volume', 'Attack speed scales with how bad it currently is.', 'shield', {
        cooldownSeconds: 20,
        durationSeconds: 8,
        amount: 40,
      }),
      ability('E', 'drop_everything', 'Drop Everything', 'Every cooldown resets. You take damage. Worth it, probably.', 'reset_cooldowns', {
        cooldownSeconds: 45,
        damage: 30,
      }),
      ability('R', 'all_hands', 'All Hands', 'Three people who were doing something important are now doing this.', 'summon_intern', {
        cooldownSeconds: 100,
        durationSeconds: 22,
        amount: 3,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── RHINO
  rhino: {
    id: 'rhino',
    name: 'RHINO',
    expansion: 'Really Here In Name Only',
    title: 'Massive but slow to engage, absent in contribution',
    flavour: 'On the org chart. On the invite list. Not, in any meaningful sense, here.',
    dysfunction: 'Contributes nothing for the first eighteen seconds of every wave, then flattens the room.',
    passive: 'absent',
    passiveName: 'In Name Only',
    passiveText:
      'You deal no damage for the first 18 seconds of a wave. After that, +170% for the rest of it.',
    base: { power: 20, reach: 1.8, attackSpeed: 0.7, maxHp: 240, moveSpeed: 3.9, armour: 9 },
    growth: { power: 1.44, maxHp: 22, armour: 0.9 },
    specialistPower: 2.6,
    specialistTargets: ['expense_claim', 'cat_sitter', 'the_mustang'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 20,
    colour: PALETTE.ashMauve,
    sprite: 'pc_rhino',
    abilities: [
      ability('Q', 'charge', 'Charge', 'A straight line. Nothing survives the straight line.', 'dash', {
        cooldownSeconds: 12,
        damage: 130,
        radius: 10,
      }),
      ability('W', 'thick_skin', 'Thick Skin', 'Feedback has been received and filed.', 'shield', {
        cooldownSeconds: 21,
        durationSeconds: 7,
        amount: 260,
      }),
      ability('E', 'show_up', 'Show Up', 'Appear at a tower. It works twice as hard now that you are watching.', 'buff_towers', {
        cooldownSeconds: 17,
        radius: 6,
        durationSeconds: 9,
        amount: 0.8,
      }),
      ability('R', 'finally_engaged', 'Finally Engaged', 'You have read the thread. All of it. Everyone is about to hear about it.', 'cone', {
        cooldownSeconds: 105,
        damage: 420,
        radius: 9,
      }),
    ],
  },

  // ───────────────────────────────────────────────────────────────── SEAGULL
  seagull: {
    id: 'seagull',
    name: 'SEAGULL',
    expansion: 'Senior Executive Amuses, Glides, Unloads Loudly & Leaves',
    title: 'Drops opinions loudly, then leaves before execution',
    flavour: 'Flies in. Makes noise. Redecorates. Departs. Is not there on Monday.',
    dysfunction: 'Cannot stay anywhere. Standing still teleports you somewhere else entirely.',
    passive: 'fly_by',
    passiveName: 'Glides',
    passiveText:
      'Fastest class in the game. Stand still for 2 seconds and you are relocated at random. You cannot hold ground.',
    base: { power: 14, reach: 3.4, attackSpeed: 1.3, maxHp: 85, moveSpeed: 8.2 },
    growth: { power: 1.03, maxHp: 7, moveSpeed: 0.06 },
    specialistPower: 1.5,
    specialistTargets: ['policy_question'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 14,
    colour: PALETTE.screenGlow,
    sprite: 'pc_seagull',
    abilities: [
      ability('Q', 'swoop', 'Swoop', 'Straight through the middle of whatever was being discussed.', 'dash', {
        cooldownSeconds: 7,
        damage: 85,
        radius: 12,
      }),
      ability('W', 'unload', 'Unload', 'Everything you think, at volume, in one place. Then you are gone.', 'cone', {
        cooldownSeconds: 16,
        damage: 260,
        radius: 6,
      }),
      ability('E', 'amuse', 'Amuse', 'A funny story from a conference. Everything stops to listen.', 'slow_lane', {
        cooldownSeconds: 15,
        radius: 7,
        durationSeconds: 5,
        amount: 0.85,
      }),
      ability('R', 'glide', 'Glide', 'Untargetable, enormous speed, damage to everything you pass through.', 'shield', {
        cooldownSeconds: 95,
        durationSeconds: 8,
        amount: 999,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── GOOSE
  goose: {
    id: 'goose',
    name: 'GOOSE',
    expansion: 'Guessing Overly Scheduling Estimates',
    title: 'Minimizes effort of tasks, overschedules without real basis',
    flavour: '"That\'s a two-day job." It has never once been a two-day job.',
    dysfunction: 'Half the cooldowns of anyone else, and one time in three the ability simply slips.',
    passive: 'optimistic_estimate',
    passiveName: 'Optimistic Estimate',
    passiveText:
      'All your cooldowns are 45% shorter. Every ability has a 30% chance to slip and not fire at all.',
    base: { power: 12, reach: 3.2, attackSpeed: 1.2, maxHp: 100, moveSpeed: 5.6 },
    growth: { power: 0.9, maxHp: 9 },
    specialistPower: 1.7,
    specialistTargets: ['onboarding_packet'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 12,
    colour: PALETTE.deckBlue,
    sprite: 'pc_goose',
    abilities: [
      ability('Q', 'sprint_commit', 'Sprint Commitment', 'Confidently sized. Delivered, sometimes.', 'single_target', {
        cooldownSeconds: 9,
        damage: 120,
        radius: 6,
      }),
      ability('W', 'rebaseline', 'Re-baseline', 'The date has not slipped. The date has moved. Resets a cooldown.', 'reset_cooldowns', {
        cooldownSeconds: 26,
      }),
      ability('E', 'padding', 'Padding', 'You added 30% contingency and told nobody. A shield.', 'shield', {
        cooldownSeconds: 18,
        durationSeconds: 6,
        amount: 130,
      }),
      ability('R', 'big_bang', 'Big Bang Release', 'Everything, at once, in ten seconds. Assuming it does not slip.', 'delayed_nuke', {
        cooldownSeconds: 90,
        damage: 700,
        durationSeconds: 10,
        radius: 99,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────────── PUFFIN
  puffin: {
    id: 'puffin',
    name: 'PUFFIN',
    expansion: 'Plans Unending Feature Factory Initiatives',
    title: 'Ships endless tasks without considering actual value',
    flavour: 'The roadmap has forty-one items. Nobody has asked what any of them are for.',
    dysfunction: 'Builds constantly and for free. Everything you build generates more work.',
    passive: 'feature_factory',
    passiveName: 'Feature Factory',
    passiveText:
      '+2 tower capacity, and towers cost you 25% less. Every tower you build spawns an Onboarding Packet.',
    base: { power: 10, reach: 3.0, attackSpeed: 1.1, maxHp: 105, moveSpeed: 5.2, towerDamage: 0.1 },
    growth: { power: 0.77, maxHp: 9, towerDamage: 0.012 },
    specialistPower: 1.6,
    specialistTargets: ['onboarding_packet'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 10,
    colour: PALETTE.manila,
    sprite: 'pc_puffin',
    abilities: [
      ability('Q', 'ship_it', 'Ship It', 'A tower appears. Nobody signed off on it. It is live.', 'build_free', {
        cooldownSeconds: 20,
        amount: 1,
      }),
      ability('W', 'scope_creep', 'Scope Creep', 'Nearby towers reach much further and hit much softer.', 'buff_towers', {
        cooldownSeconds: 17,
        radius: 7,
        durationSeconds: 10,
        amount: 0.3,
      }),
      ability('E', 'roadmap', 'Roadmap', 'Three items are now committed. They take 60% more from everything.', 'mark', {
        cooldownSeconds: 14,
        radius: 7,
        durationSeconds: 8,
        amount: 0.6,
      }),
      ability('R', 'initiative', 'Initiative', 'Three free towers. Three new problems. This is the job.', 'build_free', {
        cooldownSeconds: 100,
        amount: 3,
      }),
    ],
  },

  // ──────────────────────────────────────────────────────────────────── PUMA
  puma: {
    id: 'puma',
    name: 'PUMA',
    expansion: 'Promotes Unusually Mendacious Assumptions',
    title: 'Makes impulsive decisions based on gut feel, not insight',
    flavour: 'Has a feeling about this. The feeling has never been audited.',
    dysfunction: 'Every single hit rolls between a quarter and two and a half times damage.',
    passive: 'gut_feel',
    passiveName: 'Gut Feel',
    passiveText: 'All your damage is multiplied by a random 0.25x to 2.5x. No, you cannot see the roll first.',
    base: { power: 18, reach: 2.6, attackSpeed: 1.2, maxHp: 110, moveSpeed: 6.0 },
    growth: { power: 1.35, maxHp: 10 },
    specialistPower: 1.9,
    specialistTargets: ['benefits_enrollment'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 18,
    colour: PALETTE.escalate,
    sprite: 'pc_puma',
    abilities: [
      ability('Q', 'hunch', 'Hunch', 'You just know. You are right about 40% of the time.', 'gamble', {
        cooldownSeconds: 9,
        damage: 150,
        radius: 5,
      }),
      ability('W', 'reframe', 'Reframe', 'It is not a problem, it is an opportunity. Downgrades a request.', 'mark', {
        cooldownSeconds: 16,
        radius: 6,
        durationSeconds: 7,
        amount: 0.5,
      }),
      ability('E', 'momentum', 'Momentum', 'Things are going well, so more things will go well. Attack speed.', 'shield', {
        cooldownSeconds: 19,
        durationSeconds: 7,
        amount: 60,
      }),
      ability('R', 'bet_the_quarter', 'Bet The Quarter', 'Enormous damage, or ten Morale. You will find out together.', 'gamble', {
        cooldownSeconds: 95,
        damage: 620,
        radius: 99,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── COBRA
  cobra: {
    id: 'cobra',
    name: 'COBRA',
    expansion: 'Cognitive Bias Related Assertions',
    title: 'Snaps out biased assertions that overlook deeper truths',
    flavour: 'Pattern-matched your situation to one they saw in 2016 and stopped listening there.',
    dysfunction: 'Lethal against anything it has seen before. Blind to anything new.',
    passive: 'confirmation_bias',
    passiveName: 'Confirmation Bias',
    passiveText:
      '+22% damage against a request type for each one you have already killed this wave, stacking to +200%. Resets every wave.',
    base: { power: 13, reach: 2.4, attackSpeed: 1.4, maxHp: 100, moveSpeed: 5.8 },
    growth: { power: 0.95, maxHp: 9 },
    specialistPower: 1.8,
    specialistTargets: ['policy_question'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 13,
    colour: PALETTE.compliance,
    sprite: 'pc_cobra',
    abilities: [
      ability('Q', 'snap_judgement', 'Snap Judgement', 'Instant. Confident. Occasionally correct.', 'single_target', {
        cooldownSeconds: 8,
        damage: 110,
        radius: 4,
      }),
      ability('W', 'anchoring', 'Anchoring', 'The first number said out loud. Target takes escalating damage.', 'dot', {
        cooldownSeconds: 15,
        damage: 24,
        radius: 5,
        durationSeconds: 8,
      }),
      ability('E', 'venom', 'Venom', 'A remark in a meeting that people are still thinking about on Thursday.', 'dot', {
        cooldownSeconds: 17,
        damage: 18,
        radius: 6,
        durationSeconds: 10,
      }),
      ability('R', 'assertion', 'Assertion', 'Whatever there is most of, you are certain about. Massive damage to that type.', 'percent_damage', {
        cooldownSeconds: 100,
        damage: 0.6,
        radius: 99,
      }),
    ],
  },

  // ───────────────────────────────────────────────────────────────────── YAK
  yak: {
    id: 'yak',
    name: 'YAK',
    expansion: 'Yet Another KPI',
    title: 'Overloads teams with KPIs, creating activity without direction',
    flavour: 'Has added a metric to measure the effectiveness of the other metrics.',
    dysfunction: 'Generates credibility continuously. Everything near you is too busy reporting to work.',
    passive: 'metrics',
    passiveName: 'Yet Another KPI',
    passiveText:
      'You passively generate Social Capital every few seconds. Towers within 6 tiles of you deal 22% less damage.',
    base: { power: 11, reach: 3.6, attackSpeed: 1.0, maxHp: 105, moveSpeed: 5.0, socialGain: 0.25 },
    growth: { power: 0.81, maxHp: 9, socialGain: 0.02 },
    specialistPower: 1.7,
    specialistTargets: ['payroll_discrepancy'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 11,
    colour: PALETTE.manilaDark,
    sprite: 'pc_yak',
    abilities: [
      ability('Q', 'new_metric', 'New Metric', 'Marked. Killing it pays double credibility, because it is now measured.', 'mark', {
        cooldownSeconds: 12,
        radius: 7,
        durationSeconds: 10,
        amount: 0.35,
      }),
      ability('W', 'dashboard', 'Dashboard', 'Everything is visible. Nothing is clearer. Reveals the board.', 'reveal', {
        cooldownSeconds: 22,
        radius: 22,
        durationSeconds: 10,
      }),
      ability('E', 'target_setting', 'Target Setting', 'A stretch goal. Everything slows down trying to hit it.', 'slow_lane', {
        cooldownSeconds: 16,
        radius: 7,
        durationSeconds: 7,
        amount: 0.45,
      }),
      ability('R', 'quarterly_review', 'Quarterly Review', 'Everything on the board loses a fixed share of its health. Nobody enjoys this.', 'percent_damage', {
        cooldownSeconds: 90,
        damage: 0.3,
        radius: 99,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────────── DONKEY
  donkey: {
    id: 'donkey',
    name: 'DONKEY',
    expansion: 'Data Only, No Knowledge, Expertise Or Why',
    title: 'Carries data but lacks context, insight, or business judgment',
    flavour: 'Can tell you the number to four decimal places. Cannot tell you whether it matters.',
    dysfunction: 'Enormous volume of tiny hits. Individually meaningless, collectively a problem.',
    passive: 'volume_over_insight',
    passiveName: 'Volume Over Insight',
    passiveText:
      'Triple attack speed, one third damage per hit. You do not stop and you do not think.',
    base: { power: 7, reach: 3.8, attackSpeed: 3.2, maxHp: 115, moveSpeed: 5.0 },
    growth: { power: 0.5, maxHp: 10, attackSpeed: 0.04 },
    specialistPower: 1.7,
    specialistTargets: ['payroll_discrepancy', 'benefits_enrollment'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 7,
    colour: PALETTE.lanyardTeal,
    sprite: 'pc_donkey',
    abilities: [
      ability('Q', 'export', 'Export', 'Everything in a line receives a copy of the file.', 'line_damage', {
        cooldownSeconds: 9,
        damage: 90,
        radius: 9,
      }),
      ability('W', 'pivot_table', 'Pivot Table', 'The same data, rearranged, at speed.', 'shield', {
        cooldownSeconds: 18,
        durationSeconds: 8,
        amount: 50,
      }),
      ability('E', 'correlation', 'Correlation', 'These two things are related. They are not related. Damage is shared.', 'mark', {
        cooldownSeconds: 15,
        radius: 7,
        durationSeconds: 9,
        amount: 0.45,
      }),
      ability('R', 'full_extract', 'The Full Extract', 'Every row. All of them. For eight seconds.', 'channel_nuke', {
        cooldownSeconds: 100,
        channelSeconds: 8,
        damage: 640,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── MOUSE
  mouse: {
    id: 'mouse',
    name: 'MOUSE',
    expansion: 'Shifts position frequently, avoiding firm decisions',
    title: 'Avoids committing to anything that could later be quoted back',
    flavour: 'Agrees with the last person who spoke and will agree with the next one too.',
    dysfunction: 'Extremely hard to kill and does very little. Excellent at postponing.',
    passive: 'non_committal',
    passiveName: 'Non-Committal',
    passiveText: 'You take 55% less damage and deal 35% less. Nothing sticks to you, including outcomes.',
    base: { power: 9, reach: 2.8, attackSpeed: 1.3, maxHp: 170, moveSpeed: 6.6, armour: 5 },
    growth: { power: 0.63, maxHp: 16, armour: 0.6 },
    specialistPower: 2.3,
    specialistTargets: ['expense_claim', 'cat_sitter'],
    seesStealth: false,
    ignoredByRequests: true,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 9,
    colour: PALETTE.paperShadow,
    sprite: 'pc_mouse',
    abilities: [
      ability('Q', 'defer', 'Defer', 'Pushed back down the corridor. Not solved. Later.', 'push_back', {
        cooldownSeconds: 10,
        radius: 6,
        amount: 6,
      }),
      ability('W', 'escalate_elsewhere', 'Not My Team', 'Moves a request into somebody else\'s lane. Genuinely somebody else\'s.', 'lane_shift', {
        cooldownSeconds: 14,
        radius: 6,
      }),
      ability('E', 'hedge', 'Hedge', 'A position that cannot be wrong because it is not a position.', 'shield', {
        cooldownSeconds: 16,
        durationSeconds: 7,
        amount: 200,
      }),
      ability('R', 'committee', 'Refer To Committee', 'Everything on the board goes back to the beginning. It will return.', 'push_back', {
        cooldownSeconds: 85,
        radius: 99,
        amount: 22,
      }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────── VIPER
  viper: {
    id: 'viper',
    name: 'VIPER',
    expansion: 'Vindictive Person Endangering Results',
    title: 'Will damage the outcome to win the argument',
    flavour: 'Remembers. Has a document. The document has dates.',
    dysfunction: 'Grows permanently stronger every time the team fails. Needs the team to fail.',
    passive: 'grudge',
    passiveName: 'Grudge',
    passiveText:
      'Permanently +7% damage against every request type that has ever breached, stacking all run. You are getting stronger because things are going badly.',
    base: { power: 14, reach: 2.6, attackSpeed: 1.25, maxHp: 105, moveSpeed: 5.9 },
    growth: { power: 1.03, maxHp: 9 },
    specialistPower: 2.4,
    specialistTargets: ['er_case', 'support_squirrel'],
    seesStealth: true,
    ignoredByRequests: false,
    refusesBuffs: true,
    losesAbilityEachWave: false,
    contactDamage: 14,
    colour: PALETTE.escalateDark,
    sprite: 'pc_viper',
    abilities: [
      ability('Q', 'strike', 'Strike', 'Waited for the right meeting. This is the right meeting.', 'single_target', {
        cooldownSeconds: 9,
        damage: 145,
        radius: 5,
      }),
      ability('W', 'undermine', 'Undermine', 'Target takes 50% more from every source. From everyone. Quietly.', 'mark', {
        cooldownSeconds: 15,
        radius: 7,
        durationSeconds: 9,
        amount: 0.5,
      }),
      ability('E', 'whisper', 'Whisper Campaign', 'Reveals what is hidden and poisons it on the way past.', 'dot', {
        cooldownSeconds: 18,
        damage: 20,
        radius: 8,
        durationSeconds: 9,
      }),
      ability('R', 'retaliation', 'Retaliation', 'Damage equal to everything this team has lost so far. You kept a total.', 'percent_damage', {
        cooldownSeconds: 105,
        damage: 0.5,
        radius: 99,
      }),
    ],
  },

  // ──────────────────────────────────────────────────────────────────── DODO
  dodo: {
    id: 'dodo',
    name: 'DODO',
    expansion: 'Dangerously Outdated Opinions',
    title: 'Applies 2009 solutions to 2026 problems, with total conviction',
    flavour: 'Wants to know why we cannot just do it the way we did it at the old place.',
    dysfunction: 'Enormous raw output, completely unable to benefit from anything modern.',
    passive: 'obsolete',
    passiveName: 'The Way We Have Always Done It',
    passiveText:
      '+140% damage. You gain nothing from cooldown reduction, and towers you build can never be upgraded.',
    base: { power: 22, reach: 2.2, attackSpeed: 0.85, maxHp: 135, moveSpeed: 4.4, armour: 4 },
    growth: { power: 1.62, maxHp: 12, armour: 0.4 },
    specialistPower: 1.9,
    specialistTargets: ['policy_question', 'batman'],
    seesStealth: false,
    ignoredByRequests: false,
    refusesBuffs: false,
    losesAbilityEachWave: false,
    contactDamage: 22,
    colour: PALETTE.deckBlueDark,
    sprite: 'pc_dodo',
    abilities: [
      ability('Q', 'precedent', 'Precedent', 'We tried this in 2011. Repeats your previous ability at 65%.', 'single_target', {
        cooldownSeconds: 10,
        damage: 130,
        radius: 5,
      }),
      ability('W', 'paper_form', 'The Paper Form', 'Slow. Physical. Devastating. Requires a wet signature.', 'single_target', {
        cooldownSeconds: 17,
        damage: 320,
        radius: 3,
      }),
      ability('E', 'filing_cabinet', 'Filing Cabinet', 'Physically blocks a corridor. Nobody can move it. Nobody will try.', 'wall', {
        cooldownSeconds: 22,
        durationSeconds: 7,
      }),
      ability('R', 'restructure', 'Restructure', 'Everything goes back to the start and we do it properly this time.', 'push_back', {
        cooldownSeconds: 110,
        radius: 99,
        amount: 30,
      }),
    ],
  },
}

export const ROLE_IDS = Object.keys(ROLES) as RoleId[]

export function getRole(id: RoleId): RoleDef {
  const def = ROLES[id]
  if (!def) throw new Error(`Unknown role: ${id}`)
  return def
}

/** Four animals are free at the start; the rest unlock through play. */
export const STARTER_ANIMALS: RoleId[] = ['hippo', 'wolf', 'mouse', 'rhino']
