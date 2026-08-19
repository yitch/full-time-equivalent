# Working on Full-Time Equivalent

> This file is a copy of `AGENTS.md` so Claude Code, Codex and Kimi all read the
> same contract. **Edit `AGENTS.md` and copy it here** — do not let them drift.

This repo is worked on by several agents on different days — Claude Code, Codex,
Kimi — plus a human. It is structured so that **adding content never requires
holding the engine in context.** Respect that and everything stays cheap.

Read this file before your first edit. It is short on purpose.

---

## 1. Orient yourself in 90 seconds

```bash
npm install
npm test          # 36 tests. If these pass, the game works.
npm run balance   # plays a full campaign headless and prints a per-wave table
```

`npm run balance` is the fastest way to understand this game without playing it.
It shows morale, compliance, SLA and the tower-vs-player damage split per wave.

The design bible is [`docs/specs/2026-08-19-full-time-equivalent-design.md`](docs/specs/2026-08-19-full-time-equivalent-design.md).
It is the source of truth for intent. If code and bible disagree, the bible is
probably right and the code is a bug — but say so rather than silently picking one.

## 2. The one rule that matters

**Every joke must also be a mechanic.**

A gag that isn't load-bearing gets cut in review. Ava the chatbot is funny
*because* she heals enemies 8% of the time. The HRBP losing an ability to a
meeting is funny *because* it is the class's defining constraint. "Intranet Page
Nobody Reads" deals 2 damage.

If you write a flavour string that could be deleted without changing play, either
attach a mechanic to it or delete it yourself.

**House style for humour:** no punchlines. These are things people genuinely say,
placed where they become funny. If a line reads like a joke, replace it with what
someone actually emailed you.

## 3. Where things live

| I want to… | Edit | Touch the engine? |
|---|---|---|
| Add/tune an inbound request | `packages/shared/src/content/requests.ts` | No |
| Add/tune a tower | `packages/shared/src/content/towers.ts` | No |
| Add a tech node | `packages/shared/src/content/tech.ts` | No |
| Add/tune a role or ability | `packages/shared/src/content/roles.ts` | Only for a new `AbilityKind` |
| Write a wave | `packages/shared/src/content/waves.ts` | No |
| Add speech bubbles / ticker lines | `packages/shared/src/content/barks.ts` | No |
| Change the palette | `packages/shared/src/content/palette.ts` | No |
| Draw a sprite | `packages/client/src/render/pixels.ts` | No |
| Change the map | `packages/shared/src/content/map.ts` | No |
| Change combat rules | `packages/shared/src/sim/combat.ts` | Yes |
| Change the loop / phases | `packages/shared/src/sim/index.ts` | Yes |

**Content files are data.** They contain no logic. Behaviour that data needs is
expressed as a `quirk` string handled in `sim/combat.ts`. Adding a quirk is the
only reason a content change should touch the engine.

## 4. Hard constraints

- **`packages/shared` imports nothing from `node:` and nothing from the DOM.** It
  runs in the browser, in Node, and in Vitest. The only exception is
  `src/tools/`, which is Node-only and never imported by `src/index.ts`.
- **The sim is deterministic.** Never call `Math.random()` or `Date.now()` inside
  `src/sim/`. Use the seeded RNG in `src/rng.ts` and write the advanced state
  back to `state.rngState`. There is a test that will catch you.
- **The server is the only writer.** Clients send `Intent`s. If you find yourself
  mutating `GameState` in `packages/client`, stop — that is how desyncs start.
- **No binary assets.** All art is pixel maps in `pixels.ts`. Sprites are text.
- **No new runtime dependencies** without a note in the PR saying why.

## 5. Sprites

A sprite is a list of equal-length strings plus a character key. `'.'` is
transparent, `'c'` is the instance accent colour, `'C'` its darker tone. Add the
sprite to `SPRITES` at the bottom of `pixels.ts` and point at it from
`REQUEST_LOOK` / `TOWER_LOOK` / `PROP_LOOK` in `sprites.ts`.

Requests are 12×12, players 12×16, towers and props 16×16.

Palette rules, which are the whole art direction:
- never pure white, never pure black
- never a saturated green — that reads "healthy", and nothing here is healthy
- `highlighter` yellow is reserved **exclusively** for things about to hurt you

## 6. Before you open a PR

```bash
npm run typecheck && npm test && npm run balance
```

`npm test` includes a **balance regression suite** that encodes the design
promises: a competent squad must reach Open Enrollment, towers must out-damage
players over a full run, the boss must cost you something, and a passive lobby
must lose.

If a balance test fails after your change, **tune the content until it passes.**
Do not loosen the bounds to make your change fit — those numbers are the design.

## 7. Handing off mid-task

Leave a short note in the PR or commit body: what you changed, what you tried
that didn't work, and what you'd do next. The next agent has none of your context
and reruns nothing for free.
