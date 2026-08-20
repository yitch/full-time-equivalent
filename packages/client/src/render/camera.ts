import { BOARD_H, BOARD_W, MAX_ZOOM, TILE } from '@fte/shared'
import type { Vec2 } from '@fte/shared'

/**
 * Camera maths, kept pure and out of the Pixi class so it can be tested without
 * a canvas. Everything here works in *logical board pixels* — the 640×384 space
 * the world is drawn in, before the element is CSS-scaled to fit its container.
 */

export interface Camera {
  zoom: number
  pan: Vec2
}

export function createCamera(): Camera {
  return { zoom: 1, pan: { x: 0, y: 0 } }
}

/**
 * Keeps the view inside the floor. At 1x there is nothing to pan, so this pins
 * to the origin; above that it stops the board sliding off into empty space.
 */
export function clampPan(camera: Camera): Camera {
  const minX = BOARD_W * (1 - camera.zoom)
  const minY = BOARD_H * (1 - camera.zoom)
  return {
    zoom: camera.zoom,
    pan: {
      x: Math.min(0, Math.max(minX, camera.pan.x)),
      y: Math.min(0, Math.max(minY, camera.pan.y)),
    },
  }
}

/**
 * Zooms about a fixed point, so whatever is under the cursor stays under the
 * cursor. Zooming about the centre instead makes the floor lurch sideways every
 * notch, which reads as a bug even when the maths is right.
 */
export function zoomAbout(camera: Camera, factor: number, logical: Vec2): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, camera.zoom * factor))
  if (zoom === camera.zoom) return camera
  const worldX = (logical.x - camera.pan.x) / camera.zoom
  const worldY = (logical.y - camera.pan.y) / camera.zoom
  return clampPan({
    zoom,
    pan: { x: logical.x - worldX * zoom, y: logical.y - worldY * zoom },
  })
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  if (camera.zoom <= 1) return camera
  return clampPan({ zoom: camera.zoom, pan: { x: camera.pan.x + dx, y: camera.pan.y + dy } })
}

/** Logical board pixels → tile coordinates. The inverse of what the world does. */
export function logicalToTile(camera: Camera, logical: Vec2): Vec2 {
  return {
    x: (logical.x - camera.pan.x) / camera.zoom / TILE,
    y: (logical.y - camera.pan.y) / camera.zoom / TILE,
  }
}

/** Tile coordinates → logical board pixels. Used by the follow camera. */
export function tileToLogical(camera: Camera, tile: Vec2): Vec2 {
  return {
    x: tile.x * TILE * camera.zoom + camera.pan.x,
    y: tile.y * TILE * camera.zoom + camera.pan.y,
  }
}

/** Where the camera would sit to centre a tile position. */
export function centreOn(camera: Camera, tile: Vec2): Camera {
  return clampPan({
    zoom: camera.zoom,
    pan: {
      x: BOARD_W / 2 - tile.x * TILE * camera.zoom,
      y: BOARD_H / 2 - tile.y * TILE * camera.zoom,
    },
  })
}
