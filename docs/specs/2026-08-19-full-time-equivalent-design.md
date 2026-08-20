# FULL-TIME EQUIVALENT — Design Bible
*a people operations tower defence*

**Status:** approved 2026-08-19 · **Slice:** Floor 3 — Shared Services
**Revision 5 (2026-08-20):** legibility pass — pixel icons on every resource and
defence, a skippable self-guided tutorial, and every lock in the game made to
explain itself.
**Revision 4 (2026-08-19):** art direction moved from "Fluorescent Rot" to
"LUMON" — cold, institutional, retro-corporate — with a distinct palette per
level; the floor rebuilt as a cubicle farm; right-click headcount menu.
**Revision 3 (2026-08-19):** headcount replaces abstract tower slots — every
process needs an owner, automated ones need fewer, approval is a three-wave queue
and removal costs in every currency.
**Revision 2 (2026-08-19):** classes replaced by the fourteen corporate animals;
OTTTD-style deployed heroes; Diablo-style levels, talents and affixed loot;
Stakeholders added as an enemy tier that attacks towers rather than the door.

---

## 0. Thesis

> 51% of HR working hours are spent on administrative tasks that could be automated.
> 94% of HR managers feel overwhelmed. 97% report emotional fatigue.
> Open enrollment spikes ticket volume 5–10× for a few weeks.
> A strong Tier 0 reduces ticket volume. Failures come back as escalations.

The industry wrote the tower defence. We just have to render it.

**You do not place people. You place processes.** Every tower is a piece of HR
infrastructure — a knowledge base article, an approval workflow, a ticketing
system, a chatbot named Ava that nobody trusts. The players are the humans, and
the humans are the bottleneck. The entire arc of a run is automating yourself
out of the 51% before the 51% eats you.

**The joke has to be load-bearing.** A gag that isn't also a mechanic gets cut.
"Ava the Chatbot occasionally misroutes a ticket and *heals* it" is funny AND is
a real risk/reward tower. "HRBP loses a random ability each wave because someone
booked them into a meeting" is funny AND is the class's defining constraint.
That is the bar.

---

## 1. Board

Top-down ¾ office floor. **16×16 px tiles** (true Stardew scale), logical canvas
**640×384** (40×24 tiles), displayed at integer scale 2–3× with nearest-neighbour.

Three lanes enter from the left and converge on a single door on the right:

| Lane | Name | Flavour |
|---|---|---|
| 0 | **Payroll & Systems** | top route, past the printer that has been "being fixed" since March |
| 1 | **Employee Services** | middle route, straight through the open plan |
| 2 | **Talent & Mobility** | bottom route, past the wellness room nobody has ever booked |

They converge at **THE ESCALATION** — a door labelled `CHRO`. Anything reaching
it drains Morale.

Towers are placed on non-path floor tiles. Desks, plants, the broken printer and
the ping-pong table nobody uses are obstacles.

---

## 2. Resources

| Resource | Source | Sink |
|---|---|---|
| 💛 **Social Capital** | Resolution *quality* only — within-SLA resolves, first-contact resolves, Tier-0 deflections. **Never** raw volume. | The tech tree. You cannot buy a ticketing system with money. You buy it with credibility. |
| 💵 **Budget** | Per-wave trickle + fiscal-year spike | Building and upgrading towers |
| ❤️ **Morale** | Starts 100 | Drained by anything reaching the CHRO door. 0 = your team resigns. Run over. |
| ⚖️ **Compliance** | Starts 100 | Drained *only* by ignored Employee Relations cases and certain elites. 0 = **Audit**. Instant loss, separate fail state, cannot be tanked. |

### The Steering Committee
Between waves the game enters a `steering` phase. You spend Social Capital in
front of a pixel CFO holding a coffee cup. If you're short, he says
*"Let's revisit this next quarter."* and the node stays locked.

**Design rule:** Social Capital income scales with how *well* you play, not how
long you survive. A player who brute-forces with human towers survives waves but
never unlocks tech, and dies at Open Enrollment. This is the intended lesson.

---

## 3. Requests (enemies)

Damage is dealt through **channels**. Every request has a resistance multiplier
per channel. This replaces "armour types".

| Channel | Sources |
|---|---|
| `automation` | Tier-0 towers, chatbot, RPA, portals |
| `process` | Ticketing, workflows, routing, policy |
| `human` | Player abilities, staffed desks |
| `specialist` | Role-locked damage (Payroll, Travel & Claims, ER) |

