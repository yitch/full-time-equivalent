/**
 * Pixel icons, drawn as SVG rects.
 *
 * Same discipline as the sprites: the art is a text block, so it diffs cleanly
 * and any agent can edit one. SVG rather than canvas because these sit in the
 * HUD next to text, need to inherit colour, and must stay crisp at any zoom.
 *
 * Every grid is 9x9. Odd so there is a true centre to build symmetry around.
 */

const ICONS: Record<string, string[]> = {
  // ── resources ──────────────────────────────────────────────────────────
  morale: [
    '.xx...xx.',
    'xxxx.xxxx',
    'xxxxxxxxx',
    'xxxxxxxxx',
    '.xxxxxxx.',
    '..xxxxx..',
    '...xxx...',
    '....x....',
    '.........',
  ],
  compliance: [
    '..xxxxx..',
    '.xxxxxxx.',
    'xxx...xxx',
    'xx.xxx.xx',
    'xx.xxx.xx',
    '.xx...xx.',
    '..xxxxx..',
    '...xxx...',
    '....x....',
  ],
  budget: [
    '.........',
    'xxxxxxxxx',
    'x.......x',
    'x..xxx..x',
    'x..x.x..x',
    'x..xxx..x',
    'x.......x',
    'xxxxxxxxx',
    '.........',
  ],
  social: [
    '....x....',
    '....x....',
    '.xx.x.xx.',
    '..xxxxx..',
    'xxxxxxxxx',
    '..xxxxx..',
    '.xx.x.xx.',
    '....x....',
    '....x....',
  ],
  sla: [
    '..xxxxx..',
    '.x.....x.',
    'x...x...x',
    'x...x...x',
    'x...xxx.x',
    'x.......x',
    'x.......x',
    '.x.....x.',
    '..xxxxx..',
  ],
  headcount: [
    '...xxx...',
    '...xxx...',
    '.........',
    '..xxxxx..',
    '.xxxxxxx.',
    'xxxxxxxxx',
    '..xx.xx..',
    '..xx.xx..',
    '..xx.xx..',
  ],

  // ── damage channels ────────────────────────────────────────────────────
  automation: [
    '.x.....x.',
    '.xx.x.xx.',
    '..xxxxx..',
    '.xxx.xxx.',
    'xxx...xxx',
    '.xxx.xxx.',
    '..xxxxx..',
    '.xx.x.xx.',
    '.x.....x.',
  ],
  process: [
    'xx.....xx',
    'xx.....xx',
    '.x.....x.',
    '.xxxxxxx.',
    '....x....',
    '....x....',
    '...xxx...',
    '...xxx...',
    '.........',
  ],
  human: [
    '...xxx...',
    '...xxx...',
    '.........',
    '..xxxxx..',
    '.xxxxxxx.',
    'xxxxxxxxx',
    '..xx.xx..',
    '..xx.xx..',
    '..xx.xx..',
  ],
  specialist: [
    '..xxx....',
    '.x...x...',
    '.x...x...',
    '..xxx....',
    '...x.....',
    '...x.....',
    '...xx....',
    '...x.....',
    '...xx....',
  ],

  // ── what a defence contributes ─────────────────────────────────────────
  deflect: [
    '..xxxxx..',
    '.xxxxxxx.',
    'x.xxxxx.x',
    '..xxxxx..',
    'x..xxx..x',
    '...xxx...',
    'x...x...x',
    '....x....',
    '.........',
  ],
  damage: [
    '....x....',
    '.x..x..x.',
    '..x.x.x..',
    '...xxx...',
    'xxxxxxxxx',
    '...xxx...',
    '..x.x.x..',
    '.x..x..x.',
    '....x....',
  ],
  slow: [
    '.xxxxxxx.',
    '.xxxxxxx.',
    '..xxxxx..',
    '...xxx...',
    '....x....',
    '...xxx...',
    '..xxxxx..',
    '.xxxxxxx.',
    '.xxxxxxx.',
  ],
  track: [
    '....x....',
    '....x....',
    '..xxxxx..',
    '.xx.x.xx.',
    'xx..x..xx',
    '.xx.x.xx.',
    '..xxxxx..',
    '....x....',
    '....x....',
  ],
  prevent: [
    '..xxxxx..',
    '.xx...xx.',
    'xx.....xx',
    'x.......x',
    'xxxxxxxxx',
    'x.......x',
    'xx.....xx',
    '.xx...xx.',
    '..xxxxx..',
  ],
  expense: [
    '.xxxxxxx.',
    '.x.....x.',
    '.xxxxx.x.',
    '.x.....x.',
    '.xxxxx.x.',
    '.x.....x.',
    '.xxx...x.',
    '.x.....x.',
    '.x.x.x.x.',
  ],
  stealth: [
    '.........',
    '..xxxxx..',
    '.xx...xx.',
    'xx.xxx.xx',
    'xx.xxx.xx',
    '.xx...xx.',
    '..xxxxx..',
    '.........',
    '.........',
  ],

  // ── ui ─────────────────────────────────────────────────────────────────
  lock: [
    '..xxxxx..',
    '.xx...xx.',
    '.x.....x.',
    'xxxxxxxxx',
    'xxxxxxxxx',
    'xxx.x.xxx',
    'xxx.x.xxx',
    'xxxxxxxxx',
    '.........',
  ],
  tick: [
    '.........',
    '.......xx',
    '......xx.',
    'x....xx..',
    'xx..xx...',
    '.xxxx....',
    '..xx.....',
    '.........',
    '.........',
  ],
  wave: [
    'x.......x',
    'x.x...x.x',
    'x.x.x.x.x',
    'x.x.x.x.x',
    'x.x.x.x.x',
    'xxx.x.xxx',
    '..x.x.x..',
    '..xxxxx..',
    '.........',
  ],
}

export type IconName = keyof typeof ICONS

export function hasIcon(name: string): boolean {
  return name in ICONS
}

/**
 * Renders a 9x9 pixel icon. Colour defaults to `currentColor`, so an icon inside
 * a coloured meter picks up the meter's colour without being told.
 */
export function Icon({
  name,
  size = 11,
  colour = 'currentColor',
  title,
  className,
}: {
  name: string
  size?: number
  colour?: string
  title?: string
  className?: string
}) {
  const rows = ICONS[name]
  if (!rows) return null
  const rects: React.ReactNode[] = []
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]!
    let run = 0
    for (let x = 0; x <= row.length; x++) {
      if (row[x] === 'x') {
        run++
        continue
      }
      if (run > 0) {
        rects.push(<rect key={`${y}-${x}`} x={x - run} y={y} width={run} height={1} />)
        run = 0
      }
    }
  }
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 9 9"
      fill={colour}
      shapeRendering="crispEdges"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      style={{ flex: '0 0 auto', verticalAlign: '-1px' }}
    >
      {title && <title>{title}</title>}
      {rects}
    </svg>
  )
}
