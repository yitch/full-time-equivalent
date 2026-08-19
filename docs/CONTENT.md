# Adding content

Worked examples. None of these touch the engine.

## A new inbound request

`packages/shared/src/content/requests.ts`:

```ts
reference_check: {
  id: 'reference_check',
  name: 'Reference Check',
  flavour: 'A company you have never heard of would like you to confirm dates of employment for someone who left in 2019.',
  hp: 40,
  speed: 1.4,
  resist: res({ automation: 0.5 }),   // unlisted channels default to 1
  moraleDamage: 2,
  slaSeconds: 45,
  socialCapital: 2,
  bounty: 7,
  sprite: 'req_base',
},
```

Then give it a look in `packages/client/src/render/sprites.ts`:

```ts
reference_check: { sprite: 'req_base', accent: PALETTE.lanyardTeal },
```

and a few spawn barks in `content/barks.ts`. Put it in a wave in `content/waves.ts`.
A content-integrity test will fail if you reference a type that doesn't exist.

## A new tower

`content/towers.ts`. Set `requires` to a tech id to gate it, pick a `channel`,
and give it two upgrades. If it needs behaviour beyond "shoot the target", add a
`TowerQuirk` string and handle it in `sim/index.ts` → `stepTowers`.

Remember the rule: **the joke is the mechanic.** A tower whose flavour text is
funny but whose numbers are generic is not finished.

## A new wave

`content/waves.ts`. Every wave needs a `teaches` line. If you cannot write one,
the wave is not designed yet — a test enforces this.

`g(at, requestType, count, lane, spacing)` — seconds into the wave, what, how
many, which lane, and the gap between each spawn.

## A new ability kind

This is the one content change that touches the engine.

1. Add the string to `AbilityKind` in `types.ts`.
2. Add a `case` in `sim/abilities.ts` → `applyEffect`.
3. Use `dealBest()` for damage so specialist multipliers apply correctly.

## Tuning

Change numbers, then:

```bash
npm run balance
```

Compare the per-wave table against the design targets in the bible. The
`TOWER DMG` column is the important one: processes should out-damage people over
a full run. Waves 4, 5 and 8 are *designed* to invert that (expenses and ER cases
are role-locked; wave 8 disables automation) — everything else should not.
