/**
 * The self-guided tutorial.
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
    id: 'premise',
    title: 'You do not place people. You place processes.',
    body: 'Inbound requests walk the corridors towards a door marked CHRO. Anything that reaches it costs you Morale. Your defences are the systems and processes you put in their way.',
    aside: 'You are also on the floor yourself, and you can be hurt. More on that shortly.',
    icon: 'morale',
    anchor: 'centre',
  },
  {
    id: 'scoreboard',
    title: 'Five numbers, two of which can end the run',
    body: 'MORALE is your team and drops when work reaches the CHRO. COMPLIANCE is a separate way to lose — only Employee Relations cases drain it, and no tower can see them. BUDGET builds things. SOCIAL CAPITAL buys the tech tree. SLA is how much you resolve rather than breach.',
    aside: 'Hover any of them at the top of the screen for the full explanation.',
    icon: 'compliance',
    anchor: 'topbar',
  },
  {
    id: 'build',
    title: 'Put something in their way',
    body: 'Pick a process from the bar at the bottom and click a floor tile to place it. The small icons on each card tell you what it contributes: deflecting, resolving, buying time, or stopping work happening at all.',
    aside: 'Start with the Intranet Page Nobody Reads. It does two damage. It is, technically, a defence.',
    icon: 'deflect',
    anchor: 'buildbar',
    doneWhen: 'built_tower',
  },
  {
    id: 'headcount',
    title: 'Every process needs an owner',
    body: 'Towers do not use abstract slots — they use people. An automated process needs 1 FTE to own; a manual one needs 2. That is the entire argument for automation, and it is on the build card rather than in a deck.',
    aside: 'Press H for the establishment: approvals, salary, and the three ways to let someone go.',
    icon: 'headcount',
    anchor: 'buildbar',
  },
  {
    id: 'start',
    title: 'Open the doors',
    body: 'Press BEGIN. Requests spawn from the left and walk their lane. Watch which of your processes actually fire, and which sit there doing nothing because the thing walking past is immune to them.',
    icon: 'wave',
    anchor: 'side',
    doneWhen: 'wave_started',
  },
  {
    id: 'hero',
    title: 'You are on the floor too',
    body: 'WASD to move. Q, F, E and R for your abilities. You auto-attack whatever is in reach — and anything you stand next to hurts you back. Standing in the queue is doing the work, and it costs you.',
    aside: 'Go down and a colleague standing over you revives you four times faster than waiting it out.',
    icon: 'human',
    anchor: 'board',
    doneWhen: 'moved',
  },
  {
    id: 'sla',
    title: 'Ignore something and it gets worse',
    body: 'Every request carries an SLA clock. When it runs out the request does not vanish — it ESCALATES: faster, angrier, and worth double damage at the door. Your failures come back as a stronger enemy.',
    aside: 'That is also why Social Capital is only paid for in-SLA resolutions. Surviving is not the same as doing well.',
    icon: 'sla',
    anchor: 'board',
  },
  {
    id: 'social',
    title: 'Credibility, not money, buys the good things',
    body: 'Social Capital comes from resolving things WELL — inside SLA, at first contact, deflected at Tier 0 before they became a ticket. It is never paid for volume. It buys the tech tree and it buys headcount.',
    aside: 'Brute-force the early waves and you will arrive at Open Enrollment with nothing to spend.',
    icon: 'social',
    anchor: 'topbar',
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
    aside: 'That is what the hero layer is for.',
    icon: 'prevent',
    anchor: 'board',
  },
  {
    id: 'rightclick',
    title: 'Right-click for the difficult conversations',
    body: 'Right-click anywhere on the floor for the headcount menu, or right-click a process to decommission it and free the person running it. Both are on the same menu because they are the same decision from two directions.',
    aside: 'Compulsory redundancy is the cheapest option in Budget and the most expensive in everything else.',
    icon: 'headcount',
    anchor: 'board',
  },
  {
    id: 'done',
    title: 'That is the job',
    body: 'Nine waves, ending with Open Enrollment at five to ten times normal volume. Automate what you can, keep the SLA up so the CFO signs your requisitions, and do not ignore the quiet cases nobody has filed anything about yet.',
    aside: 'Press ? at any time to run through this again.',
    icon: 'tick',
    anchor: 'centre',
  },
]

export const TUTORIAL_VERSION = 1
