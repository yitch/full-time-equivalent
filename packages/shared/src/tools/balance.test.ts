import { describe, expect, it } from 'vitest'
import { WAVES } from '../content/index.js'
import { playRun } from './bot.js'

/**
 * Balance regression. These are the design invariants, not arbitrary numbers —
 * each failure message says which design promise broke. Tune content until these
 * pass; do not loosen the bounds to make a change fit.
 */
describe('campaign balance', () => {
  const SEEDS = [20260819, 7, 1234]

  it('a competent squad reaches Open Enrollment on every seed', () => {
    for (const seed of SEEDS) {
      const { wavesCleared } = playRun(seed)
      expect(wavesCleared, `seed ${seed} died early — the early game is overtuned`).toBeGreaterThanOrEqual(
        WAVES.length - 1,
      )
    }
  })

  it('processes out-damage people over a full run — this is the whole thesis', () => {
    for (const seed of SEEDS) {
      const { towerDamageShare } = playRun(seed)
      expect(
        towerDamageShare,
        `seed ${seed}: towers did only ${Math.round(towerDamageShare * 100)}% — the game is arguing against itself`,
      ).toBeGreaterThan(0.5)
    }
  })

  it('Open Enrollment still costs you something — a boss you no-sell is not a boss', () => {
    const results = SEEDS.map((seed) => playRun(seed).state)
    const damaged = results.filter((s) => s.morale < 100 || s.compliance < 60)
    expect(damaged.length, 'no seed took meaningful damage at the boss').toBeGreaterThanOrEqual(2)
  })

  it('doing nothing loses: showing up is not a strategy', () => {
    const { state } = playRun(999, ['hippo'], { passive: true })
    expect(state.phase).toBe('gameover')
    expect(state.morale).toBe(0)
  })

  it('the run terminates — no wave may hang', () => {
    for (const seed of SEEDS) {
      const { state } = playRun(seed)
      expect(['victory', 'gameover']).toContain(state.phase)
    }
  })
})
