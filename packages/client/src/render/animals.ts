/**
 * The fourteen dangerous animals, as pixel art.
 *
 * Each animal is a 14×9 head composed onto a shared 14×9 body, giving a 14×18
 * sprite. Sharing the body is deliberate: they all work here, they all wear the
 * same lanyard, and the only thing distinguishing them is the head — which is
 * both cheaper to author and a better joke.
 *
 * Character key (see pixels.ts for the shared map):
 *   c/C  instance accent and its darker tone
 *   o    outline (never pure black)
 *   p/P  paper and its shadow
 *   m/M  manila and its darker tone
 *   .    transparent
 */

export type Rows = string[]

/** 14×9. Shared by every playable animal. Arms out, lanyard on. */
const BODY: Rows = [
  '....o####o....',
  '...#cccccc#...',
  '..#cccccccc#..',
  '.sc#cccccc#cs.',
  '.sc#cpPPpc#cs.',
  '.so#cpPPpc#os.',
  '..#cCccccCc#..',
  '..#oo#..#oo#..',
  '..ooo....ooo..',
]

/** 14×9. Stakeholders wear the same face and a much better suit. */
const SUIT: Rows = [
  '....o####o....',
  '...#WWWWWW#...',
  '..#WWpppWWW#..',
  '.sW#WpyypW#Ws.',
  '.sW#WpyypW#Ws.',
  '.so#WWyyWW#os.',
  '..#WwWWWWwW#..',
  '..#oo#..#oo#..',
  '..ooo....ooo..',
]

/** Head plates, 14×9 each. The silhouette does all the work at this size. */
const HEADS: Record<string, Rows> = {
  // Wide muzzle, tiny ears, entirely unbothered.
  hippo: [
    '..o........o..',
    '.ogo......ogo.',
    '..gggggggggg..',
    '.gggggggggggg.',
    '.ggogggggoggg.',
    '.gggggggggggg.',
    '.ggGGGGGGGGgg.',
    '.gGGoGGGGoGGg.',
    '..gGGGGGGGGg..',
  ],
  // Stripes, mane, long confident face.
  zebra: [
    '...o......o...',
    '..opo....opo..',
    '..pppoooppp...',
    '..popopopopp..',
    '..pppppppppp..',
    '..popoppopop..',
    '...pppppppp...',
    '...poppppop...',
    '....pppppp....',
  ],
  // Pointed ears, narrow snout, already looking at the next thing.
  wolf: [
    '..o........o..',
    '.owo......owo.',
    '.owwo....owwo.',
    '..wwwwwwwwww..',
    '..wwowwwwoww..',
    '..wwwwwwwwww..',
    '...wwWWWWww...',
    '...wwoWWoww...',
    '....wwWWww....',
  ],
  // The horn is the silhouette. Nothing else needs to read.
  rhino: [
    '.......m......',
    '......mm......',
    '....aamma.....',
    '..aaaaaaaaa...',
    '.aaaaaaaaaaa..',
    '.aaoaaaaaoaa..',
    '.aaaaaaaaaaa..',
    '..aaAAAAAaa...',
    '...aaaaaaa....',
  ],
  // White head, orange beak, permanently mid-departure.
  seagull: [
    '....pppppp....',
    '...pppppppp...',
    '..pppppppppp..',
    '..ppopppoppp..',
    '..pppppppppp..',
    '...ppppppmmmm.',
    '....pppppmm...',
    '.....pppp.....',
    '.....pppp.....',
  ],
  // Long neck. Estimating something, badly, from a distance.
  goose: [
    '.....pppp.....',
    '....pppppp....',
    '....popppo....',
    '....pppppp....',
    '....ppppmmmm..',
    '.....pppp.....',
    '.....pppp.....',
    '.....pppp.....',
    '.....pppp.....',
  ],
  // The beak is enormous and so is the roadmap.
  puffin: [
    '....oooooo....',
    '...oooooooo...',
    '..oopppppoo...',
    '..oopoppooo...',
    '..oppppppoo...',
    '..pppmmmmmm...',
    '..pppmMmMmm...',
    '...ppmmmmm....',
    '....oooo......',
  ],
  // Sleek, quick, running entirely on instinct.
  puma: [
    '..o........o..',
    '.oMo......oMo.',
    '.oMMo....oMMo.',
    '..MMMMMMMMMM..',
    '..MMoMMMMoMM..',
    '..MMMMMMMMMM..',
    '...MMmmmmMM...',
    '...MMommoMM...',
    '....MMmmMM....',
  ],
  // The hood is up. It has been up since 2016.
  cobra: [
    '..cccccccccc..',
    '.cccccccccccc.',
    '.ccocccccocc..',
    '.cccccccccccc.',
    '..cccccccccc..',
    '...cccccccc...',
    '....coooc.....',
    '....cpppc.....',
    '.....cccc.....',
  ],
  // Horns, shag, and a dashboard nobody opens.
  yak: [
    '.m..........m.',
    '.mm........mm.',
    '..mmMMMMMMmm..',
    '..MMMMMMMMMM..',
    '..MMoMMMMoMM..',
    '..MMMMMMMMMM..',
    '...MMMMMMMM...',
    '...MMooooMM...',
    '....MMMMMM....',
  ],
  // Ears for receiving requirements, none for asking why.
  donkey: [
    '..t........t..',
    '..tt......tt..',
    '..tt......tt..',
    '..tttttttttt..',
    '..ttottttott..',
    '..tttttttttt..',
    '...tttttttt...',
    '...ttoooott...',
    '....tttttt....',
  ],
  // Enormous ears, no opinions.
  mouse: [
    '.PPP......PPP.',
    'PPPPP....PPPPP',
    'PPPPP....PPPPP',
    '.PPPPPPPPPPPP.',
    '..PPoPPPPoPP..',
    '..PPPPPPPPPP..',
    '...PPPmmPPP...',
    '....PPooPP....',
    '.....PPPP.....',
  ],
  // Narrow, patient, keeping notes.
  viper: [
    '....RRRRRR....',
    '...RRRRRRRR...',
    '..RRoRRRRoRR..',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '...RRRRRRRR...',
    '....RRRRRR....',
    '....pRRRRp....',
    '.....RRRR.....',
  ],
  // Round, hooked, and completely certain about 2009.
  dodo: [
    '.....bbbb.....',
    '....bbbbbb....',
    '...bbbbbbbb...',
    '...bbobbbobb..',
    '...bbbbbbbbm..',
    '...bbbbbbmmm..',
    '....bbbbmmm...',
    '.....bbbb.....',
    '.....bbbb.....',
  ],
}

export const ANIMAL_IDS = Object.keys(HEADS)

function compose(head: Rows, body: Rows): Rows {
  return [...head, ...body]
}

/** 14×18 playable-hero sprites, one per animal. */
export const ANIMAL_PC: Record<string, Rows> = Object.fromEntries(
  ANIMAL_IDS.map((id) => [id, compose(HEADS[id]!, BODY)]),
)

/** 14×18 Stakeholder sprites: same animal, better suit, worse intentions. */
export const ANIMAL_STAKEHOLDER: Record<string, Rows> = Object.fromEntries(
  ANIMAL_IDS.map((id) => [id, compose(HEADS[id]!, SUIT)]),
)
