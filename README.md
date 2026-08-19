# FULL-TIME EQUIVALENT

*a people operations tower defence*

> You do not place people. You place processes.

Inbound requests walk your office floor toward a door marked **CHRO**. Everything
that reaches it costs you Morale. Your defences are a knowledge base, a ticketing
system, an approval workflow, an RPA bot, and a chatbot named Ava who misroutes
8% of the time and sends the requester back *healed*.

You buy those defences with **Social Capital**, which is earned only by resolving
things *well* — inside SLA, at first contact, deflected at Tier 0. Never by
resolving more things. A team that brute-forces its way through the early waves
arrives at Open Enrollment with nothing to spend and dies exactly as it deserves.

Up to five players co-op, one per HR function. One of the functions is Travel &
Claims. Somebody has to.

---

## Run it

```bash
npm install && npm run dev
```

Client on **http://localhost:5173**, game server on **ws://localhost:8787**.
Open the client, enter a name, get a 4-letter room code, share it. Up to five.

```bash
npm test        # 96 tests — sim, classes, progression, loot, headcount, art, balance
npm run balance # headless full-campaign report, no browser needed
npm run typecheck
```

## The premise is not made up

Every mechanic is lifted from how HR shared services actually works:

| Game | Reality |
|---|---|
| Tier 0 towers deflect trivia before it becomes a ticket | Self-service deflection is the cheapest possible resolution |
| Social Capital, not money, buys the tech tree | You cannot buy a ticketing system without stakeholder credibility |
| Requests **escalate** at SLA expiry and come back stronger | Escalation is a failure state that generates more work |
| Expense Claims are immune to every automation tower | They are, genuinely, and they split when you touch them |
| ER cases are invisible to every tower and drain a separate bar | Automation cannot see the thing that ends up in litigation |
| Open Enrollment is the boss | Open enrollment spikes volume 5–10× |
| The HRBP loses an ability every wave to a meeting | 51% of HR hours go to admin that could be automated |

Sources are cited in the design bible: [`docs/specs/2026-08-19-full-time-equivalent-design.md`](docs/specs/2026-08-19-full-time-equivalent-design.md).

## You play one of the dangerous animals

Not a hero of the people function — one of the fourteen documented corporate
dysfunctions. **Every class's flaw is its strongest ability and its price.**

| Animal | Passive | What it costs you |
|---|---|---|
| **HIPPO** — Highest Paid Person's Opinion | Damage ignores every resistance | 55% less Social Capital. Being obeyed is not being right. |
| **ZEBRA** — Zero Evidence But Really Arrogant | ×2 damage at full health | ×0.5 once anything is damaged. Nobody re-reads your slide. |
| **WOLF** — Works On Latest Fire | +110% vs the newest arrivals | −35% vs everything older. You do not do backlog. |
| **RHINO** — Really Here In Name Only | +170% damage | Zero output for the first 18 seconds of every wave. |
| **SEAGULL** — Amuses, Glides, Unloads Loudly & Leaves | Fastest class in the game | Stand still for 2 seconds and you teleport at random. |
| **GOOSE** — Guessing Overly Scheduling Estimates | Cooldowns 45% shorter | 30% of abilities simply do not happen. |
| **PUFFIN** — Plans Unending Feature Factory Initiatives | +2 capacity, cheaper towers | Every tower you build spawns more work. |
| **PUMA** — Promotes Unusually Mendacious Assumptions | Can roll ×2.5 | Can also roll ×0.25. Every hit. |
| **COBRA** — Cognitive Bias Related Assertions | +22% per prior kill of that type | Resets each wave. Blind to anything new. |
| **YAK** — Yet Another KPI | Passive Social Capital income | Towers near you deal 22% less. Everyone is reporting. |
| **DONKEY** — Data Only, No Knowledge, Expertise Or Why | Triple attack speed | One third damage. Volume is the whole strategy. |
| **MOUSE** — Avoids firm decisions | Takes 55% less, ignored by requests | Deals 35% less. Nothing sticks to you, including outcomes. |
| **VIPER** — Vindictive Person Endangering Results | Permanently stronger with every breach | You need the team to fail. |
| **DODO** — Dangerously Outdated Opinions | +140% damage | Cooldown reduction does nothing and your towers never upgrade. |

## Heroes on the floor, and levels that stick

Heroes are deployed units, not cursors. They walk the floor, auto-attack, take
damage from anything they stand next to, and can be **downed** — a colleague
standing over you revives you four times faster than waiting.

They also **level**. XP is shared across the team including tower kills, one
talent point per level, three branches per class that always mean the same three
things: **lean in** to the dysfunction, **grow out** of it, or **weaponise** it.
Levelling to 30 gives 29 points and maxing everything costs 33, so the build is a
choice.

