/**
 * Deterministic PRNG (mulberry32). The sim must be reproducible: same seed plus
 * same intent stream must produce the same state, or replays and headless tests
 * are worthless.
 */
export interface Rng {
  state: number
}

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 }
}

/** Advances the generator. Returns a float in [0, 1). */
export function next(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0
  let t = rng.state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Integer in [min, max]. */
export function nextInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(next(rng) * (max - min + 1))
}

/** Float in [min, max). */
export function nextFloat(rng: Rng, min: number, max: number): number {
  return min + next(rng) * (max - min)
}

export function chance(rng: Rng, p: number): boolean {
  return next(rng) < p
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick() called on empty array')
  return arr[Math.floor(next(rng) * arr.length)]!
}