### Roster

| Request | Res: auto / process / human / spec | Behaviour |
|---|---|---|
| **Leave Balance Query** | 1.0 / 1.0 / 1.0 / 1.0 | Trivial, swarms in 20–40. Dies to anything. If you have no Tier 0, the swarm alone ends runs. |
| **Policy Question** | **0.15** / 1.0 / 1.0 / 1.0 | Immune-ish to bots. Needs a human or a rewritten policy. Killing it *permanently* is a tech upgrade, not a shot. |
| **Payroll Discrepancy** | 0.4 / 0.7 / 0.6 / **2.0 (Payroll)** | Fast, heavy morale damage, carries a **cutoff clock**. If the clock expires it doesn't breach — it **splits into two**. |
| **Expense Claim** | **0.0** / 0.3 / 0.2 / **2.5 (Travel & Claims)** | Slow, armoured, **splits into sub-claims on damage** (receipts). Immune to all automation. |
| **Employee Relations Case** | **0.0** / **0.0** / 0.5 / **3.0 (ER)** | **Stealth** — invisible to every tower. Only a player with `seesStealth` can reveal it. Drains Compliance, not Morale. Grows each wave ignored. |
| **Onboarding Packet** | 0.6 / 1.2 / 1.0 / 1.0 | Chunky, slow, spawns in clusters. Spawned *by your own* Talent Acquisition player. |
| **Benefits Enrollment** | 0.8 / 1.0 / 0.9 / 1.0 | The open-enrollment staple. Harmless alone, arrives in the hundreds. |

### Escalation (transformation, not a spawn)
Every request carries an **SLA timer**. When it expires the request does not die
and does not breach — it becomes **ESCALATED**: red aura, ×1.9 speed, ×2.2 morale
damage, and it now ignores lane geometry and beelines for the CHRO door.

*Your failures come back as a stronger enemy.* That is the whole job.

### Named elites (from the forums, verbatim energy)
- **Batman** — refuses to write his real name on the I-9. Immune to `process`
  (the ticketing system has no field for this). Claims he legally changed it. He did not.
- **The Cat-Sitter Claim** — an Expense Claim that splits into *three*.
- **Lost In The Beauty Of The Day** — a tardiness appeal that argues theologically.
  Heals when hit by `automation`.
- **The Mustang** — "rental denied, uses more gas than a compact." Reflects damage.
- **Facebook Friend Parity Complaint** — demands your coworker friend everyone
  or no one. Links itself to a nearby request; damage is shared.
- **Emotional Support Squirrel** — an accommodation request. Stealth. Fast. Erratic pathing.

---

## 4. Towers (processes & technology)

| Tower | Ch. | Cost | Gag that is also a mechanic |
|---|---|---|---|
| **Intranet Page Nobody Reads** | auto | 25 | Damage **1**. Enormous range. It is technically a defence. Free starter. |
| **FAQ Article** | auto | 60 | Solid Tier-0 chip vs trivial swarm. |
| **Employee Self-Service Portal** | auto | 140 | Deletes Leave Balance Queries outright. Does nothing to anything else. |
| **Ava (Chatbot)** | auto | 120 | Fast, **random** target. 8% of shots *misroute* and heal the target. |
| **Ticketing System** | process | 200 | Applies `TRACKED`: −25% speed, +30% damage taken from all sources. **The keystone.** |
| **Approval Workflow** | process | 160 | Radius stun — things sit in someone's queue. Cannot kill. |
| **Auto-Triage & Routing** | process | 240 | Pushes requests sideways into the lane whose specialist can actually hit them. |
| **RPA Bot** | auto | 300 | Highest automation DPS. **Fully disabled during the Maintenance Window.** |
| **Finance Integration** | process | 280 | The only *tower* that can chip Expense Claims. Weakly. |
| **Manager Enablement** | process | 220 | Reduces spawn count at the source. Prevention, not cure — invisible and unglamorous, like the real thing. |
| **Policy Rewrite (Plain English)** | process | 260 | Deletes a % of Policy Questions **at spawn**, before they exist. |

Every tower has 2 upgrade levels costing Budget **and** Social Capital.

---

## 5. Tech tree (Social Capital)

