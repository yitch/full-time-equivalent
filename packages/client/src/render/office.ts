/**
 * Office equipment, 16×16 each.
 *
 * The brief was "a VERY bureaucratic office", which means the furniture is the
 * set dressing doing the work: cubicle partitions, CRTs, a photocopier that
 * somebody has taped a sign to, and a fridge nobody has opened since the last
 * reorganisation.
 *
 * Character key is the shared one in pixels.ts. `c`/`C` are the instance accent,
 * so a single sprite reskins per level theme.
 */

export type Rows = string[]

// ─────────────────────────────────────────────────────── cubicle partitions
// Non-blocking on purpose: they draw the grid of the floor without eating the
// space the player needs to build in. See the note in content/map.ts.

export const PART_H: Rows = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  'wwwwwwwwwwwwwwww',
  'WWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwww',
  'oooooooooooooooo',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]

export const PART_V: Rows = [
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
]

export const PART_CORNER: Rows = [
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  '......wWwo......',
  'wwwwwwwWwo......',
  'WWWWWWWWWo......',
  'wwwwwwwwwo......',
  'ooooooooooo.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]

// ────────────────────────────────────────────────────────────── workstations

/** Desk with a CRT. The screen is the only light source anyone here trusts. */
export const DESK_CRT: Rows = [
  '................',
  '....########....',
  '...#WWWWWWWW#...',
  '...#WeeeeeeW#...',
  '...#WeGGGGeW#...',
  '...#WeGooGeW#...',
  '...#WeGGGGeW#...',
  '...#WWWWWWWW#...',
  '....##oooo##....',
  '.....######.....',
  '.##############.',
  '.#mmmmmmmmmmmm#.',
  '.#MMMMMMMMMMMM#.',
  '.##############.',
  '..o..........o..',
  '..o..........o..',
]

/** The chair. Adjustable in four directions, adjusted in none. */
export const CHAIR: Rows = [
  '................',
  '.....######.....',
  '....#cccccc#....',
  '....#cCCCCc#....',
  '....#cccccc#....',
  '....#cCCCCc#....',
  '....#cccccc#....',
  '.....######.....',
  '...##########...',
  '...#cccccccc#...',
  '...##########...',
  '.......##.......',
  '.......##.......',
  '....##########..',
  '...o..o..o..o...',
  '................',
]

/** Two desks facing each other. Nobody has ever made eye contact across them. */
export const DESK_PAIR: Rows = [
  '................',
  '..############..',
  '..#mmmmmmmmmm#..',
  '..#MMMMMMMMMM#..',
  '..############..',
  '..#o........o#..',
  '..#o........o#..',
  '................',
  '..############..',
  '..#mmmmmmmmmm#..',
  '..#MMMMMMMMMM#..',
  '..############..',
  '..#o........o#..',
  '..#o........o#..',
  '................',
  '................',
]

// ─────────────────────────────────────────────────────────────── the machines

/** Photocopier. There is a sign on it. The sign has been there a long time. */
export const PHOTOCOPIER: Rows = [
  '................',
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#WppppppppW#..',
  '..############..',
  '.##############.',
  '.#WWWWWWWWWWWW#.',
  '.#W#yy#WW#rr#W#.',
  '.#WWWWWWWWWWWW#.',
  '.#W##########W#.',
  '.#W#pppppppp#W#.',
  '.#W##########W#.',
  '.#WWWWWWWWWWWW#.',
  '.##############.',
  '..o..........o..',
  '................',
]

/** Fridge. Communal. There is a labelled lunch in it from before the reorg. */
export const FRIDGE: Rows = [
  '.##############.',
  '.#WWWWWWWWWWWW#.',
  '.#WWWWWWWWWWWo#.',
  '.#WWWWWWWWWWWo#.',
  '.#WWWWWWWWWWWo#.',
  '.##############.',
  '.#WWWWWWWWWWWW#.',
  '.#WWWWWWWWWWWo#.',
  '.#WpppWWWWWWWo#.',
  '.#WpyyWWWWWWWo#.',
  '.#WpppWWWWWWWo#.',
  '.#WWWWWWWWWWWW#.',
  '.#WWWWWWWWWWWW#.',
  '.##############.',
  '..o..........o..',
  '................',
]

/** Water dispenser. The genuine centre of institutional knowledge. */
export const WATER_DISPENSER: Rows = [
  '....########....',
  '....#eeeeee#....',
  '....#eGGGGe#....',
  '....#eGGGGe#....',
  '....#eeeeee#....',
  '....########....',
  '...##########...',
  '...#WWWWWWWW#...',
  '...#W#cc#cc#W...',
  '...#WWWWWWWW#...',
  '...#WWWWWWWW#...',
  '...#WW#pp#WW#...',
  '...#WWWWWWWW#...',
  '..############..',
  '..o..........o..',
  '................',
]

/** Coffee machine. Descaled once, in 2019, by someone who has since left. */
export const COFFEE: Rows = [
  '................',
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#W#oooooo#W#..',
  '..#W#mmmmmm#W#..',
  '..#W#oooooo#W#..',
  '..#WWWWWWWWWW#..',
  '..#WW#rr#yy#W#..',
  '..#WWWWWWWWWW#..',
  '..#WW######WW#..',
  '..#WW#pppp#WW#..',
  '..#WW######WW#..',
  '..############..',
  '...#oooooooo#...',
  '................',
  '................',
]

/** Vending machine. Row E has been stuck since the summer. */
export const VENDING: Rows = [
  '.##############.',
  '.#WWWWWWWWWWWW#.',
  '.#W##########W#.',
  '.#W#cc#mm#cc#W#.',
  '.#W##########W#.',
  '.#W#mm#cc#mm#W#.',
  '.#W##########W#.',
  '.#W#cc#mm#cc#W#.',
  '.#W##########W#.',
  '.#W#mm#cc#mm#W#.',
  '.#W##########W#.',
  '.#WWW#yyyy#WWW#.',
  '.#WWWWWWWWWWWW#.',
  '.##############.',
  '..o..........o..',
  '................',
]

/** Shredder. The only machine on this floor that has never once jammed. */
export const SHREDDER: Rows = [
  '................',
  '................',
  '...##########...',
  '...#pppppppp#...',
  '...##########...',
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#oooooooooo#..',
  '..#WWWWWWWWWW#..',
  '..#W#rr#WWWWW#..',
  '..############..',
  '..#pppppppppp#..',
  '..#WWWWWWWWWW#..',
  '..############..',
  '..o..........o..',
  '................',
]

/** Server rack. Nobody knows what half of it does. Nobody will turn it off. */
export const SERVER_RACK: Rows = [
  '.##############.',
  '.#oooooooooooo#.',
  '.#o##########o#.',
  '.#o#GGGGGGGG#o#.',
  '.#o##########o#.',
  '.#o#GGGGGGGG#o#.',
  '.#o##########o#.',
  '.#o#rrGGGGGG#o#.',
  '.#o##########o#.',
  '.#o#GGGGGGGG#o#.',
  '.#o##########o#.',
  '.#o#GGGGrrGG#o#.',
  '.#o##########o#.',
  '.##############.',
  '..o..........o..',
  '................',
]

/** Fax machine. Retained for one supplier who will not move off it. */
export const FAX: Rows = [
  '................',
  '................',
  '....########....',
  '....#pppppp#....',
  '..############..',
  '..#WWWWWWWWWW#..',
  '..#W#oooooo#W#..',
  '..#WWWWWWWWWW#..',
  '..#W#yy#WWWWW#..',
  '..############..',
  '...#pppppppp#...',
  '...##########...',
  '................',
  '................',
  '................',
  '................',
]

// ──────────────────────────────────────────────────────────────── storage

export const FILING_CABINET: Rows = [
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
  '..o..........o..',
  '................',
]

export const BOOKSHELF: Rows = [
  '.##############.',
  '.#mCmcmCmcmCmm#.',
  '.#mCmcmCmcmCmm#.',
  '.##############.',
  '.#cmCmmcmCmcmm#.',
  '.#cmCmmcmCmcmm#.',
  '.##############.',
  '.#mmcmCmmcmCmm#.',
  '.#mmcmCmmcmCmm#.',
  '.##############.',
  '.#Cmcmmcmmcmcm#.',
  '.#Cmcmmcmmcmcm#.',
  '.##############.',
  '..o..........o..',
  '................',
  '................',
]

/** Pigeonholes. Three of them have post in from people who no longer work here. */
export const PIGEONHOLES: Rows = [
  '.##############.',
  '.#o##o##o##o##o.',
  '.#pp#pp#pp#pp##.',
  '.#o##o##o##o##o.',
  '.##############.',
  '.#o##o##o##o##o.',
  '.#pp#pp#pp#pp##.',
  '.#o##o##o##o##o.',
  '.##############.',
  '.#o##o##o##o##o.',
  '.#pp#pp#pp#pp##.',
  '.#o##o##o##o##o.',
  '.##############.',
  '..o..........o..',
  '................',
  '................',
]

/** In-tray. Three deep. The bottom one is load-bearing. */
export const IN_TRAY: Rows = [
  '................',
  '................',
  '................',
  '...##########...',
  '...#pppppppp#...',
  '...##########...',
  '..############..',
  '..#pppppppppp#..',
  '..############..',
  '.##############.',
  '.#pppppppppppp#.',
  '.#pPPPPPPPPPPp#.',
  '.##############.',
  '................',
  '................',
  '................',
]

// ──────────────────────────────────────────────────────────── wall fittings

/** Noticeboard. Fire drill notice, a rota, and a thank-you card. */
export const NOTICEBOARD: Rows = [
  '.##############.',
  '.#MMMMMMMMMMMM#.',
  '.#M##M###M##MM#.',
  '.#M#p#M#p#M#pM#.',
  '.#M#p#M#p#M#pM#.',
  '.#M##M###M##MM#.',
  '.#MMMMMMMMMMMM#.',
  '.#M###M##M####M.',
  '.#M#y#M#pM#ppM#.',
  '.#M#y#M#pM#ppM#.',
  '.#M###M##M####M.',
  '.#MMMMMMMMMMMM#.',
  '.##############.',
  '................',
  '................',
  '................',
]

/** Wall clock. Two minutes fast, deliberately, by someone long gone. */
export const CLOCK: Rows = [
  '................',
  '....########....',
  '...#pppppppp#...',
  '..#pppppppppp#..',
  '..#ppp#pppppp#..',
  '..#ppp#pppppp#..',
  '..#pppo#ppppp#..',
  '..#pppppppppp#..',
  '..#pppppppppp#..',
  '...#pppppppp#...',
  '....########....',
  '................',
  '................',
  '................',
  '................',
  '................',
]

export const FIRE_EXTINGUISHER: Rows = [
  '................',
  '................',
  '......####......',
  '......#oo#......',
  '.....######.....',
  '....#rrrrrr#....',
  '....#rRRRRr#....',
  '....#rrrrrr#....',
  '....#rpppp r....',
  '....#rrrrrr#....',
  '....#rRRRRr#....',
  '....#rrrrrr#....',
  '.....######.....',
  '................',
  '................',
  '................',
]

/** Recycling. Contaminated, according to a notice above it. */
export const BIN: Rows = [
  '................',
  '................',
  '................',
  '...##########...',
  '...#oooooooo#...',
  '...##########...',
  '...#cccccccc#...',
  '...#cCcccCcc#...',
  '...#cccccccc#...',
  '...#cCcccCcc#...',
  '...#cccccccc#...',
  '....########....',
  '................',
  '................',
  '................',
  '................',
]

export const PLANT_BIG: Rows = [
  '.......n........',
  '....n..n..n.....',
  '...nNn.n.nNn....',
  '....nNnnnNn.....',
  '..n..nNnNn..n...',
  '..nNn.nNn.nNn...',
  '...nNnnNnnnNn...',
  '.....nnNnnn.....',
  '.......n........',
  '.....######.....',
  '.....#cccc#.....',
  '.....#cCCc#.....',
  '.....#cccc#.....',
  '......####......',
  '................',
  '................',
]

/** Breakout sofa. Nobody has ever broken out. */
export const SOFA: Rows = [
  '................',
  '................',
  '.##############.',
  '.#cccccccccccc#.',
  '.#cCcccccccCcc#.',
  '.##############.',
  '.#cc##cccc##cc#.',
  '.#cc#cccccc#cc#.',
  '.#cc#cCccCc#cc#.',
  '.#cc########cc#.',
  '.##############.',
  '..o..........o..',
  '..o..........o..',
  '................',
  '................',
  '................',
]

/** Meeting table. Booked. Empty. Booked. */
export const MEETING_TABLE: Rows = [
  '................',
  '.....######.....',
  '....########....',
  '.##############.',
  '.#mmmmmmmmmmmm#.',
  '.#mMMMMMMMMMMm#.',
  '.#mmmmmmmmmmmm#.',
  '.##############.',
  '....########....',
  '.....######.....',
  '.......##.......',
  '.......##.......',
  '....##########..',
  '...o........o...',
  '................',
  '................',
]

/** Time clock. Nobody uses it. Nobody has removed it. */
export const TIME_CLOCK: Rows = [
  '................',
  '................',
  '...##########...',
  '...#WWWWWWWW#...',
  '...#W######W#...',
  '...#W#GGGG#W#...',
  '...#W#GooG#W#...',
  '...#W######W#...',
  '...#WWWWWWWW#...',
  '...#W#pppp#W#...',
  '...#WWWWWWWW#...',
  '...##########...',
  '................',
  '................',
  '................',
  '................',
]

export const FIRST_AID: Rows = [
  '................',
  '................',
  '...##########...',
  '...#pppppppp#...',
  '...#pp#rr#pp#...',
  '...#p#rrrr#p#...',
  '...#p#rrrr#p#...',
  '...#pp#rr#pp#...',
  '...#pppppppp#...',
  '...##########...',
  '.....o##o.......',
  '................',
  '................',
  '................',
  '................',
  '................',
]

export const OFFICE_SPRITES: Record<string, Rows> = {
  part_h: PART_H,
  part_v: PART_V,
  part_corner: PART_CORNER,
  desk_crt: DESK_CRT,
  chair: CHAIR,
  desk_pair: DESK_PAIR,
  photocopier: PHOTOCOPIER,
  fridge: FRIDGE,
  water_dispenser: WATER_DISPENSER,
  coffee: COFFEE,
  vending: VENDING,
  shredder: SHREDDER,
  server_rack: SERVER_RACK,
  fax: FAX,
  filing_cabinet: FILING_CABINET,
  bookshelf: BOOKSHELF,
  pigeonholes: PIGEONHOLES,
  in_tray: IN_TRAY,
  noticeboard: NOTICEBOARD,
  clock: CLOCK,
  fire_extinguisher: FIRE_EXTINGUISHER,
  bin: BIN,
  plant_big: PLANT_BIG,
  sofa: SOFA,
  meeting_table: MEETING_TABLE,
  time_clock: TIME_CLOCK,
  first_aid: FIRST_AID,
}
