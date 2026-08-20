/** Board and loop constants. Shared by sim, server and renderer. */

export const TILE = 16
export const GRID_W = 40
export const GRID_H = 24
export const BOARD_W = GRID_W * TILE // 640
export const BOARD_H = GRID_H * TILE // 384

/** Server simulation rate. */
export const TICK_HZ = 20
export const TICK_MS = 1000 / TICK_HZ
export const DT = 1 / TICK_HZ

/** Snapshot broadcast rate. */
export const SNAPSHOT_HZ = 10
export const TICKS_PER_SNAPSHOT = TICK_HZ / SNAPSHOT_HZ

export const MAX_PLAYERS = 5

/**
 * Fast-forward. Anything above 3 stops being "watch it faster" and starts being
 * "miss what happened", which is not a speed control, it is a skip button.
 */
export const MAX_SPEED = 3

/**
 * How far in the camera goes. Past about 4x a 16px tile is bigger than a desk in
 * real life and you lose the shape of the floor, which is most of the game.
 */
export const MAX_ZOOM = 4
export const ZOOM_STEP = 1.15
export const SPEED_STEPS = [0, 1, 2, 3] as const

/**
 * How many simulation steps a driver should run for one real tick at a given
 * speed. Fast-forward adds whole steps rather than shortening the tick, so the
 * fixed timestep — and therefore determinism — is identical at every pace.
 */
export function stepsForTick(speed: number | undefined): number {
  if (speed === undefined || Number.isNaN(speed)) return 1
  return Math.max(0, Math.min(MAX_SPEED, Math.round(speed)))
}

export const START_MORALE = 100
export const START_COMPLIANCE = 100
export const START_BUDGET = 260
export const START_SOCIAL_CAPITAL = 0

/** Seconds of prep before wave 1 and between waves. */
export const BRIEFING_SECONDS = 20
export const STEERING_SECONDS = 30

/** Player movement, tiles per second. */
export const PLAYER_SPEED = 5.5

/** How close a player must be to a tower to buff / interact, in tiles. */
export const PLAYER_AURA_TILES = 3

/** Duplicate-role penalty: "unclear ownership". */
export const DUPLICATE_ROLE_PENALTY = 0.8