Four branches. Nodes unlock towers, upgrade tiers, and passives.

```
TIER 0 (Deflection)     Intranet → FAQ → Knowledge Base → Self-Service → Ava → AI Agent
TIER 1 (Case Mgmt)      Shared Inbox → Ticketing System → Case Management → Auto-Triage
INTEGRATION             SSO → HRIS↔Finance → Master Data → RPA
CULTURE                 Town Hall → Manager Enablement → Plain-English Policy → "Just Say No"
```

Passives worth calling out:
- **Knowledge Base** — +1 Social Capital per Tier-0 deflection.
- **Case Management** — Escalated requests can be *de-escalated* back to normal.
- **Master Data** — removes the 10% chance any given resolve is voided by a data error.
- **"Just Say No"** — 5% of all incoming requests never spawn. The single most
  powerful node in the game. Requires the most Social Capital. It is, correctly,
  the hardest thing in HR to get permission to do.

---

## 6. Classes — the fourteen dangerous animals

You do not play a heroic people function. **You play one of the animals.**

Every class's passive is its documented dysfunction, and in every case the
dysfunction is simultaneously the strongest thing about the class and the reason
it costs you something. This is the hard rule for adding a class: *if the passive
only ever helps, it is a bonus, not a dysfunction, and it does not belong here.*

| Animal | Backronym | Passive — and what it costs |
|---|---|---|
| **HIPPO** | Highest Paid Person's Opinion | Damage **ignores all resistances** — evidence was never the point. Gains **55% less Social Capital**. |
| **ZEBRA** | Zero Evidence But Really Arrogant | **×2 damage at full health, ×0.5 once damaged.** Nobody re-reads your slide. |
| **WOLF** | Works On Latest Fire | **+110%** vs the three newest arrivals, **−35%** vs everything older. You do not do backlog. |
| **RHINO** | Really Here In Name Only | **Zero damage for the first 18 seconds** of a wave, then **+170%**. |
| **SEAGULL** | Senior Executive Amuses, Glides, Unloads Loudly & Leaves | Fastest class alive. **Stand still 2s and you teleport at random.** Cannot hold ground. |
| **GOOSE** | Guessing Overly Scheduling Estimates | Cooldowns **45% shorter**; every ability has a **30% chance to simply not happen**. |
| **PUFFIN** | Plans Unending Feature Factory Initiatives | **+2 capacity, towers 25% cheaper.** Every tower you build **spawns an Onboarding Packet**. |
| **PUMA** | Promotes Unusually Mendacious Assumptions | Every hit rolls **×0.25 to ×2.5**. Every single one. |
| **COBRA** | Cognitive Bias Related Assertions | **+22% per prior kill of that type this wave** (cap +200%), reset each wave. Blind to anything new. |
| **YAK** | Yet Another KPI | Generates Social Capital passively. Towers within 6 tiles deal **22% less**. |
| **DONKEY** | Data Only, No Knowledge, Expertise Or Why | **Triple attack speed, one third damage.** Volume is the strategy. |
| **MOUSE** | Shifts position, avoiding firm decisions | Takes **55% less**, deals **35% less**, and requests **ignore you entirely**. |
| **VIPER** | Vindictive Person Endangering Results | **+7% permanently** per request type that has ever breached. You need the team to fail. |
| **DODO** | Dangerously Outdated Opinions | **+140% damage.** Cooldown reduction does nothing for you and your towers can never be upgraded. |

Duplicates are allowed and carry an "unclear ownership" penalty.

### The hero layer (OTTTD)

Heroes are deployed units, not cursors. They have HP, reach, a swing timer and
four abilities; they take damage from anything they stand next to; they can be
**downed** (12s, halved by the Resilient talent) and revived far faster by a
colleague standing over them.

**One lever governs the whole pillar:** `HERO_OUTPUT_SCALE` in `sim/heroes.ts`.
Heroes matter, but processes must still out-damage people over a full run — a
balance test asserts it. If a new class breaks that, turn the lever down rather
than nerfing fourteen stat blocks.

All hero damage — auto-attacks and abilities alike — flows through a single
`strike()` function so passives, specialist multipliers, legendary hooks and kill
credit can never drift apart between the two sources.

**XP is shared across the team, including kills the towers made.** The
alternative punishes exactly the play the rest of the game teaches.

## 6b. Progression (Diablo)

