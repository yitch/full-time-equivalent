import { TECH, canUnlock } from '@fte/shared'
import type { GameState, TechId } from '@fte/shared'

const BRANCH_LABELS: Record<string, string> = {
  tier0: 'TIER 0 — DEFLECTION',
  casemgmt: 'TIER 1 — CASE MANAGEMENT',
  integration: 'INTEGRATION',
  culture: 'CULTURE',
}

/**
 * The Steering Committee. Priced in Social Capital, which is earned by resolving
 * things well rather than by resolving many things — so a player who brute-forces
 * arrives here with nothing to spend, which is the entire point.
 */
export function TechTree({
  state,
  onUnlock,
  onClose,
}: {
  state: GameState
  onUnlock: (tech: TechId) => void
  onClose: () => void
}) {
  const branches = ['tier0', 'casemgmt', 'integration', 'culture'] as const

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h1>STEERING COMMITTEE</h1>
        <p style={{ color: 'var(--paper-dim)' }}>
          You have <b style={{ color: 'var(--social)' }}>{Math.round(state.socialCapital)}</b> Social Capital.
          The CFO is holding a coffee and looking at the clock.
        </p>

        {branches.map((branch) => (
          <div className="branch" key={branch}>
            <h3>{BRANCH_LABELS[branch]}</h3>
            <div className="branch-row">
              {Object.values(TECH)
                .filter((node) => node.branch === branch)
                .sort((a, b) => a.col - b.col)
                .map((node) => {
                  const owned = state.unlocked.includes(node.id)
                  const check = canUnlock(node.id, state.unlocked, state.socialCapital)
                  const locked = !owned && !check.ok
                  const affordable = !owned && check.ok
                  return (
                    <button
                      key={node.id}
                      className={`tech${owned ? ' owned' : ''}${locked ? ' locked' : ''}${affordable ? ' affordable' : ''}`}
                      disabled={locked || owned}
                      title={owned ? 'Delivered.' : (check.reason ?? 'Make the case.')}
                      onClick={() => onUnlock(node.id)}
                    >
                      <div className="tn">{node.name}</div>
                      <div className="tf">{node.flavour}</div>
                      <div className="tc">
                        {owned ? '✓ DELIVERED' : locked ? (check.reason ?? 'BLOCKED') : `${node.cost} SC`}
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        ))}

        <button className="chunky ghost" onClick={onClose}>
          CLOSE (TAB)
        </button>
      </div>
    </div>
  )
}
