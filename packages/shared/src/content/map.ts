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

/**
 * Office furniture.
 *
 * `blocks` is the important field. Solid furniture — desks, copiers, fridges —
 * takes a tile out of play. Cubicle partitions and wall fittings deliberately do
 * **not**: they draw the grid of a bureaucratic floor without eating the space
 * the player needs to build in. A cubicle farm that halves your buildable area
 * is set dressing that costs you the game.
 */
export interface Prop {
  tile: Vec2
  sprite: string
  label: string
  blocks: boolean
}

function solid(x: number, y: number, sprite: string, label: string): Prop {
  return { tile: { x, y }, sprite, label, blocks: true }
}

function decor(x: number, y: number, sprite: string, label: string): Prop {
  return { tile: { x, y }, sprite, label, blocks: false }
}

/**
 * One cubicle: partitions on two sides, a desk with a CRT, and a chair that has
 * been adjusted in none of its four available directions. 3x3, two solid tiles.
 */
function cubicle(x: number, y: number, occupant: string): Prop[] {
  return [
    decor(x, y, 'part_corner', `Cubicle — ${occupant}`),
    decor(x + 1, y, 'part_h', 'Partition'),
    decor(x + 2, y, 'part_h', 'Partition'),
    decor(x, y + 1, 'part_v', 'Partition'),
    decor(x, y + 2, 'part_v', 'Partition'),
    solid(x + 1, y + 1, 'desk_crt', `Desk — ${occupant}`),
    solid(x + 2, y + 2, 'chair', 'Chair (adjustable, unadjusted)'),
  ]
}

/** Who sits where. The names are the joke; the tiles are the level design. */
const CUBICLES: [number, number, string][] = [
  [9, 1, 'vacant since the restructure'],
  [13, 1, 'on secondment, desk untouched'],
  [9, 5, 'hot desk, booked by nobody'],
  [13, 5, 'two monitors, one used'],
  [29, 1, 'has a personal mug'],
  [33, 1, 'has a personal keyboard'],
  [29, 5, 'faces the wall by choice'],
  [33, 5, 'left in March'],
  [1, 6, 'the quiet one'],
  [19, 5, 'takes calls standing up'],
  [23, 5, 'has a second phone'],
  [1, 13, 'covered by a temp'],
  [1, 17, 'the temp'],
  [35, 13, 'nearest the printer, regrets it'],
  [35, 19, 'nearest the fridge, does not regret it'],
  [18, 17, 'photo of a dog, no dog'],
  [22, 17, 'four succulents, all plastic'],
]

export const PROPS: Prop[] = [
  ...CUBICLES.flatMap(([x, y, who]) => cubicle(x, y, who)),

  // The machines. Every one of these is somebody's unofficial responsibility.
  solid(11, 12, 'photocopier', 'Photocopier (a sign has been taped to it)'),
  solid(12, 13, 'shredder', 'Shredder (the only machine here that never jams)'),
  solid(8, 12, 'fax', 'Fax machine (retained for one supplier)'),
  solid(13, 13, 'in_tray', 'In-tray, three deep'),
  solid(17, 13, 'filing_cabinet', 'Filing cabinet (2011-2014)'),
  solid(18, 13, 'filing_cabinet', 'Filing cabinet (2015-, jammed)'),
  solid(27, 13, 'water_dispenser', 'Water dispenser (the real HRIS)'),
  solid(28, 13, 'bin', 'Recycling (contaminated, per notice)'),
  solid(30, 13, 'bookshelf', 'Shelf of binders nobody opens'),
  solid(31, 13, 'pigeonholes', 'Pigeonholes (three hold post for leavers)'),
  solid(38, 10, 'server_rack', 'Comms cabinet (do not switch off)'),

  // The kitchen, which is a corridor with a fridge in it.
  solid(2, 21, 'fridge', 'Fridge (there is a labelled lunch in it)'),
  solid(4, 21, 'coffee', 'Coffee machine (descaled once, in 2019)'),
  solid(6, 21, 'vending', 'Vending machine (row E is stuck)'),
  solid(8, 21, 'bin', 'General waste'),

  // Breakout, so called.
  solid(17, 20, 'sofa', 'Breakout sofa (nobody has broken out)'),
  solid(25, 19, 'meeting_table', 'Meeting table (booked, empty, booked)'),
  solid(12, 22, 'plant_big', 'Ficus (plastic)'),
  solid(30, 22, 'plant_big', 'Ficus (real, dying)'),
  solid(21, 12, 'desk_pair', 'Bench desks (hot, in theory)'),

  // Wall fittings. Decoration only — these do not take a tile out of play.
  decor(7, 2, 'clock', 'Wall clock (two minutes fast, deliberately)'),
  decor(2, 3, 'time_clock', 'Time clock (nobody uses it, nobody removes it)'),
  decor(4, 3, 'first_aid', 'First aid box'),
  decor(6, 3, 'fire_extinguisher', 'Fire extinguisher (checked, allegedly)'),
  decor(20, 2, 'noticeboard', 'Noticeboard: fire drill, a rota, a thank-you card'),
  decor(26, 2, 'noticeboard', 'Noticeboard: the same fire drill notice'),
  decor(36, 22, 'fire_extinguisher', 'Fire extinguisher'),
  decor(16, 12, 'clock', 'Wall clock (stopped)'),
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

/** Only solid furniture removes a tile from play. Partitions and signage do not. */
export const PROP_TILES: Set<number> = new Set(
  PROPS.filter((p) => p.blocks).map((p) => key(p.tile.x, p.tile.y)),
)

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