Elites and Stakeholders drop **corporate artifacts** — five slots, five rarities
named in performance-review language (*Standard Issue* → *Career Defining*),
random affixes scaled by wave. Five legendaries each bend one rule; *Garden Leave
Letter* means you cannot be downed, only removed from the building.

Account level, per-animal levels and a 20-item stash persist between runs against
a `localStorage` id. No sign-up.

## How it looks

Cold, institutional, retro-corporate — pale green-white corridor lino under hard
fluorescent light, dark navy carpet, CRT cyan for anything a screen emits, and
exactly one warm colour because paper is the only thing here that was ever alive.

**Every level is a different wing of the building**, and each was decorated by a
different committee in a different decade: Shared Services, Policy & Governance,
Payroll, Mobility & Expenses, Employee Relations, Organisational Design,
Onboarding, People Systems, and finally The Board Floor. The department name is
stencilled on the carpet with the wing's motto underneath — *"The work is
mysterious and important."*

The floor itself is a cubicle farm: seventeen cubicles with CRT desks and chairs
adjusted in none of their four available directions, a photocopier with a sign
taped to it, a fridge with a labelled lunch from before the reorganisation, a
vending machine whose row E is stuck, and a wall clock that is two minutes fast
on purpose.

## Headcount, and the cost of losing it

Towers do not occupy slots. They consume **people** — an automated process needs
**1 FTE** to own, a manual one needs **2**. That single table is the entire
argument for automation, and it sits on the build bar rather than in a deck.

Getting a head is a **queue, not a purchase**: Social Capital to make the case,
Budget for recruitment, then three stages — drafting, Finance, the CFO — at one
wave each. A req raised now lands about three waves late.

And there is a catch-22, because there always is: below 72% SLA the CFO defers it
once. *"Before we add people, show me you can run what you have."* You cannot
hire your way out of a process problem.

Losing a head costs in every currency:

| Route | Budget | Morale | Social | Consultation | Claim risk |
|---|---|---|---|---|---|
| **Do Not Backfill** | — | — | — | 45s | — |
| **Voluntary Redundancy** | 140 | 5 | 4 | 12s | 5% |
| **Compulsory Redundancy** | 45 | 14 | 12 | 40s, draining throughout | **45%** |

Compulsory is cheapest in money and most expensive in everything else, and its
claim risk puts a real Employee Relations case on the board — which drains
Compliance and is invisible to every tower you own. The cheap option is not the
cheap option.

Go over headcount and nothing is deleted. The process still exists; there is
simply nobody to run it, so it stands idle.

**Right-click anywhere on the floor** for the headcount menu — and right-click a
process to decommission it, which frees the person running it. Both are on the
same menu because they are the same decision from two directions.

## The Stakeholders

The same fourteen animals, as enemies — and they do not race you to the CHRO
door. They walk to your **towers** and interfere: the HiPPO overrules them, the
Absent Approver sits on one until it goes offline, the Grudge removes one
permanently, the Visiting Executive unloads and leaves. You cannot out-build a
Stakeholder. Someone has to physically go and deal with it, which is the entire
reason the hero layer exists.

## Architecture

```
packages/shared/   pure TS: sim + content. No DOM, no Node APIs. Deterministic.
packages/server/   authoritative loop @20Hz, snapshots @10Hz, room codes.
packages/client/   React shell (HUD, tech tree, roster) + PixiJS canvas.
```

`step(state, intents, dt) → state` is pure and seeded. The server is the only
writer; clients send **intents**, never state. The whole game runs headless in
Vitest, which is why `npm run balance` can play a full campaign in 600ms.

All art is **procedural pixel art defined in code** — see
[`packages/client/src/render/pixels.ts`](packages/client/src/render/pixels.ts).
Sprites are text blocks, so they diff cleanly and any agent can edit them. There
are zero binary assets in this repo.

## Working on it

Read **[AGENTS.md](AGENTS.md)** first — it is the contract for humans and agents
alike, and covers where to add content without touching the engine.

## Status

Playable vertical slice: one map, 3 lanes, 13 request types, 11 towers, 17 tech
nodes, **14 animal classes** with talent trees, **14 Stakeholder enemies**,
hero levelling and affixed loot, a headcount establishment with an approval
pipeline and three redundancy routes, profile persistence, 8 waves plus the Open
Enrollment boss, networked co-op for 1–5.

**96 tests**, including a balance regression suite that plays the whole campaign
headless in under a second and fails if processes stop out-damaging people.

Not built yet: audio, maps 2+, the four non-Open-Enrollment bosses, crafting,
set bonuses, and a browsable stash between runs.
