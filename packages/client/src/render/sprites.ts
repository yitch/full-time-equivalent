import { PALETTE, TILE, themeFor } from '@fte/shared'
import type { Palette } from '@fte/shared'
import { Texture } from 'pixi.js'
import { SPRITES, type PixelSprite, type SpriteName } from './pixels.js'

/** Drawn instead of throwing when a sprite name is wrong. Obvious on sight. */
const MISSING: PixelSprite = {
  key: { '.': null, x: 'escalate' },
  rows: ['xxxx', 'x..x', 'x..x', 'xxxx'],
}

/** Darkens a hex colour. Used for the ACCENT_DARK slot so one input gives two tones. */
export function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * amount)))
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * amount)))
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * amount)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * The palette in force right now. Levels reskin the whole floor, so every
 * generated texture is keyed on the active theme and regenerated when it
 * changes — role colours are deliberately excluded from this, because a player
 * must be able to find their own animal in any wing of the building.
 */
let activePalette: Palette = { ...(PALETTE as Palette) }
let activeThemeId = 'shared_services'

export function setLevelTheme(levelIndex: number): boolean {
  const { theme, palette } = themeFor(levelIndex)
  if (theme.id === activeThemeId) return false
  activePalette = palette
  activeThemeId = theme.id
  cache.clear()
  return true
}

export function currentPalette(): Palette {
  return activePalette
}

export function currentThemeId(): string {
  return activeThemeId
}

function resolveColour(token: string | null | undefined, accent: string): string | null {
  if (!token) return null
  if (token === 'ACCENT') return accent
  if (token === 'ACCENT_DARK') return shade(accent, 0.62)
  return (activePalette as Record<string, string>)[token] ?? null
}

/**
 * Rasterises a pixel map to an offscreen canvas at 1:1, then hands it to Pixi.
 * Scaling happens on the stage with nearest-neighbour, so a texture is never
 * resampled and the art stays crisp at any integer zoom.
 */
