/**
 * "LUMON" — the severed-floor look.
 *
 * Cold, institutional, retro-corporate. Pale green-white corridor lino under
 * hard fluorescent light, dark navy carpet in the working areas, CRT cyan for
 * anything a screen would emit, and one warm colour — manila — because paper is
 * the only thing in this building that was ever alive.
 *
 * Rules, enforced by taste and code review:
 *  - never pure white, never pure black — everything is slightly institutional
 *  - never a saturated green: that reads "healthy", and nothing here is healthy
 *  - `highlighter` is reserved exclusively for things about to hurt you
 *  - corridors are pale and the floor is dark. Inverting that reads as a home,
 *    not an office, and the whole point is that this is not a home.
 *
 * This file is the entire mood. `THEMES` reskins it per level.
 */
export const PALETTE = {
  void: '#0a0e13',
  carpetDark: '#141d28',
  carpet: '#1c2835',
  carpetLight: '#243346',
  wall: '#c9d1c8',
  wallLight: '#e0e5da',
  wallShadow: '#8e9a92',

  tubeGreen: '#3e8f83',
  tubeGlow: '#6fd3c4',
  ashMauve: '#7a8b9e',
  ashMauveDark: '#566b80',
  lanyardTeal: '#2f7f77',
  lanyardTealDark: '#1e5850',
  deckBlue: '#4a7fa8',
  deckBlueDark: '#325a79',

  manila: '#c3a86c',
  manilaDark: '#94794a',
  paper: '#eceadf',
  paperShadow: '#b8b6a8',

  skin: '#d3ac8c',
  skinDark: '#a8836a',
  hair: '#3a3630',

  highlighter: '#e8d84a',
  escalate: '#b8433c',
  escalateDark: '#83302b',
  compliance: '#8f6fb0',
  morale: '#c07f92',
  social: '#d8bd63',
  budget: '#5fa38c',

  screenGlow: '#6fd3c4',
  plant: '#4f7a63',
  plantDark: '#35563f',
} as const

export type PaletteKey = keyof typeof PALETTE
export type Palette = Record<PaletteKey, string>

/**
 * Each level is a different wing of the building, and each wing was decorated by
 * a different committee in a different decade. Overrides are partial: anything a
 * theme does not name falls back to the base palette above.
 */
export interface LevelTheme {
  id: string
  /** Shown on the briefing card and the floor sign. */
  department: string
  /** One line of signage flavour. */
  motto: string
  overrides: Partial<Palette>
}

