/**
 * The art. All of it. In code.
 *
 * Each sprite is a list of equal-length strings, one character per pixel, read
 * against a key that maps characters to palette tokens. Two special tokens:
 *   'ACCENT'  — replaced per-instance (role colour, tower branch colour)
 *   null      — transparent
 *
 * Editing a sprite is editing a text block, which means it diffs cleanly, works
 * in any editor, and can be tweaked by an agent that has never seen a sprite
 * sheet. That is the entire reason we do it this way.
 */

import { ANIMAL_IDS, ANIMAL_PC, ANIMAL_STAKEHOLDER } from './animals.js'
import { OFFICE_SPRITES } from './office.js'

export interface PixelSprite {
  key: Record<string, string | null>
  rows: string[]
}

const T = null

/** Shared key. Values are palette tokens resolved in sprites.ts. */
const K: Record<string, string | null> = {
  '.': T,
  '#': 'wallShadow',
  o: 'void',
  p: 'paper',
  P: 'paperShadow',
  m: 'manila',
  M: 'manilaDark',
  s: 'skin',
  S: 'skinDark',
  h: 'hair',
  c: 'ACCENT',
  C: 'ACCENT_DARK',
  g: 'tubeGreen',
  G: 'tubeGlow',
  t: 'lanyardTeal',
  T: 'lanyardTealDark',
  b: 'deckBlue',
  B: 'deckBlueDark',
  a: 'ashMauve',
  A: 'ashMauveDark',
  y: 'highlighter',
  r: 'escalate',
  R: 'escalateDark',
  v: 'compliance',
  e: 'screenGlow',
  w: 'wall',
  W: 'wallLight',
  n: 'plant',
  N: 'plantDark',
  d: 'carpetDark',
}

function sprite(rows: string[]): PixelSprite {
  return { key: K, rows }
}

// ───────────────────────────────────────────────────────────────── characters

/**
 * 12×16 employee. Big head, small body, Stardew proportions. The 'c' band is
 * the role accent, which is the only thing distinguishing six people who all
 * dress for an office with unreliable air conditioning.
 */
export const PC_BASE = sprite([
  '....####....',
  '...#hhhh#...',
  '..#hhhhhh#..',
  '..#hssssh#..',
  '..#sosos s..',
  '..#ssssss#..',
  '..#.sSSs.#..',
  '...#ssss#...',
  '...#cccc#...',
  '..#Ccccc C..',
  '..#cccccc#..',
  '..scccccc s.',
  '..s#cccc#s..',
  '...#CC CC...',
  '...#dd##dd..',
  '...ooo.ooo..',
])

// ───────────────────────────────────────────────────────────────── requests
// Walking sheets of paper with faces. Cute enough that killing them feels bad,
// which is correct.

export const REQ_BASE = sprite([
  '...######...',
  '..#cccccc#..',
  '.#cccccccc#.',
  '.#coccocc c.',
  '.#cccccccc#.',
  '.#cc.oo.cc#.',
  '.#cccccccc#.',
  '.#Cccccc C#.',
  '..########..',
  '...o....o...',
  '...o....o...',
  '..oo....oo..',
])

/** Tired variant, used for anything with a long SLA. Eyes half closed. */
export const REQ_TIRED = sprite([
  '...######...',
  '..#cccccc#..',
  '.#cccccccc#.',
  '.#cooccooc#.',
  '.#cccccccc#.',
  '.#cc.oo.cc#.',
  '.#coooooc #.',
  '.#Ccccc CC#.',
  '..########..',
  '...o....o...',
  '...o....o...',
  '..oo....oo..',
])

/** Stack-of-paper variant for the chunky ones (expenses, onboarding). */
export const REQ_STACK = sprite([
  '.##########.',
  '.#pppppppp#.',
  '.#pPpppPpp#.',
  '.##########.',
  '.#cccccccc#.',
  '.#coccocc#..',
  '.#cccccccc#.',
  '.#cc.oo.cc#.',
  '.##########.',
  '...o....o...',
  '...o....o...',
  '..oo....oo..',
])

/** Batman. The cowl is the joke and the silhouette. */
export const REQ_BATMAN = sprite([
  '.o......o...',
  '.oo....oo...',
  '.#oooooooo#.',
  '.#oooooooo#.',
  '.#oyooooyo#.',
  '.#oooooooo#.',
  '.#ssssssss#.',
  '.#ss.oo.ss#.',
  '..########..',
  '...o....o...',
  '...o....o...',
  '..oo....oo..',
])