Two clocks run at once:

- **Run clock** — hero levels 1–30, one talent point each, reset every campaign.
  A full campaign takes a competent squad to roughly level 20.
- **Profile clock** — account level, per-animal levels, and a 20-item stash,
  persisted server-side as JSON against a `localStorage` id. No accounts.

### Talents
Three branches per class, three nodes each. Levelling to 30 gives 29 points;
maxing everything costs 33 — **the build is a choice**. The branches always mean
the same three things, which is what makes fourteen trees learnable:

- **LEAN IN** — double down on the dysfunction. Highest ceiling, worst habits.
- **GROW OUT** — mitigate it. You become a functional adult. Less spectacular.
- **WEAPONISE** — point the dysfunction at the organisation instead of the work.

### Artifacts
Five slots — badge, device, document, beverage, furniture. Five rarities, named
in performance-review language: Standard Issue → Approved → Business Critical →
Board Visible → Career Defining. Affixes roll from per-slot pools and scale with
item level, which scales with wave.

Five legendaries, each bending exactly one rule: *The Shadow Spreadsheet*,
*The Escalation Inbox*, *Pre-Approved Business Case*, *Garden Leave Letter*,
*The Chairman's Ear*.

Elites and Stakeholders drop; trash does not, or the floor becomes unreadable.

## 6c. Stakeholders — the enemy mirror

The same fourteen animals, as enemies. They do **not** race you to the CHRO door.
They walk to your **towers** and interfere with them, which forces a different
verb out of the player: you cannot out-build a Stakeholder, you have to physically
go and deal with it. This is what makes the hero layer load-bearing rather than
decorative.

| Interference | Effect | Who does it |
|---|---|---|
| `override` | Nearby towers deal 40% less | HiPPO, The Certain (COBRA) |
| `disable` | Sits on a tower; it is offline until they leave | The Absent Approver (RHINO) |
| `destroy` | **Permanently** removes a tower | The Grudge (VIPER) |
| `downgrade` | Reverts a tower one upgrade level | The Confident One (ZEBRA), The Old Guard (DODO) |
| `generate` | Spawns extra requests on a timer | The Firefighter (WOLF), The Feature Factory (PUFFIN) |
| `drain_budget` / `drain_social` | Steals resources | The Gut Feel (PUMA), The Metrics Owner (YAK) |
| `shrink` | Halves nearby tower range | The Estimator (GOOSE), The Data Requester (DONKEY) |
| `rally` | Heals and extends the SLA of nearby requests | The Deferrer (MOUSE) |
| `unload` | One huge burst of Morale damage, then leaves | The Visiting Executive (SEAGULL) |

Managing one pays Social Capital and rolls for a drop.

## 6d. Headcount — the real constraint

Towers do not occupy abstract "slots". They consume **people**.

| Tower channel | FTE to own |
|---|---|
| `automation` | **1** |
| `process` | **2** |

That one table is the automation argument, expressed as a budget line instead of
a lecture. Fourteen approved FTE buys you fourteen automated processes or seven
manual ones, and the player works that out without being told. Tightening the
establishment measurably *raises* the share of work the towers do, because it
pushes you off manual process towers — which is the mechanic arguing its own case.

Every approved head costs **4 Budget per wave, forever**, charged on the
*establishment* rather than on usage — you pay for the head whether or not a
process is attached to it.

**Going over headcount does not delete a tower.** It marks it `unstaffed`: the
process still exists, there is simply nobody to run it, so it sits idle. Oldest
towers keep their cover; the newest go dark first.

### Getting approval — a queue, not a purchase

Raising a requisition costs **Social Capital** (making the case) and **Budget**
(recruitment and kit). It then enters a three-stage pipeline, one wave per stage:

1. **Drafting the case** — there is a template. The template is from 2018.
2. **With Finance** — Finance has questions about the assumptions.
3. **With the CFO** — it is item eleven. They got to item seven.

So a req raised now lands about three waves late, which is roughly when you no
longer need it and exactly when you get it.

**The catch-22 is the mechanic.** At the CFO stage, if run SLA is below **72%**,
the req is *deferred once* — *"before we add people, show me you can run what you
have."* You cannot hire your way out of a process problem, which is the game
pointing at the tech tree. Withdrawing a req refunds most of the Budget and none
of the credibility. Three reqs in the system at once is the cap; Finance will not
look at a fourth.

