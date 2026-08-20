# Working on Full-Time Equivalent

This repo is worked on by several agents on different days — Claude Code, Codex,
Kimi — plus a human. It is structured so that **adding content never requires
holding the engine in context.** Respect that and everything stays cheap.

Read this file before your first edit. It is short on purpose.

---

## 1. Orient yourself in 90 seconds

```bash
npm install
npm test          # 133 tests. If these pass, the game works.
npm run balance   # plays a full campaign headless and prints a per-wave table
npm run shots     # drives headless Chrome and regenerates the README screenshots
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
| Add/tune an animal class or ability | `packages/shared/src/content/roles.ts` | Only for a new `AbilityKind` |
| Add/tune a talent tree | `packages/shared/src/content/talents.ts` | No |
| Add an artifact base, affix or legendary | `packages/shared/src/content/artifacts.ts` | Only for a new `LegendaryPower` |
| Add/tune a Stakeholder | `packages/shared/src/content/stakeholders.ts` | Only for a new `Interference` |
| Tune headcount costs, salary, approval or exit routes | `packages/shared/src/content/headcount.ts` | No |
| Change the approval pipeline or consultation rules | `packages/shared/src/sim/headcount.ts` | Yes |
| Draw an animal | `packages/client/src/render/animals.ts` | No |
| Tune XP, stats or loot rolls | `packages/shared/src/progression.ts` | Yes |
| Change hero combat or a class passive | `packages/shared/src/sim/heroes.ts` | Yes |
| Change Stakeholder behaviour | `packages/shared/src/sim/stakeholders.ts` | Yes |
| Write a wave | `packages/shared/src/content/waves.ts` | No |
| Add speech bubbles / ticker lines | `packages/shared/src/content/barks.ts` | No |
| Change the palette or add a level wing | `packages/shared/src/content/palette.ts` | No |
| Add office furniture | `packages/client/src/render/office.ts` + `content/map.ts` | No |
| Reword the tutorial / onboarding | `packages/shared/src/content/tutorial.ts` | No |
| Add a Performance Review perk | `packages/shared/src/content/perks.ts` | No |
| Add an intern or starter-kit item | `packages/shared/src/content/artifacts.ts` | No |
| Move or add a recharge point | `packages/shared/src/content/map.ts` (`RECHARGE_SPRITES`) | No |
| Change Bandwidth costs | `packages/shared/src/sim/heroes.ts` (`abilityCost`) | Yes |
| Change what a defence says it contributes | `content/towers.ts` (`contributes`) | No |
| Change unlock levels for animals | `packages/shared/src/content/unlocks.ts` | No |
| Add a HUD icon | `packages/client/src/ui/Icon.tsx` | No |
| Draw a sprite | `packages/client/src/render/pixels.ts` | No |
| Change the map | `packages/shared/src/content/map.ts` | No |
| Change combat rules | `packages/shared/src/sim/combat.ts` | Yes |
| Change the loop / phases | `packages/shared/src/sim/index.ts` | Yes |

**Content files are data.** They contain no logic. Behaviour that data needs is
expressed as a `quirk` string handled in `sim/combat.ts`. Adding a quirk is the
only reason a content change should touch the engine.

## 3b. Two rules specific to the class and hero layers

**Every class passive must cut both ways.** HIPPO ignores resistances *and*
earns almost no Social Capital. RHINO is enormous *and* does nothing for the
first eighteen seconds. If your new animal's passive only ever helps, it is a
bonus, not a dysfunction — rewrite it or cut it.

**Heroes must not out-damage processes over a full run.** There is one lever for
this, `HERO_OUTPUT_SCALE` in `sim/heroes.ts`, and a balance test that fails with
*"the game is arguing against itself"* when it slips. Turn the lever down rather
than nerfing fourteen stat blocks by hand. Waves 4, 5 and 8 are *designed* to
invert the ratio (expenses and ER cases are role-locked; wave 8 kills
automation) — that is expected and the test measures the whole run, not a wave.

All hero damage goes through `strike()` in `sim/heroes.ts`. Do not call
`damageRequest` directly from an ability; you will silently skip the passive, the
specialist multiplier, kill credit and the balance lever.

## 3c. Headcount

Towers consume **people**, not slots: `automation` costs 1 FTE to own, `process`
costs 2. That table in `content/headcount.ts` is the game's automation argument
in mechanical form — if you change it, you are changing the thesis, not a number.

Going over headcount sets `unstaffed` on a tower rather than deleting it. Keep
that distinction: `offline` means a maintenance window or a Stakeholder sitting
on it; `unstaffed` means nobody is left to run it. They read differently to the
player and they recover differently.

`enforceHeadcount` runs every tick, so anything that changes the establishment is
automatically reconciled. Do not try to keep the count by hand.

## 3d. Legibility is a hard requirement

The subject of this game is opaque bureaucracy. The game itself must be the
opposite, so three rules are enforced by tests:

- **Every defence declares what it contributes.** `TowerDef.contributes` drives
  the icons and the plain-English line on the build card. A tower with an empty
  `contributes` fails a test.
- **Every lock explains itself in one line** — why you cannot have it, and what
  precisely to do. Locked towers show the *whole* research chain and its total
  price via `pathToTech`; locked animals name the exact account level.
- **Unlock rules live in `content/unlocks.ts` and are shared with the server.**
  If you change what unlocks when, change it there or the lobby will advertise a
  level the server does not honour. A test compares the two.

Icons are 9×9 pixel maps in `ui/Icon.tsx`, same discipline as the sprites: the
art is a text block, so it diffs cleanly.

## 3e. Progression has to be visible

A player reached wave five having levelled four times without noticing, and
having seen no equipment at all, because loot only came from elites that do not
appear until wave six. Both were fixed by making the loop loud rather than by
making it bigger. Keep it that way:

- **Every wave ends in a guaranteed level and a blocking Performance Review.** A
  level that can be missed will be missed.
- **Everything drops**, at a low rate, from wave one. Elites still always drop.
- **Heroes start with kit in two slots** so the equipment system announces itself.
- Unspent talent points nag in the HUD and on the review card.

`npm run balance` prints the tower/player damage split, but it will not tell you
whether a system is *findable*. When you add one, play to wave three and check you
would have noticed it without knowing it was there.

## 4. Hard constraints

- **`packages/shared` imports nothing from `node:` and nothing from the DOM.** It
  runs in the browser, in Node, and in Vitest. The only exception is
  `src/tools/`, which is Node-only and never imported by `src/index.ts`.
- **The sim is deterministic.** Never call `Math.random()` or `Date.now()` inside
  `src/sim/`. Use the seeded RNG in `src/rng.ts` and write the advanced state
  back to `state.rngState`. There is a test that will catch you.
- **The server is the only writer.** Clients send `Intent`s. If you find yourself
  mutating `GameState` in `packages/client`, stop — that is how desyncs start.
- **No binary assets in the game.** All art is pixel maps in `pixels.ts` and
  `office.ts`. Sprites are text, so they diff. The one exception is
  `docs/media/` — README screenshots, which are regenerated by
  `node tools/shots.mjs` rather than hand-captured, so they never go stale
  silently. Never add an image the game loads at runtime.
- **No new runtime dependencies** without a note in the PR saying why.
- **Profiles are the only persistent state**, written by the server to
  `.data/profiles.json`. The sim never reads or writes them; `bankRun` in
  `packages/server/src/profiles.ts` is the single point where a run becomes
  permanent progress.

## 5. Sprites

A sprite is a list of equal-length strings plus a character key. `'.'` is
transparent, `'c'` is the instance accent colour, `'C'` its darker tone. Add the
sprite to `SPRITES` at the bottom of `pixels.ts` and point at it from
`REQUEST_LOOK` / `TOWER_LOOK` / `PROP_LOOK` in `sprites.ts`.

Requests are 12×12, towers and props 16×16, artifacts 12×12.

**The animals are different.** Each is a 14×9 *head plate* in
`client/src/render/animals.ts`, composed onto a shared 14×9 body (`BODY` for the
playable class, `SUIT` for its Stakeholder mirror) to make a 14×18 sprite. Adding
an animal means adding one head; the body and the Stakeholder variant come free.
Sharing the body is deliberate — they all work here, they all wear the same
lanyard, and the head is the only thing that distinguishes them.

Palette rules, which are the whole art direction and are covered by tests:
- never pure white, never pure black
- never a saturated green — that reads "healthy", and nothing here is healthy
- `highlighter` yellow is reserved **exclusively** for things about to hurt you
- corridors are pale, the floor is dark. Inverting it reads as a home, not an
  office, and the whole point is that this is not a home

**Levels reskin the building.** `THEMES` holds a *partial* palette override per
level; unnamed tokens fall back to the base. Adding a wing is six lines. Role
colours are excluded on purpose — a player must be able to find their own animal
in any wing.

**Office furniture carries a `blocks` flag.** Solid furniture takes a tile out of
play; partitions and wall fittings do not. A cubicle farm that halves the
buildable area is set dressing that costs you the game, and there are tests that
will fail if you forget.

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