/** Squirrel. Tail on the left, entirely uninterested in the interactive process. */
export const REQ_SQUIRREL = sprite([
  '.....####...',
  'M...#mmmm#..',
  'MM.#mmmmmm#.',
  'MMM#momomm#.',
  'MMM#mmmmmm#.',
  'MM.#mm..mm#.',
  'M..#mmmmmm#.',
  'M..#Mmmmm#..',
  '...######...',
  '....o..o....',
  '....o..o....',
  '...oo..oo...',
])

// ───────────────────────────────────────────────────────────────── towers
// Seven silhouettes, eleven towers. The accent colour carries the branch.

/** Monitor on a stand. Intranet, FAQ, policy. */
export const TW_MONITOR = sprite([
  '................',
  '..############..',
  '..#cccccccccc#..',
  '..#ceeeeeeeec#..',
  '..#ceppppppec#..',
  '..#cepPPPPpec#..',
  '..#ceppppppec#..',
  '..#cepPPPPpec#..',
  '..#ceeeeeeeec#..',
  '..#cccccccccc#..',
  '..############..',
  '......####......',
  '......####......',
  '...##########...',
  '...#CCCCCCCC#...',
  '...##########...',
])

/** Kiosk / portal. Standing, with a card reader. */
export const TW_KIOSK = sprite([
  '....########....',
  '....#cccccc#....',
  '....#ceeeec#....',
  '....#cepppc#....',
  '....#ceeeec#....',
  '....#cccccc#....',
  '....#c#yy#c#....',
  '....#cccccc#....',
  '....#cccccc#....',
  '....#CCCCCC#....',
  '....#cccccc#....',
  '....#cccccc#....',
  '....#CCCCCC#....',
  '...##########...',
  '...#dddddddd#...',
  '...##########...',
])

/** Robot head. Ava, RPA. */
export const TW_ROBOT = sprite([
  '.......y........',
  '.......y........',
  '...##########...',
  '..#cccccccccc#..',
  '..#ceeccccee c..',
  '..#ceoeccoeec#..',
  '..#ceeccccee c..',
  '..#cccccccccc#..',
  '..#cc#oooo#cc#..',
  '..#cccccccccc#..',
  '..#CCCCCCCCCC#..',
  '...##########...',
  '....#cccccc#....',
  '...##########...',
  '...#dddddddd#...',
  '...##########...',
])

/** Filing cabinet. Ticketing, case management, finance integration. */
export const TW_CABINET = sprite([
  '..############..',
  '..#cccccccccc#..',
  '..#c########c#..',
  '..#c#mmmmmm#c#..',
  '..#c#m#oo#m#c#..',
  '..#c########c#..',
  '..#cccccccccc#..',
  '..#c########c#..',
  '..#c#mmmmmm#c#..',
  '..#c#m#oo#m#c#..',
  '..#c########c#..',
  '..#cccccccccc#..',
  '..#CCCCCCCCCC#..',
  '..############..',
  '..#o........o#..',
  '..############..',
])

/** Whiteboard / flowchart. Workflow, enablement. */
export const TW_BOARD = sprite([
  '.##############.',
  '.#pppppppppppp#.',
  '.#pccpppppppp p.',
  '.#pp#ppppppppp#.',
  '.#pp#pccpppppp#.',
  '.#pp#pp#ppppp p.',
  '.#pp##p#pccppp#.',
  '.#ppppppp#pppp#.',
  '.#ppyyppppppp p.',
  '.#pppppppppppp#.',
  '.##############.',
  '....#......#....',
  '....#......#....',
  '...##......##...',
  '...##......##...',
  '................',
])

/** Signpost. Triage and routing. */
export const TW_SIGNPOST = sprite([
  '................',
  '..##########....',
  '..#cccccccc#>...',
  '..#cpppppp c#>..',
  '..##########....',
  '.......##.......',
  '....##########..',
  '..<#cccccccc#...',
  '.<#cpppppp c#...',
  '....##########..',
  '.......##.......',
  '.......##.......',
  '.......##.......',
  '.....######.....',
  '.....#dddd#.....',
  '.....######.....',
])

/** Paper stack. FAQ articles, policy rewrite. */
export const TW_PAPERS = sprite([
  '................',
  '................',
  '...##########...',
  '...#pppppppp#...',
  '...#pPPPPPPp#...',
  '...##########...',
  '..##########....',
  '..#pppppppp#....',
  '..#pcccccpp#....',
  '..##########....',
  '...##########...',
  '...#pppppppp#...',
  '...#pPPPPPPp#...',
  '...#pppyyppp#...',
  '...##########...',
  '................',
])

