/**
 * Headless balance report.
 *
 * Runs the whole campaign with the scripted bot and prints a per-wave table.
 * This is how you tune numbers without opening a browser, and it is the fastest
 * way for a fresh agent to tell whether a content change made the game harder or
 * merely different. Run it with `npm run balance [seed]`.
 */
import { TECH_IDS, WAVES } from '../content/index.js'
import type { GameState } from '../types.js'
import { playRun } from './bot.js'

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width)
}

export function report(seed: number): void {
  console.log('\nFULL-TIME EQUIVALENT — balance run, seed', seed)
  console.log(
    pad('WAVE', 6),
    pad('NAME', 30),
    pad('MORALE', 8),
    pad('COMPL', 7),
    pad('SC', 6),
    pad('BUDGET', 8),
    pad('RESOLVED', 10),
    pad('BREACH', 8),
    pad('DEFL', 6),
    pad('ESC', 5),
    pad('SLA', 6),
    'TOWER DMG',
  )
  console.log('-'.repeat(116))

  let prevTower = 0
  let prevPlayer = 0

  const onWave = (state: GameState) => {
    const wave = WAVES[Math.max(0, state.waveIndex - 1)]
    const towerDelta = state.stats.damageByTowers - prevTower
    const playerDelta = state.stats.damageByPlayers - prevPlayer
    console.log(
      pad(state.waveIndex, 6),
      pad((wave?.name ?? '—').slice(0, 29), 30),
      pad(Math.round(state.morale), 8),
      pad(Math.round(state.compliance), 7),
      pad(Math.round(state.socialCapital), 6),
      pad(Math.round(state.budget), 8),
      pad(state.stats.resolved, 10),
      pad(state.stats.breached, 8),
      pad(state.stats.deflected, 6),
      pad(state.stats.escalations, 5),
      pad(`${Math.round(state.stats.slaCompliance * 100)}%`, 6),
      `${Math.round((towerDelta / Math.max(1, towerDelta + playerDelta)) * 100)}%`,
    )
    prevTower = state.stats.damageByTowers
    prevPlayer = state.stats.damageByPlayers
  }

  const { state, towerDamageShare } = playRun(seed, undefined, { onWave })

  console.log('-'.repeat(116))
  console.log(
    `DAMAGE: towers ${Math.round(state.stats.damageByTowers)} · players ${Math.round(state.stats.damageByPlayers)} · ` +
      `towers did ${Math.round(towerDamageShare * 100)}% of the work`,
  )
  console.log(
    `RESULT: ${state.phase.toUpperCase()} at wave ${state.waveIndex + 1}/${WAVES.length} · ` +
      `morale ${Math.round(state.morale)} · compliance ${Math.round(state.compliance)} · ` +
      `SLA ${Math.round(state.stats.slaCompliance * 100)}% · unlocked ${state.unlocked.length}/${TECH_IDS.length}`,
  )
  console.log()
}

report(Number(process.argv[2] ?? 20260819))