### Removing headcount — three routes, all of them cost

| Route | Budget | Morale | Social | Consultation | Claim risk |
|---|---|---|---|---|---|
| **Do Not Backfill** | — | — | — | 45s | — |
| **Voluntary Redundancy** | 140 | 5 | 4 | 12s | 5% |
| **Compulsory Redundancy** | 45 | 14 | 12 | 40s, draining 0.22 Morale/s | **45%** |

The head is committed the moment the process starts — cover is lost immediately,
while you keep paying the salary until the consultation ends. Compulsory is the
cheapest in money and the most expensive in everything else, and its claim risk
spawns a real **Employee Relations case** onto the board, which drains Compliance
and is invisible to every tower. The cheap option is not the cheap option.

You cannot make the last person redundant.

## 7. Waves

8 waves + boss in the slice. Full game: 20 + 5 bosses.

| # | Name | Teaches |
|---|---|---|
| 1 | *Monday* | Trivial swarm. Tier 0 exists. |
| 2 | *"Quick Question"* | Policy Questions ignore your bot. |
| 3 | *Payday Minus Two* | Cutoff clocks. Splitting. |
| 4 | *The Receipts* | Expense Claims. Automation does literally nothing. |
| 5 | *Something Happened At The Offsite* | First ER case. Stealth. Compliance bar moves for the first time. |
| 6 | *Reorg Rumours* | Mixed lanes, first Escalations. |
| 7 | *Batman* | Named elite. Process-immune. |
| 8 | *Systems Maintenance* | Automation disabled mid-wave. Human/specialist only. |
| **BOSS** | **OPEN ENROLLMENT** | 5–10× volume, as documented. Everything at once. Survive 3 minutes. |