// ───────────────────────────────────────────────────────────────── props

export const PROP_PRINTER = sprite([
  '................',
  '....########....',
  '....#wwwwww#....',
  '..###wwwwww###..',
  '..#WWWWWWWWWW#..',
  '..#W#pppppp#W#..',
  '..#W#pPPPPp#W#..',
  '..#WWWWWWWWWW#..',
  '..#W#rr####W#W..',
  '..#WWWWWWWWWW#..',
  '..#WWWWWWWWWW#..',
  '..############..',
  '...#o......o#...',
  '................',
  '................',
  '................',
])

export const PROP_PLANT = sprite([
  '.......n........',
  '....n..n..n.....',
  '...nNn.n.nNn....',
  '....nNnnnNn.....',
  '..n..nNnNn..n...',
  '..nNn.nNn .nNn..',
  '...nNnnNnnnNn...',
  '.....nnNnnn.....',
  '.......n........',
  '.....######.....',
  '.....#mmmm#.....',
  '.....#mMMm#.....',
  '.....#mmmm#.....',
  '......####......',
  '................',
  '................',
])

export const PROP_DESK = sprite([
  '................',
  '................',
  '...##########...',
  '...#eeeeee#p#...',
  '...#eppppe#p#...',
  '...##########...',
  '..############..',
  '..#mmmmmmmmmm#..',
  '..#MMMMMMMMMM#..',
  '..############..',
  '..#o........o#..',
  '..#o........o#..',
  '..#o........o#..',
  '..############..',
  '................',
  '................',
])

export const PROP_WATERCOOLER = sprite([
  '.....####.......',
  '....#eeee#......',
  '....#eeee#......',
  '....#eeee#......',
  '....######......',
  '....#wwww#......',
  '....#w##w#......',
  '....#wwww#......',
  '....#wByw#......',
  '....#wwww#......',
  '....#wwww#......',
  '....#wwww#......',
  '...##wwww##.....',
  '...########.....',
  '................',
  '................',
])

export const PROP_PINGPONG = sprite([
  '................',
  '................',
  '................',
  '..############..',
  '..#bbbbbbbbbb#..',
  '..#bbbbppbbbb#..',
  '..#bbbbppbbbb#..',
  '..#bbbbbbbbbb#..',
  '..############..',
  '...#o......o#...',
  '...#o......o#...',
  '...#o......o#...',
  '...#o......o#...',
  '................',
  '................',
  '................',
])

export const PROP_WELLNESS = sprite([
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#W#vvvvvv#W#..',
  '..#W#vppppv#W#..',
  '..#W#vpvvpv#W#..',
  '..#W#vppppv#W#..',
  '..#W#vvvvvv#W#..',
  '..#WWWWWWWWWW#..',
  '..#WWW#yy#WWW#..',
  '..#WWWWWWWWWW#..',
  '..############..',
  '..#o........o#..',
  '................',
  '................',
  '................',
  '................',
])

/** The door everything is trying to reach. 16×32, two tiles tall. */
export const CHRO_DOOR = sprite([
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#W#mmmmmm#W#..',
  '..#W#mMMMMm#W#..',
  '..#W#m#oo#m#W#..',
  '..#W#mMMMMm#W#..',
  '..#W#mmmmmm#W#..',
  '..#W#mmmmmm#W#..',
  '..#W#mmyymm#W#..',
  '..#W#mmmmmm#W#..',
  '..#W#mMMMMm#W#..',
  '..#W#mmmmmm#W#..',
  '..#WWWWWWWWWW#..',
  '..############..',
  '..#rrrrrrrrrr#..',
  '..############..',
])

// The fourteen animals, composed from heads + a shared body in animals.ts.
const ANIMAL_SPRITES: Record<string, PixelSprite> = {}
for (const id of ANIMAL_IDS) {
  ANIMAL_SPRITES[`pc_${id}`] = sprite(ANIMAL_PC[id]!)
  ANIMAL_SPRITES[`sh_${id}`] = sprite(ANIMAL_STAKEHOLDER[id]!)
}

