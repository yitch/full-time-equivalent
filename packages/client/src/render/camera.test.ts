import { BOARD_H, BOARD_W, MAX_ZOOM, TILE, ZOOM_STEP } from '@fte/shared'
import { describe, expect, it } from 'vitest'
import {
  centreOn,
  clampPan,
  createCamera,
  logicalToTile,
  panBy,
  tileToLogical,
  zoomAbout,
} from './camera.js'

const CENTRE = { x: BOARD_W / 2, y: BOARD_H / 2 }

describe('the camera', () => {
  it('starts fitted to the floor', () => {
    const camera = createCamera()
    expect(camera.zoom).toBe(1)
    expect(camera.pan).toEqual({ x: 0, y: 0 })
  })

  it('cannot zoom out past a full view, or in past the cap', () => {
    let camera = createCamera()
    for (let i = 0; i < 40; i++) camera = zoomAbout(camera, 1 / ZOOM_STEP, CENTRE)
    expect(camera.zoom).toBe(1)

    for (let i = 0; i < 80; i++) camera = zoomAbout(camera, ZOOM_STEP, CENTRE)
    expect(camera.zoom).toBe(MAX_ZOOM)
  })

  it('keeps the point under the cursor under the cursor', () => {
    const camera = createCamera()
    const cursor = { x: 173, y: 96 }
    const before = logicalToTile(camera, cursor)
    const zoomed = zoomAbout(camera, 2, cursor)
    const after = logicalToTile(zoomed, cursor)
    expect(after.x).toBeCloseTo(before.x, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  it('never shows anything outside the floor', () => {
    let camera = zoomAbout(createCamera(), 2, CENTRE)
    camera = panBy(camera, 10_000, 10_000)
    expect(camera.pan.x).toBe(0)
    expect(camera.pan.y).toBe(0)

    camera = panBy(camera, -10_000, -10_000)
    expect(camera.pan.x).toBe(BOARD_W * (1 - camera.zoom))
    expect(camera.pan.y).toBe(BOARD_H * (1 - camera.zoom))
  })

  it('refuses to pan when the whole floor is already visible', () => {
    const camera = panBy(createCamera(), 50, 50)
    expect(camera.pan).toEqual({ x: 0, y: 0 })
  })

  it('maps screen to tile and back again', () => {
    const camera = zoomAbout(createCamera(), 2.5, { x: 200, y: 140 })
    const tile = logicalToTile(camera, { x: 310, y: 205 })
    const back = tileToLogical(camera, tile)
    expect(back.x).toBeCloseTo(310, 6)
    expect(back.y).toBeCloseTo(205, 6)
  })

  it('maps to the same tile at every zoom level — clicking must not drift', () => {
    // Pick a tile, work out where it is on screen, and check the inverse agrees.
    const target = { x: 12.5, y: 8.5 }
    for (const zoom of [1, 1.5, 2, 3, MAX_ZOOM]) {
      let camera = createCamera()
      camera = zoomAbout(camera, zoom, CENTRE)
      camera = centreOn(camera, target)
      const logical = tileToLogical(camera, target)
      const round = logicalToTile(camera, logical)
      expect(round.x, `zoom ${zoom}`).toBeCloseTo(target.x, 6)
      expect(round.y, `zoom ${zoom}`).toBeCloseTo(target.y, 6)
    }
  })

  it('centring on a tile puts it in the middle, unless the edge is in the way', () => {
    const camera = centreOn(zoomAbout(createCamera(), 2, CENTRE), { x: 20, y: 12 })
    const middle = logicalToTile(camera, CENTRE)
    expect(middle.x).toBeCloseTo(20, 4)
    expect(middle.y).toBeCloseTo(12, 4)

    // A corner tile cannot be centred without showing the void, so it is clamped.
    const corner = centreOn(zoomAbout(createCamera(), 2, CENTRE), { x: 0, y: 0 })
    expect(corner.pan).toEqual({ x: 0, y: 0 })
  })

  it('a clamped camera is already clamped', () => {
    const once = clampPan({ zoom: 2, pan: { x: 999, y: -99_999 } })
    expect(clampPan(once)).toEqual(once)
  })

  it('at 1x, one tile is TILE logical pixels', () => {
    const camera = createCamera()
    const a = tileToLogical(camera, { x: 0, y: 0 })
    const b = tileToLogical(camera, { x: 1, y: 0 })
    expect(b.x - a.x).toBe(TILE)
  })
})
