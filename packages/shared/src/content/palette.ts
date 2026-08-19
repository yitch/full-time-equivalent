/**
 * "Fluorescent Rot" — Stardew's chunky warmth with the lights wrong.
 *
 * Rules, enforced by taste and code review:
 *  - never pure white, never pure black
 *  - never a saturated green: that reads "healthy", and nothing here is healthy
 *  - `highlighter` is reserved exclusively for things about to hurt you
 *
 * This file is the entire mood. Swapping it reskins the game.
 */
export const PALETTE = {
  void: '#14121c',
  carpetDark: '#2e2438',
  carpet: '#3d3049',
  carpetLight: '#493a56',
  wall: '#4a4258',
  wallLight: '#5d5470',
  wallShadow: '#332d40',

  tubeGreen: '#7f9c6a',
  tubeGlow: '#a8c47f',
  ashMauve: '#8d6f86',
  ashMauveDark: '#6b5266',
  lanyardTeal: '#4f8f8b',
  lanyardTealDark: '#37625f',
  deckBlue: '#5a7fa8',
  deckBlueDark: '#3e5a7a',

  manila: '#c8a96b',
  manilaDark: '#9a7f47',
  paper: '#e6dfc8',
  paperShadow: '#b9b298',

  skin: '#d8a887',
  skinDark: '#ab7f61',
  hair: '#4a3b3b',

  highlighter: '#e8e34a',
  escalate: '#c1483f',
  escalateDark: '#8e3229',
  compliance: '#a05fc0',
  morale: '#c96f8f',
  social: '#e0c05a',
  budget: '#7fae7a',

  screenGlow: '#8fd0c8',
  plant: '#5f8358',
  plantDark: '#43613e',
} as const

export type PaletteKey = keyof typeof PALETTE

/** Per-role accent, used for avatars, cursors and the roster. */
export const ROLE_COLOURS: Record<string, string> = {
  hrbp: PALETTE.deckBlue,
  payroll: PALETTE.budget,
  talent: PALETTE.lanyardTeal,
  rewards: PALETTE.social,
  hris: PALETTE.screenGlow,
  travel: PALETTE.ashMauve,
}
