import { DT, TICK_HZ } from '../constants.js'
import { ARTIFACT_BASES } from '../content/index.js'
import { createRng, pick } from '../rng.js'
import type { GameState, InternEntity, Player, RequestEntity } from '../types.js'
import { strike } from './heroes.js'
import { pushLog } from './state.js'

/**
 * Interns.
 *
 * A follower who trails you around the floor and helps, at roughly the level you
 * would expect. They can be knocked out, at which point the placement is briefly
 * suspended and they come back — because nothing that happens to an intern is
 * ever formally anybody's responsibility.
 */

/** Tiles behind the owner the intern tries to hold. */
const FOLLOW_DISTANCE = 1.6
const INTERN_REACH = 3.2
const INTERN_BASE_DAMAGE = 7
const INTERN_BASE_HP = 60
/** Seconds out of action after being knocked down. */
const PLACEMENT_SUSPENDED = 18

const FIRST_NAMES = [
  'Alex',
  'Priya',
  'Sam',
  'Tomas',
  'Nia',
  'Joon',
  'Ruth',
  'Kwame',
  'Ines',
  'Bo',
  'Marta',
  'Femi',
]

function internName(state: GameState): string {
  const rng = createRng(state.rngState)
  const name = pick(rng, FIRST_NAMES)
  state.rngState = rng.state
  return name
}

/** Power scales with the intern item and the owner's internPower stat. */
function internPower(player: Player): number {
  return Math.max(0.4, player.hero.stats.internPower)
}

/**
 * Reconciles interns against equipment. Called every tick, so equipping or
 * losing an intern item takes effect immediately without anyone remembering to
 * spawn or despawn one by hand.
 */
export function syncInterns(state: GameState): void {
  const keep: InternEntity[] = []

  for (const player of Object.values(state.players)) {
    if (!player.connected) continue
    const item = player.hero.equipment.intern
    const existing = state.interns.find((i) => i.ownerId === player.id)

    if (!item) continue

    if (existing && existing.artifactId === item.id) {
      keep.push(existing)
      continue
    }

    const base = ARTIFACT_BASES.find((b) => b.id === item.base)
    const name = internName(state)
    const maxHp = Math.round(INTERN_BASE_HP * internPower(player))
    keep.push({
      id: state.nextEntityId++,
      ownerId: player.id,
      artifactId: item.id,
      pos: { ...player.pos },
      hp: maxHp,
      maxHp,
      attackCooldown: 0,
      outTicks: 0,
      name,
    })
    pushLog(state, `${name} has started their placement with ${player.name}. ${base?.name ?? 'Intern'}.`)
    state.events.push({ kind: 'bark', at: { ...player.pos }, text: `hi, I'm ${name}!`, playerId: player.id })
  }

  state.interns = keep
}

export function stepInterns(state: GameState): void {
  for (const intern of state.interns) {
    const owner = state.players[intern.ownerId]
    if (!owner || !owner.connected) continue

    if (intern.outTicks > 0) {
      intern.outTicks--
      if (intern.outTicks === 0) {
        intern.hp = intern.maxHp
        intern.pos = { ...owner.pos }
        state.events.push({ kind: 'revived', at: { ...intern.pos }, text: `${intern.name} is back` })
      }
      continue
    }

    // Follow, but not so closely that they stand on top of you.
    const dx = owner.pos.x - intern.pos.x
    const dy = owner.pos.y - intern.pos.y
    const distance = Math.hypot(dx, dy)
    if (distance > FOLLOW_DISTANCE) {
      const speed = Math.max(4, owner.hero.stats.moveSpeed * 0.95)
      intern.pos.x += (dx / distance) * speed * DT
      intern.pos.y += (dy / distance) * speed * DT
    }

    if (state.phase !== 'wave') continue

    if (intern.attackCooldown > 0) {
      intern.attackCooldown--
      continue
    }

    let best: RequestEntity | null = null
    let bestD = Infinity
    for (const req of state.requests) {
      if (req.hp <= 0 || !req.revealed) continue
      const d = Math.hypot(req.pos.x - intern.pos.x, req.pos.y - intern.pos.y)
      if (d < bestD && d <= INTERN_REACH) {
        bestD = d
        best = req
      }
    }
    if (!best) continue

    intern.attackCooldown = Math.round(TICK_HZ / 1.2)
    // Credited to the owner, so kills, XP and the owner's passive all apply.
    strike(state, owner, best, INTERN_BASE_DAMAGE * internPower(owner))
  }
}

/** Splash and contact damage can catch an intern. They are not made of much. */
export function damageIntern(state: GameState, intern: InternEntity, amount: number): void {
  if (intern.outTicks > 0) return
  intern.hp -= amount
  if (intern.hp > 0) return
  intern.hp = 0
  intern.outTicks = Math.round(PLACEMENT_SUSPENDED * TICK_HZ)
  pushLog(state, `${intern.name} has been sent home early. They will be back.`)
  state.events.push({ kind: 'downed', at: { ...intern.pos }, text: `${intern.name} is having a moment` })
}