function rasterise(sprite: PixelSprite, accent: string): HTMLCanvasElement {
  const width = sprite.rows.reduce((m, r) => Math.max(m, r.length), 0)
  const height = sprite.rows.length
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  for (let y = 0; y < height; y++) {
    const row = sprite.rows[y] ?? ''
    for (let x = 0; x < width; x++) {
      const colour = resolveColour(sprite.key[row[x] ?? '.'], accent)
      if (!colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

const cache = new Map<string, Texture>()

export function getSprite(name: SpriteName, accent: string = PALETTE.paper): Texture {
  const key = `${activeThemeId}:${name}:${accent}`
  const hit = cache.get(key)
  if (hit) return hit
  const sprite = (SPRITES as Record<string, PixelSprite>)[name] ?? MISSING
  const texture = Texture.from(rasterise(sprite, accent))
  texture.source.scaleMode = 'nearest'
  cache.set(key, texture)
  return texture
}

// ────────────────────────────────────────────────────────── procedural floor

/**
 * Carpet tiles. Office carpet is never one colour — it is a dither of three
 * slightly wrong colours, chosen by someone who saw a sample the size of a
 * beermat. We reproduce that faithfully.
 */
export function makeCarpetTexture(variant: number): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const ctx = canvas.getContext('2d')
  if (!ctx) return Texture.EMPTY

  ctx.fillStyle = variant % 2 === 0 ? activePalette.carpet : activePalette.carpetDark
  ctx.fillRect(0, 0, TILE, TILE)

  // Deterministic weave: no RNG, so the floor looks the same for every player.
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = (x * 7 + y * 13 + variant * 31) % 11
      if (n === 0) {
        ctx.fillStyle = activePalette.carpetLight
        ctx.fillRect(x, y, 1, 1)
      } else if (n === 5) {
        ctx.fillStyle = activePalette.carpetDark
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  // Tile seams. Somebody laid these in 2011 and one of them has always been loose.
  ctx.fillStyle = activePalette.wallShadow
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 0, TILE, 1)
  ctx.fillRect(0, 0, 1, TILE)
  ctx.globalAlpha = 1

  const texture = Texture.from(canvas)
  texture.source.scaleMode = 'nearest'
  return texture
}

/** Lane flooring: the worn linoleum runner everything walks down. */
export function makeLaneTexture(): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const ctx = canvas.getContext('2d')
  if (!ctx) return Texture.EMPTY

  ctx.fillStyle = activePalette.wall
  ctx.fillRect(0, 0, TILE, TILE)
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if ((x * 5 + y * 3) % 9 === 0) {
        ctx.fillStyle = activePalette.wallLight
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  ctx.fillStyle = activePalette.wallShadow
  ctx.globalAlpha = 0.5
  ctx.fillRect(0, 0, TILE, 1)
  ctx.globalAlpha = 1

  const texture = Texture.from(canvas)
  texture.source.scaleMode = 'nearest'
  return texture
}

// ───────────────────────────────────────────────── content → sprite mapping

/** Which silhouette each request wears, and in what colour. */
export const REQUEST_LOOK: Record<string, { sprite: SpriteName; accent: string }> = {
  leave_balance: { sprite: 'req_base', accent: PALETTE.paper },
  policy_question: { sprite: 'req_base', accent: PALETTE.manila },
  payroll_discrepancy: { sprite: 'req_base', accent: PALETTE.budget },
  expense_claim: { sprite: 'req_stack', accent: PALETTE.ashMauve },
  er_case: { sprite: 'req_tired', accent: PALETTE.compliance },
  onboarding_packet: { sprite: 'req_stack', accent: PALETTE.lanyardTeal },
  benefits_enrollment: { sprite: 'req_base', accent: PALETTE.deckBlue },
  batman: { sprite: 'req_batman', accent: PALETTE.void },
  cat_sitter: { sprite: 'req_stack', accent: PALETTE.ashMauveDark },
  beauty_of_the_day: { sprite: 'req_tired', accent: PALETTE.tubeGlow },
  the_mustang: { sprite: 'req_base', accent: PALETTE.escalate },
  facebook_parity: { sprite: 'req_base', accent: PALETTE.deckBlueDark },
  support_squirrel: { sprite: 'req_squirrel', accent: PALETTE.manila },
}

/** Seven silhouettes carry eleven towers; the accent carries the branch. */
export const TOWER_LOOK: Record<string, { sprite: SpriteName; accent: string }> = {
  intranet: { sprite: 'tw_monitor', accent: PALETTE.wallLight },
  faq: { sprite: 'tw_papers', accent: PALETTE.tubeGreen },
  portal: { sprite: 'tw_kiosk', accent: PALETTE.lanyardTeal },
  ava: { sprite: 'tw_robot', accent: PALETTE.screenGlow },
  ticketing: { sprite: 'tw_cabinet', accent: PALETTE.deckBlue },
  workflow: { sprite: 'tw_board', accent: PALETTE.ashMauve },
  triage: { sprite: 'tw_signpost', accent: PALETTE.social },
  rpa: { sprite: 'tw_robot', accent: PALETTE.tubeGlow },
  finance_integration: { sprite: 'tw_cabinet', accent: PALETTE.budget },
  manager_enablement: { sprite: 'tw_board', accent: PALETTE.tubeGreen },
  policy_rewrite: { sprite: 'tw_papers', accent: PALETTE.manila },
}

/**
 * Office furniture. The accent is resolved from the *live* palette, so a filing
 * cabinet in Payroll is a different colour from the same cabinet in Employee
 * Relations without either sprite knowing anything about levels.
 */
const PROP_ACCENT: Record<string, keyof Palette> = {
  chair: 'ashMauve',
  filing_cabinet: 'lanyardTeal',
  bookshelf: 'manilaDark',
  bin: 'tubeGreen',
  vending: 'deckBlue',
  plant_big: 'manila',
  sofa: 'ashMauve',
  water_dispenser: 'lanyardTeal',
}

export function propAccent(sprite: string): string {
  const token = PROP_ACCENT[sprite]
  return token ? activePalette[token] : activePalette.wallLight
}

export const PROP_LOOK: Record<string, SpriteName> = {
  printer: 'printer',
  plant: 'plant',
  desk: 'desk',
  watercooler: 'watercooler',
  pingpong: 'pingpong',
  wellness: 'wellness',
  part_h: 'part_h',
  part_v: 'part_v',
  part_corner: 'part_corner',
  desk_crt: 'desk_crt',
  chair: 'chair',
  desk_pair: 'desk_pair',
  photocopier: 'photocopier',
  fridge: 'fridge',
  water_dispenser: 'water_dispenser',
  coffee: 'coffee',
  vending: 'vending',
  shredder: 'shredder',
  server_rack: 'server_rack',
  fax: 'fax',
  filing_cabinet: 'filing_cabinet',
  bookshelf: 'bookshelf',
  pigeonholes: 'pigeonholes',
  in_tray: 'in_tray',
  noticeboard: 'noticeboard',
  clock: 'clock',
  fire_extinguisher: 'fire_extinguisher',
  bin: 'bin',
  plant_big: 'plant_big',
  sofa: 'sofa',
  meeting_table: 'meeting_table',
  time_clock: 'time_clock',
  first_aid: 'first_aid',
}
