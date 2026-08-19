import { GRID_H, GRID_W } from '../constants.js'
import type { Vec2 } from '../types.js'

/**
 * Floor 3 — Shared Services.
 *
 * Three lanes enter from the left and converge on the CHRO door on the right.
 * Paths are polylines in tile coordinates; the sim walks them by arc length so
 * lane length differences are real and matter for balance.
 */

export interface LaneDef {
  index: number
  name: string
  flavour: string
  points: Vec2[]
}

export const CHRO_DOOR: Vec2 = { x: 39, y: 12 }

export const LANES: LaneDef[] = [
  {
    index: 0,
    name: 'Payroll & Systems',
    flavour: 'past the printer that has been "being fixed" since March',
    points: [
      { x: -1, y: 4 },
      { x: 8, y: 4 },
      { x: 8, y: 9 },
      { x: 18, y: 9 },
      { x: 18, y: 4 },
      { x: 28, y: 4 },
      { x: 28, y: 12 },
      { x: 36, y: 12 },
      { x: 40, y: 12 },
    ],
  },
  {
    index: 1,
    name: 'Employee Services',
    flavour: 'straight through the open plan, making eye contact with everyone',
    points: [
      { x: -1, y: 12 },
      { x: 6, y: 12 },
      { x: 6, y: 17 },
      { x: 14, y: 17 },
      { x: 14, y: 11 },
      { x: 24, y: 11 },
      { x: 24, y: 15 },
      { x: 32, y: 15 },
      { x: 32, y: 12 },
      { x: 40, y: 12 },
    ],
  },
  {
    index: 2,
    name: 'Talent & Mobility',
    flavour: 'past the wellness room nobody has ever successfully booked',
    points: [
      { x: -1, y: 20 },
      { x: 10, y: 20 },
      { x: 10, y: 15 },
      { x: 16, y: 15 },
      { x: 16, y: 21 },
      { x: 26, y: 21 },
      { x: 26, y: 17 },
      { x: 34, y: 17 },
      { x: 34, y: 12 },
      { x: 40, y: 12 },
    ],
  },
]

/** Decorative obstacles that also block building. Flavour with consequences. */
export interface Prop {
  tile: Vec2
  sprite: string
  label: string
}

export const PROPS: Prop[] = [
  { tile: { x: 11, y: 6 }, sprite: 'printer', label: 'Printer (out of order since March)' },
  { tile: { x: 21, y: 6 }, sprite: 'plant', label: 'Plant (plastic)' },
  { tile: { x: 4, y: 8 }, sprite: 'desk', label: 'Hot desk' },
  { tile: { x: 5, y: 8 }, sprite: 'desk', label: 'Hot desk' },
  { tile: { x: 20, y: 14 }, sprite: 'pingpong', label: 'Ping-pong table (culture)' },
  { tile: { x: 21, y: 14 }, sprite: 'pingpong', label: 'Ping-pong table (culture)' },
  { tile: { x: 30, y: 8 }, sprite: 'plant', label: 'Plant (real, dying)' },
  { tile: { x: 8, y: 21 }, sprite: 'wellness', label: 'Wellness room (booked until 2031)' },
  { tile: { x: 9, y: 21 }, sprite: 'wellness', label: 'Wellness room (booked until 2031)' },
  { tile: { x: 30, y: 20 }, sprite: 'desk', label: 'Desk of someone who left' },
  { tile: { x: 36, y: 5 }, sprite: 'watercooler', label: 'Water cooler (the real HRIS)' },
  { tile: { x: 2, y: 15 }, sprite: 'printer', label: 'Printer (also out of order)' },
]

// ───────────────────────────────────────────────────────── derived geometry

function key(x: number, y: number): number {
  return y * GRID_W + x
}

/** Tiles occupied by any lane path, plus a 0-tile margin. Not buildable. */
export const PATH_TILES: Set<number> = (() => {
  const set = new Set<number>()
  for (const lane of LANES) {
    for (let i = 0; i < lane.points.length - 1; i++) {
      const a = lane.points[i]!
      const b = lane.points[i + 1]!
      const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(a.x + ((b.x - a.x) * s) / steps)
        const y = Math.round(a.y + ((b.y - a.y) * s) / steps)
        if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) set.add(key(x, y))
      }
    }
  }
  return set
})()

export const PROP_TILES: Set<number> = new Set(PROPS.map((p) => key(p.tile.x, p.tile.y)))

/** A one-tile border is reserved so towers never render half off-screen. */
export function isBuildable(x: number, y: number): boolean {
  if (x < 1 || y < 1 || x >= GRID_W - 1 || y >= GRID_H - 1) return false
  if (PATH_TILES.has(key(x, y))) return false
  if (PROP_TILES.has(key(x, y))) return false
  return true
}

/** Cumulative arc-length table per lane, so `progress` is in real tiles. */
export interface LaneGeometry {
  points: Vec2[]
  segLengths: number[]
  cumulative: number[]
  total: number
}

export const LANE_GEOMETRY: LaneGeometry[] = LANES.map((lane) => {
  const segLengths: number[] = []
  const cumulative: number[] = [0]
  let total = 0
  for (let i = 0; i < lane.points.length - 1; i++) {
    const a = lane.points[i]!
    const b = lane.points[i + 1]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    segLengths.push(len)
    total += len
    cumulative.push(total)
  }
  return { points: lane.points, segLengths, cumulative, total }
})

/** Position along a lane at arc length `d` (tiles). Clamped at both ends. */
export function pointAt(laneIndex: number, d: number): Vec2 {
  const geo = LANE_GEOMETRY[laneIndex]
  if (!geo) return { x: 0, y: 0 }
  if (d <= 0) return { ...geo.points[0]! }
  if (d >= geo.total) return { ...geo.points[geo.points.length - 1]! }
  let seg = 0
  while (seg < geo.segLengths.length - 1 && geo.cumulative[seg + 1]! < d) seg++
  const a = geo.points[seg]!
  const b = geo.points[seg + 1]!
  const segLen = geo.segLengths[seg]!
  const t = segLen === 0 ? 0 : (d - geo.cumulative[seg]!) / segLen
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function laneLength(laneIndex: number): number {
  return LANE_GEOMETRY[laneIndex]?.total ?? 0
}
