import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { accountXpToNext, animalsUnlockedAt, emptyProfile } from '@fte/shared'
import type { GameState, Player, Profile } from '@fte/shared'

/**
 * Profile persistence.
 *
 * Deliberately a single JSON file and no accounts: the profile id is a random
 * string the browser keeps in localStorage. That is enough to make progression
 * feel permanent without asking anyone to sign up for a tower defence about
 * expense claims.
 */
const DATA_DIR = process.env.FTE_DATA_DIR ?? join(process.cwd(), '.data')
const FILE = join(DATA_DIR, 'profiles.json')

let cache: Record<string, Profile> | null = null

function load(): Record<string, Profile> {
  if (cache) return cache
  try {
    if (existsSync(FILE)) {
      cache = JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, Profile>
      return cache
    }
  } catch (error) {
    console.warn('[profiles] could not read store, starting fresh:', error)
  }
  cache = {}
  return cache
}

let writeQueued = false
function persist(): void {
  // Coalesce writes: a busy room would otherwise hit the disk every wave end.
  if (writeQueued) return
  writeQueued = true
  setTimeout(() => {
    writeQueued = false
    try {
      mkdirSync(dirname(FILE), { recursive: true })
      writeFileSync(FILE, JSON.stringify(cache ?? {}, null, 2))
    } catch (error) {
      console.warn('[profiles] could not write store:', error)
    }
  }, 400)
}

export function getProfile(id: string, name: string): Profile {
  const store = load()
  const existing = store[id]
  if (existing) {
    existing.name = name || existing.name
    return existing
  }
  const fresh = emptyProfile(id, name)
  store[id] = fresh
  persist()
  return fresh
}

export function saveProfile(profile: Profile): void {
  const store = load()
  store[profile.id] = profile
  persist()
}

/**
 * Folds a finished (or abandoned) run into the persistent profile: account XP,
 * the animal's own level, the stash, and records. Called once per player when a
 * run ends or they disconnect.
 */
export function bankRun(state: GameState, player: Player): Profile | null {
  if (!player.profileId) return null
  const profile = getProfile(player.profileId, player.name)

  const earned =
    player.stats.kills * 4 +
    player.stats.stakeholdersManaged * 60 +
    state.waveIndex * 120 +
    (state.phase === 'victory' ? 900 : 0)

  profile.accountXp += earned
  while (profile.accountXp >= accountXpToNext(profile.accountLevel)) {
    profile.accountXp -= accountXpToNext(profile.accountLevel)
    profile.accountLevel++
  }

  if (player.role) {
    const previous = profile.animalLevels[player.role] ?? 1
    profile.animalLevels[player.role] = Math.max(previous, player.hero.level)
  }

  // Keep the best twenty items. A stash is a highlight reel, not a warehouse.
  const combined = [
    ...profile.stash,
    ...player.hero.bag,
    ...Object.values(player.hero.equipment).filter((a): a is NonNullable<typeof a> => !!a),
  ]
  const seen = new Set<string>()
  profile.stash = combined
    .filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)))
    .sort((a, b) => b.ilvl - a.ilvl)
    .slice(0, 20)

  profile.records.runs++
  profile.records.bestWave = Math.max(profile.records.bestWave, state.waveIndex + 1)
  profile.records.stakeholdersManaged += player.stats.stakeholdersManaged
  if (state.phase === 'victory') profile.records.victories++

  // Unlock rules live in shared content so the lobby can tell the player exactly
  // which level opens which animal, using the same table the server applies.
  for (const animal of animalsUnlockedAt(profile.accountLevel)) {
    if (!profile.unlocked.includes(animal)) profile.unlocked.push(animal)
  }

  saveProfile(profile)
  return profile
}
