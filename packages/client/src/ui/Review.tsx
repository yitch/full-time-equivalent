import { PERK_BY_ID } from '@fte/shared'
import type { GameState, PlayerId } from '@fte/shared'
import { Icon } from './Icon.js'

/**
 * The performance review.
 *
 * Held at the end of every wave, guarantees a level, and offers three
 * development opportunities of which you may select one. It is a modal on
 * purpose: a level that can be missed is a level that will be missed, and the
 * whole reason this exists is that a player reached wave five without noticing
 * they had been levelling the entire time.
 */
export function Review({
  state,
  localPlayerId,
  onPick,
}: {
  state: GameState
  localPlayerId: PlayerId | null
  onPick: (perk: string) => void
}) {
  const player = localPlayerId ? state.players[localPlayerId] : null
  if (!player?.role) return null
  const hero = player.hero
  if (hero.pendingPerks.length === 0) return null

  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 720 }}>
        <h2>PERFORMANCE REVIEW</h2>
        <h1>You are now level {hero.level}</h1>
        <p>
          Your line manager has identified three development opportunities. You may select one. This is a
          two-way conversation and there is no wrong answer, provided you select one.
        </p>

        <div className="review-cards">
          {hero.pendingPerks.map((id) => {
            const perk = PERK_BY_ID[id]
            if (!perk) return null
            return (
              <button className="review-card" key={id} onClick={() => onPick(id)}>
                <div className="rh">
                  <Icon name={perk.icon} size={12} colour="var(--social)" />
                  <span className="rn">{perk.name}</span>
                </div>
                <div className="rfl">{perk.flavour}</div>
                <div className="ref">{perk.effect}</div>
              </button>
            )
          })}
        </div>

        <p className="teaches">
          You also have {hero.talentPoints} unspent talent point{hero.talentPoints === 1 ? '' : 's'}. Press{' '}
          <b>C</b> to spend {hero.talentPoints === 1 ? 'it' : 'them'} on your class tree — they do nothing
          sitting there.
        </p>
      </div>
    </div>
  )
}