export const THEMES: LevelTheme[] = [
  {
    id: 'shared_services',
    department: 'SHARED SERVICES',
    motto: 'The work is mysterious and important.',
    overrides: {},
  },
  {
    id: 'policy',
    department: 'POLICY & GOVERNANCE',
    motto: 'Please refer to the policy before contacting the policy owner.',
    overrides: {
      carpet: '#1a2739',
      carpetDark: '#121c2b',
      carpetLight: '#22334c',
      wall: '#c4cdd4',
      wallLight: '#dde4e8',
      tubeGreen: '#4a7fa8',
      tubeGlow: '#7fb6de',
      screenGlow: '#7fb6de',
    },
  },
  {
    id: 'payroll',
    department: 'PAYROLL',
    motto: 'The cutoff is the cutoff.',
    overrides: {
      carpet: '#16261f',
      carpetDark: '#0f1b17',
      carpetLight: '#1e3229',
      wall: '#c8d0c2',
      wallLight: '#dfe5d8',
      tubeGreen: '#4f8f6a',
      tubeGlow: '#7fd0a0',
      screenGlow: '#7fd0a0',
      manila: '#c8b070',
    },
  },
  {
    id: 'mobility',
    department: 'MOBILITY & EXPENSES',
    motto: 'Receipts must be legible and in the original currency.',
    overrides: {
      carpet: '#26201a',
      carpetDark: '#1b1712',
      carpetLight: '#332a21',
      wall: '#d2cbb8',
      wallLight: '#e6e0cd',
      wallShadow: '#9c9482',
      tubeGreen: '#a1874c',
      tubeGlow: '#d8b96e',
      screenGlow: '#d8b96e',
    },
  },
  {
    id: 'er',
    department: 'EMPLOYEE RELATIONS',
    motto: 'This conversation is being minuted.',
    overrides: {
      carpet: '#221c2b',
      carpetDark: '#181320',
      carpetLight: '#2c2438',
      wall: '#cbc4d0',
      wallLight: '#e0dae4',
      tubeGreen: '#6f5f92',
      tubeGlow: '#a48fd0',
      screenGlow: '#a48fd0',
      compliance: '#b98fd8',
    },
  },
  {
    id: 'org_design',
    department: 'ORGANISATIONAL DESIGN',
    motto: 'The boxes have no names in them yet.',
    overrides: {
      carpet: '#1d2124',
      carpetDark: '#141719',
      carpetLight: '#272c30',
      wall: '#ccd0cf',
      wallLight: '#e2e6e4',
      tubeGreen: '#6d8288',
      tubeGlow: '#9fb8bd',
      screenGlow: '#9fb8bd',
    },
  },
  {
    id: 'onboarding',
    department: 'ONBOARDING',
    motto: 'Welcome. Your access will be ready by Thursday.',
    overrides: {
      carpet: '#152825',
      carpetDark: '#0f1d1b',
      carpetLight: '#1d3531',
      wall: '#c6d4cf',
      wallLight: '#dee9e4',
      tubeGreen: '#3f9c8c',
      tubeGlow: '#7fe0cd',
      screenGlow: '#7fe0cd',
    },
  },
  {
    id: 'people_systems',
    department: 'PEOPLE SYSTEMS',
    motto: 'Scheduled maintenance is a Tuesday afternoon activity.',
    overrides: {
      void: '#080b0d',
      carpet: '#181a16',
      carpetDark: '#101210',
      carpetLight: '#22261f',
      wall: '#b8b8a8',
      wallLight: '#d2d2bf',
      wallShadow: '#83836f',
      tubeGreen: '#a8802f',
      tubeGlow: '#e8b64a',
      screenGlow: '#e8b64a',
    },
  },
  {
    id: 'board_floor',
    department: 'THE BOARD FLOOR',
    motto: 'The Board is present and will not be addressed directly.',
    overrides: {
      void: '#07090c',
      carpet: '#12161e',
      carpetDark: '#0c0f15',
      carpetLight: '#1a2030',
      wall: '#b6b2a4',
      wallLight: '#d0ccbc',
      wallShadow: '#7f7c70',
      tubeGreen: '#8a7433',
      tubeGlow: '#d8bd63',
      screenGlow: '#d8bd63',
      escalate: '#c4443a',
    },
  },
]

/** Resolves a full palette for a level. Unnamed tokens fall back to the base. */
export function themeFor(levelIndex: number): { theme: LevelTheme; palette: Palette } {
  const theme = THEMES[Math.max(0, Math.min(THEMES.length - 1, levelIndex))] ?? THEMES[0]!
  return { theme, palette: { ...(PALETTE as Palette), ...theme.overrides } }
}

/**
 * Per-role accent, used for avatars, cursors and the roster. Deliberately taken
 * from the base palette and *not* re-themed: a player must be able to find their
 * own animal on the floor regardless of which wing they are standing in.
 */
export const ROLE_COLOURS: Record<string, string> = {
  hippo: PALETTE.tubeGreen,
  zebra: PALETTE.paper,
  wolf: PALETTE.wallShadow,
  rhino: PALETTE.ashMauve,
  seagull: PALETTE.screenGlow,
  goose: PALETTE.deckBlue,
  puffin: PALETTE.manila,
  puma: PALETTE.escalate,
  cobra: PALETTE.compliance,
  yak: PALETTE.manilaDark,
  donkey: PALETTE.lanyardTeal,
  mouse: PALETTE.paperShadow,
  viper: PALETTE.escalateDark,
  dodo: PALETTE.deckBlueDark,
}
