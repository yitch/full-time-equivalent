import { describe, expect, it } from 'vitest'
import { MAX_SPEED, TICK_HZ, stepsForTick } from '../constants.js'
import { addPlayer, applyIntent, createGame, setRole, step } from './index.js'

/**
 * Fast-forward must be the same simulation, only sooner. Adding whole steps
 * rather than shortening the tick is what makes that true, so these tests pin
 * both the arithmetic and the determinism it protects.
 */
describe('pace', () => {
  it('runs one step per tick at normal speed and none while paused', () => {
    expect(stepsForTick(1)).toBe(1)
    expect(stepsForTick(0)).toBe(0)
  })

  it('runs exactly N steps per tick when fast-forwarding', () => {
    expect(stepsForTick(2)).toBe(2)
    expect(stepsForTick(3)).toBe(3)
  })

  it('clamps anything silly a client might send', () => {
    expect(stepsForTick(99)).toBe(MAX_SPEED)
    expect(stepsForTick(-4)).toBe(0)
    expect(stepsForTick(undefined)).toBe(1)
    expect(stepsForTick(Number.NaN)).toBe(1)
  })

  it('a run starts at normal speed', () => {
    expect(createGame(1).speed).toBe(1)
  })

  it('the intent sets it, clamps it, and says who did it', () => {
    const state = createGame(1)
    addPlayer(state, 'p1', 'Yitch')
    setRole(state, 'p1', 'hippo')

    expect(applyIntent(state, 'p1', { t: 'set_speed', speed: 3 })).toBeNull()
    expect(state.speed).toBe(3)
    expect(state.log.at(-1)).toContain('Yitch')
    expect(state.log.at(-1)).toContain('3x')

    applyIntent(state, 'p1', { t: 'set_speed', speed: 999 })
    expect(state.speed).toBe(MAX_SPEED)

    applyIntent(state, 'p1', { t: 'set_speed', speed: 0 })
    expect(state.speed).toBe(0)
    expect(state.log.at(-1)).toContain('paused')
  })

  it('pausing stops the clock without discarding the run', () => {
    const state = createGame(7)
    addPlayer(state, 'p1', 'Yitch')
    setRole(state, 'p1', 'hippo')
    applyIntent(state, 'p1', { t: 'ready', value: true })
    step(state)
    const phaseTicks = state.phaseTicks

    applyIntent(state, 'p1', { t: 'set_speed', speed: 0 })
    // A paused driver runs zero steps, so nothing advances at all.
    for (let i = 0; i < stepsForTick(state.speed) * TICK_HZ; i++) step(state)
    expect(state.phaseTicks).toBe(phaseTicks)
    expect(state.phase).toBe('briefing')
  })

  it('three ticks at 3x are the same simulation as nine ticks at 1x', () => {
    const drive = (speed: number, ticks: number) => {
      const state = createGame(4242)
      addPlayer(state, 'p1', 'Yitch')
      setRole(state, 'p1', 'wolf')
      applyIntent(state, 'p1', { t: 'ready', value: true })
      state.speed = speed
      for (let t = 0; t < ticks; t++) {
        for (let s = 0; s < stepsForTick(state.speed); s++) step(state)
      }
      return JSON.stringify({ ...state, events: [], log: [], speed: 0 })
    }
    // Same number of simulation steps either way, so the states must match.
    expect(drive(3, 40)).toBe(drive(1, 120))
  })
})
