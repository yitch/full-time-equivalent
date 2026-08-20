/**
 * Induction.
 *
 * The self-guided tutorial, framed as onboarding, because that is what it is and
 * because the framing does half the comedy for free.
 *
 * Data, not code, so the copy can be rewritten without touching React. Steps are
 * short on purpose: the player is looking at the board, not at us. Anything that
 * can be learned by doing has `doneWhen` set and advances itself.
 *
 * House style holds here too — no punchlines, just the thing somebody would
 * actually say, placed where it becomes funny.
 */

export type TutorialAnchor = 'centre' | 'board' | 'buildbar' | 'topbar' | 'side'

export type TutorialTrigger =
  /** Advances as soon as the player has any tower standing. */
  | 'built_tower'
  /** Advances when a wave is running. */
  | 'wave_started'
  /** Advances once a wave has been cleared. */
  | 'wave_cleared'
  /** Advances when any tech node has been bought. */
  | 'tech_unlocked'
  /** Advances when the hero has moved. */
  | 'moved'

export interface TutorialStep {
  id: string
  title: string
  /** Two or three sentences. Any longer and it does not get read. */
  body: string
  /** Icon key from the client icon set. */
  icon?: string
  anchor: TutorialAnchor
  doneWhen?: TutorialTrigger
  /** Shown in a smaller, dimmer line under the body. */
  aside?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'day_one',
    title: 'Day One — Induction',
    body: 'Welcome to the People function. You have been issued a laptop and a lanyard; the lanyard has already expired. Inbound requests walk the corridors towards a door marked CHRO, and anything that reaches it costs you Morale. You do not place people to stop them — you place processes.',
    aside: 'You are also on the floor yourself, and you can be hurt. Everything here is skippable; nothing here is optional.',
    icon: 'morale',
    anchor: 'centre',
  },
  {
    id: 'scoreboard',
    title: 'Your objectives for the period',
    body: 'MORALE is your team, drained by work reaching the CHRO. COMPLIANCE is a second, quieter way to lose — only Employee Relations cases touch it, and no tower can see them. BUDGET builds. SOCIAL CAPITAL is credibility, and buys everything that matters. SLA is how much you resolve rather than breach.',
    aside: 'Hover any of them at the top for the full version.',
    icon: 'compliance',
    anchor: 'topbar',
  },
  {
    id: 'build',
    title: 'Your first system',
    body: 'Pick a process from the bar and click a floor tile. The icons on each card say what it contributes — deflecting, resolving, buying time, or stopping work happening at all.',
    aside: 'Start with the Intranet Page Nobody Reads. It does two damage. It is, technically, a defence.',
    icon: 'deflect',
    anchor: 'buildbar',
    doneWhen: 'built_tower',
  },
  {
    id: 'headcount',
    title: 'Every process needs an owner',
    body: 'Towers do not use abstract slots, they use people. An automated process needs 1 FTE to own; a manual one needs 2. That is the whole argument for automation, and it is on the build card rather than in a deck.',
    aside: 'Press H for the establishment: approvals, salary, and the three ways to let someone go.',
    icon: 'headcount',
    anchor: 'buildbar',
  },
  {
    id: 'more_headcount',
    title: 'When you run out of people',
    body: 'You will. There are exactly three ways out, and the panel spells them out fastest first: hire a CONTRACTOR for instant capacity at about triple the price, CLOSE a process by right-clicking it to free its owner, or RAISE A REQUISITION for permanent cheap headcount that takes three waves to arrive.',
    aside: 'The requisition is the right answer and the slow one. The contractor is the wrong answer and the one you will use.',
    icon: 'headcount',
    anchor: 'buildbar',
  },
  {
    id: 'start',
    title: 'The doors open at nine',
    body: 'Press BEGIN. Watch which of your processes actually fire, and which sit there doing nothing because the thing walking past is immune to them.',
    icon: 'wave',
    anchor: 'side',
    doneWhen: 'wave_started',
  },
  {
    id: 'hero',
    title: 'You are on the floor too',
    body: 'WASD to move. Q, F, E and R for your abilities. You auto-attack whatever is in reach, and anything you stand next to hurts you back. Standing in the queue is doing the work, and it costs you.',
    aside: 'Go down and a colleague standing over you gets you back four times faster than waiting.',
    icon: 'human',
    anchor: 'board',
    doneWhen: 'moved',
  },
  {
    id: 'bandwidth',
    title: 'Do you have bandwidth for this?',
    body: 'Every ability is a meeting, a call, or a difficult conversation, and every one of them spends BANDWIDTH. It comes back slowly anywhere on the floor and quickly at the water cooler, the canteen, or the room that is officially for wellness. Those spots are ringed on the carpet.',
    aside: 'Running dry mid-wave and having to walk to the kitchen is the intended experience.',
    icon: 'automation',
    anchor: 'board',
  },
  {
    id: 'drops',
    title: 'Things get left on the floor',
    body: 'Requests drop equipment as they are resolved. Walk over it to pick it up — badges, laptops, documents, mugs, furniture. Press C to equip what you find and to spend the talent points you have been accumulating.',
    aside: 'The good biscuits are a real item and they are a real upgrade.',
    icon: 'expense',
    anchor: 'board',
  },
  {
    id: 'review',
    title: 'Performance review, every wave',
    body: 'At the end of each wave you are guaranteed a level and offered three development opportunities. Pick one. They are all things an organisation would genuinely give you instead of money.',
    aside: 'You also get a talent point every level. They do nothing sitting unspent.',
    icon: 'social',
    anchor: 'centre',
  },
  {
    id: 'intern',
    title: 'You have been assigned an intern',
    body: 'Interns drop like any other equipment and go in their own slot. They follow you around, help at roughly the level you would expect, and can be knocked over — at which point the placement is briefly suspended and then resumes.',
    aside: 'Supervising them is described in your objectives as a development opportunity for you both.',
    icon: 'headcount',
    anchor: 'board',
  },
  {
    id: 'sla',
    title: 'Ignore something and it gets worse',
    body: 'Every request carries an SLA clock. When it runs out the request does not vanish — it ESCALATES: faster, angrier, double damage at the door. Your failures come back as a stronger enemy.',
    aside: 'This is why Social Capital is only paid for in-SLA work. Surviving is not the same as doing well.',
    icon: 'sla',
    anchor: 'board',
  },
  {
    id: 'research',
    title: 'Press TAB for the Steering Committee',
    body: 'Locked defences show the full research chain and its total price on the card. Click a locked card and the tree opens on exactly the node you need, with the whole road highlighted.',
    aside: 'The CFO is holding a coffee and looking at the clock.',
    icon: 'lock',
    anchor: 'buildbar',
    doneWhen: 'tech_unlocked',
  },
  {
    id: 'stakeholders',
    title: 'Some things do not race you to the door',
    body: 'From wave five, Stakeholders arrive — the same corporate animals, as enemies. They walk to your TOWERS and interfere: overruling them, sitting on them, or in one case removing one permanently. You cannot out-build a Stakeholder. Someone has to walk over and deal with it.',
    aside: 'That is what you are for.',
    icon: 'prevent',
    anchor: 'board',
  },
  {
    id: 'done',
    title: 'Probation complete',
    body: 'Nine waves, ending with Open Enrollment at five to ten times normal volume. Automate what you can, keep the SLA up so the CFO signs your requisitions, and do not ignore the quiet cases nobody has filed anything about yet.',
    aside: 'Press ? at any time to run through your induction again.',
    icon: 'tick',
    anchor: 'centre',
  },
]

export const TUTORIAL_VERSION = 3