Later bosses (designed, not in slice): **Annual Merit Cycle**, **Restructuring**,
**The Engagement Survey** (damage scales inversely with your run's SLA compliance —
the survey is literally about how badly you've been doing), **Return-To-Office
Mandate** (spawns from *every* edge simultaneously).

---

## 8. Art direction — "LUMON"

Cold, institutional, retro-corporate. Pale green-white corridor lino under hard
fluorescent light, dark navy carpet in the working areas, CRT cyan for anything a
screen would emit, and exactly one warm colour — manila — because paper is the
only thing in this building that was ever alive.

| Token | Hex | Note |
|---|---|---|
| `void` | `#0a0e13` | letterbox, near-black but blue |
| `carpet` | `#1c2835` | navy office carpet |
| `carpetLight` | `#243346` | worn patch |
| `wall` | `#c9d1c8` | corridor lino — the *lit* surface |
| `wallLight` | `#e0e5da` | under a tube directly |
| `tubeGlow` | `#6fd3c4` | CRT cyan |
| `manila` | `#c3a86c` | folders, desks, the one warm thing |
| `paper` | `#eceadf` | not white. never white. |
| `highlighter` | `#e8d84a` | **danger only** |
| `escalate` | `#b8433c` | escalation red |

Rules, enforced by taste, code review and a test:
- never pure white, never pure black — everything is slightly institutional
- never a saturated green: that reads "healthy", and nothing here is healthy
- `highlighter` is reserved **exclusively** for things about to hurt you
- **corridors are pale and the floor is dark.** Inverting that reads as a home,
  not an office, and the whole point is that this is not a home.

### One wing per level

Each level is a different wing of the building, and each wing was decorated by a
different committee in a different decade. `THEMES` in `content/palette.ts`
carries a **partial** override per level — anything a theme does not name falls
back to the base palette, so adding a wing is six lines, not forty.

| Level | Wing | Signage |
|---|---|---|
| 1 | SHARED SERVICES | *The work is mysterious and important.* |
| 2 | POLICY & GOVERNANCE | *Please refer to the policy before contacting the policy owner.* |
| 3 | PAYROLL | *The cutoff is the cutoff.* |
| 4 | MOBILITY & EXPENSES | *Receipts must be legible and in the original currency.* |
| 5 | EMPLOYEE RELATIONS | *This conversation is being minuted.* |
| 6 | ORGANISATIONAL DESIGN | *The boxes have no names in them yet.* |
| 7 | ONBOARDING | *Welcome. Your access will be ready by Thursday.* |
| 8 | PEOPLE SYSTEMS | *Scheduled maintenance is a Tuesday afternoon activity.* |
| 9 | THE BOARD FLOOR | *The Board is present and will not be addressed directly.* |

Role colours are deliberately **excluded** from theming: a player must be able to
find their own animal on the floor regardless of which wing they are standing in.

Textures are baked, so a level change throws away the static layers and redraws
them rather than trying to recolour thousands of sprites in place.

### The floor is a cubicle farm

Seventeen cubicles — partitions on two sides, a desk with a CRT, and a chair that
has been adjusted in none of its four available directions — plus a photocopier
with a sign taped to it, a fridge containing a labelled lunch from before the
reorganisation, a vending machine whose row E is stuck, a shredder that has never
jammed, a comms cabinet nobody will switch off, pigeonholes holding post for
three leavers, and a wall clock that is two minutes fast on purpose.

**The `blocks` flag is the important part.** Solid furniture takes a tile out of
play; cubicle partitions and wall fittings deliberately do not. A cubicle farm
that halves your buildable area is set dressing that costs you the game. Tests
assert that no prop sits on a lane, no two props share a tile, and the decorative
props outnumber the solid ones.

## 8b. Legibility

Three rules, because a game whose whole subject is opaque bureaucracy has to be
the opposite of opaque itself.

**Every number has an icon and a sentence.** The five scoreboard resources carry
a 9×9 pixel icon and a hover explanation of what drains it and what it costs you.
`RESOURCE_INFO` in `ui/TopBar.tsx` is the single place that text lives.

**Every defence says what it is for.** `TowerDef.contributes` is data: a list of
outcomes from `CONTRIBUTIONS` — deflects, resolves, buys time, makes everything
else hit harder, stops it happening, protects the clock, touches Expense Claims,
sees hidden work. Each renders as an icon coloured by the resource it protects
plus a plain-English label on the build card. A player never has to infer what
they are buying from a damage number.

**Every lock answers two questions in one line:** why can I not have this, and
what precisely do I do about it.

- *Locked defence* — the card shows the **whole remaining research chain** and
  its total Social Capital price, not just the next step. "Needs Knowledge Base"
  is useless if Knowledge Base needs three things you also do not have. Clicking
  the card opens the Steering Committee scrolled to that node with the entire
  path highlighted. `pathToTech` in `content/unlocks.ts` does the walk.
- *Locked character* — the card states the exact account level that opens it, the
  level you are, and where account XP comes from. `unlockLevelFor` is shared with
  the server, so the advertised level is provably the one that unlocks.

### The tutorial

Twelve steps in `content/tutorial.ts` — data, so the copy can be rewritten
without touching React. Steps that can be learned by doing carry a `doneWhen`
trigger and advance themselves the moment the player does the thing; nobody
should have to click Next to acknowledge that they have just built a tower.
Skip is always one click away and remembered in `localStorage`; `?` brings it
back and dismisses whatever panel is on top first.

## 9. Architecture

```
packages/shared/   pure TS. sim + content. no DOM, no Node APIs. deterministic, seeded RNG.
packages/server/   authoritative loop @20Hz, snapshots @10Hz, room codes, 1–5 players.
packages/client/   React shell (HUD, tech tree, character sheet) + PixiJS canvas.
```

Progression lives in `shared/src/progression.ts` (XP, stats, talents, loot rolls)
and `shared/src/types-progression.ts`. Content for the new systems is in
`content/roles.ts`, `content/talents.ts`, `content/artifacts.ts` and
`content/stakeholders.ts`. Sprites for the animals are composed from head plates
plus a shared body in `client/src/render/animals.ts`.

**The contract:** `step(state, intents, dt) → state` is pure. The server is the
only writer. Clients send *intents* (`move`, `build`, `ability`, `unlock`), never
state. The sim runs headless in Vitest — **we can prove the game works without a
browser.**

Content lives in flat data files under `packages/shared/src/content/`. Adding ten
new request types requires reading zero lines of engine code. This is deliberate:
this repo is meant to be worked on by Claude Code, Codex and Kimi on different
days, and content work must never require holding the engine in context.

---

## 10. Out of scope for the slice

Accounts and matchmaking beyond room codes, mobile, audio, the four
non-Open-Enrollment bosses, ability VFX polish, map 2+, crafting, set bonuses,
and a stash UI between runs (the stash persists but is not yet browsable).