/** Dropped artifacts, 12x12, distinguished by silhouette not colour. */
export const IT_BADGE = sprite([
  '....######..',
  '....#pppp#..',
  '....#pCCp#..',
  '....#pppp#..',
  '....##oo##..',
  '.....#cc#...',
  '....######..',
  '....#cccc#..',
  '....#cCCc#..',
  '....#cccc#..',
  '....######..',
  '............',
])

export const IT_LAPTOP = sprite([
  '............',
  '..########..',
  '..#eeeeee#..',
  '..#epppee#..',
  '..#eeeeee#..',
  '..########..',
  '.##########.',
  '.#PPPPPPPP#.',
  '.#PppppppP#.',
  '.##########.',
  '............',
  '............',
])

export const IT_DOC = sprite([
  '..########..',
  '..#pppppp#..',
  '..#oooppp#..',
  '..#pppppp#..',
  '..#oooooo#..',
  '..#pppppp#..',
  '..#ooopppp..',
  '..#pppppp#..',
  '..#yyypppp..',
  '..#pppppp#..',
  '..########..',
  '............',
])

export const IT_MUG = sprite([
  '............',
  '..######....',
  '..#mmmm#....',
  '..#mMMm#.##.',
  '..#mmmm#.#c#',
  '..#mMMm#.#c#',
  '..#mmmm#.##.',
  '..#mMMm#....',
  '..######....',
  '...####.....',
  '............',
  '............',
])

export const IT_CHAIR = sprite([
  '...######...',
  '...#cccc#...',
  '...#cCCc#...',
  '...#cccc#...',
  '...#cccc#...',
  '...######...',
  '..########..',
  '..#cccccc#..',
  '..########..',
  '.....##.....',
  '...##oo##...',
  '..o..oo..o..',
])

const OFFICE = Object.fromEntries(
  Object.entries(OFFICE_SPRITES).map(([name, rows]) => [name, sprite(rows)]),
) as Record<string, PixelSprite>

/** The intern. Smaller than you, keener than you, on a lanyard that works. */
export const PC_INTERN = sprite([
  '....####....',
  '...#hhhh#...',
  '..#hssssh#..',
  '..#sosos#s..',
  '..#ssssss#..',
  '...#sSSs#...',
  '...#cccc#...',
  '..#cccccc#..',
  '.s#cpppc#s..',
  '.s#cccccc#s.',
  '..#cCccCc#..',
  '..#oo#oo#...',
  '..ooo.ooo...',
  '............',
])

/** Intern item icon, 12x12. */
export const IT_INTERN = sprite([
  '....####....',
  '...#hhhh#...',
  '..#ssssss#..',
  '..#sosos#...',
  '..#ssssss#..',
  '...#ssss#...',
  '...#cccc#...',
  '..#cccccc#..',
  '..#cpppcc#..',
  '..#cccccc#..',
  '..#oo##oo#..',
  '............',
])

export const SPRITES = {
  ...ANIMAL_SPRITES,
  ...OFFICE,
  pc_intern: PC_INTERN,
  it_intern: IT_INTERN,
  it_badge: IT_BADGE,
  it_laptop: IT_LAPTOP,
  it_monitor: IT_LAPTOP,
  it_headset: IT_LAPTOP,
  it_phone: IT_LAPTOP,
  it_doc: IT_DOC,
  it_mug: IT_MUG,
  it_can: IT_MUG,
  it_chair: IT_CHAIR,
  it_desk: IT_CHAIR,
  it_board: IT_DOC,
  pc_base: PC_BASE,
  req_base: REQ_BASE,
  req_tired: REQ_TIRED,
  req_stack: REQ_STACK,
  req_batman: REQ_BATMAN,
  req_squirrel: REQ_SQUIRREL,
  tw_monitor: TW_MONITOR,
  tw_kiosk: TW_KIOSK,
  tw_robot: TW_ROBOT,
  tw_cabinet: TW_CABINET,
  tw_board: TW_BOARD,
  tw_signpost: TW_SIGNPOST,
  tw_papers: TW_PAPERS,
  printer: PROP_PRINTER,
  plant: PROP_PLANT,
  desk: PROP_DESK,
  watercooler: PROP_WATERCOOLER,
  pingpong: PROP_PINGPONG,
  wellness: PROP_WELLNESS,
  chro_door: CHRO_DOOR,
} as const

/**
 * Sprite names are strings, not a literal union: the animals and the office
 * furniture are both generated from data, so a union would only ever be a
 * half-truth. `getSprite` falls back visibly rather than throwing.
 */
export type SpriteName = string

export function hasSprite(name: string): boolean {
  return name in SPRITES
}
