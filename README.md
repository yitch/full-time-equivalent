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
npm test        # 36 tests — sim, content integrity, and balance regression
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

## The six roles

| Role | Identity | The catch |
|---|---|---|
| **HRBP** | Best buffs, only class that sees ER cases | Loses a random ability every wave. Someone booked you into a meeting. |
| **Payroll** | Hard-deletes payroll problems | Locked to one problem. The cutoff is the cutoff. |
| **Talent** | Grants tower capacity | Every good thing you do also spawns Onboarding Packets |
| **Total Rewards** | 60-second channelled board-wide nuke | Interrupted if you move. You will be interrupted. |
| **HRIS** | Buffs all automation, repairs towers | Your ultimate ends in a blackout that disables every automation tower |
| **Travel & Claims** | Nobody picks this | Worst stats until wave 6. The **only** counter to Expense Claims, which nothing else in the game can damage. |

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
nodes, 6 roles, 8 waves plus the Open Enrollment boss, networked co-op.

Not built yet: persistence, audio, maps 2+, and the four non-Open-Enrollment
bosses (designed in the bible, not implemented).
