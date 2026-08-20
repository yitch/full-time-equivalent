import { CONTRIBUTIONS, PALETTE, TECH, TOWERS, canUnlock, pathToTech } from '@fte/shared'
import type { GameState, TechId } from '@fte/shared'
import { useEffect, useRef } from 'react'
import { Icon } from './Icon.js'

const BRANCH_LABELS: Record<string, { name: string; blurb: string }> = {
  tier0: {
    name: 'TIER 0 — DEFLECTION',
    blurb: 'Stop things becoming tickets at all. The cheapest resolution there is.',
  },
  casemgmt: {
    name: 'TIER 1 — CASE MANAGEMENT',
    blurb: 'Track the work. Everything else in the game gets better once things are tracked.',
  },
  integration: {
    name: 'INTEGRATION',
    blurb: 'Make the systems talk. Unlocks the only tower that can touch an Expense Claim.',
  },
  culture: {
    name: 'CULTURE',
    blurb: 'Reduce what arrives in the first place. Invisible, unglamorous, best value in the game.',
  },
}

/**
 * The Steering Committee.
 *
 * Priced in Social Capital, which is earned by resolving things well rather than
 * by resolving many things — so a player who brute-forces arrives here with
 * nothing to spend, which is the entire point.
 *
 * Every locked node states the *whole* remaining chain and its total price. "You
 * need Knowledge Base" is useless if Knowledge Base needs three things you also
 * do not have.
 */
export function TechTree({
  state,
  focus,
  onUnlock,
  onClose,
}: {
  state: GameState
  focus?: TechId | null
  onUnlock: (tech: TechId) => void
  onClose: () => void
}) {
  const branches = ['tier0', 'casemgmt', 'integration', 'culture'] as const
  const focusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focus])

  const focusPath = focus ? pathToTech(focus, state.unlocked) : null
  const onPath = new Set(focusPath?.nodes.map((n) => n.id) ?? [])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel wide" onClick={(e) => e.stopPropagation()}>
        <h1>STEERING COMMITTEE</h1>
        <p style={{ color: 'var(--paper-dim)' }}>
          You have{' '}
          <b style={{ color: 'var(--social)' }}>
            <Icon name="social" size={10} colour={PALETTE.social} /> {Math.round(state.socialCapital)}
          </b>{' '}
          Social Capital. It is earned by resolving things <em>well</em> — inside SLA, at first contact,
          deflected at Tier 0 — and never by resolving more of them. The CFO is holding a coffee and looking
          at the clock.
        </p>

        {focusPath && !focusPath.owned && (
          <p className="focus-note">
            <Icon name="lock" size={10} colour={PALETTE.highlighter} /> To unlock that defence, buy{' '}
            <b>{focusPath.nodes.map((n) => n.name).join(' → ')}</b> — {focusPath.cost} Social Capital in total.
            Highlighted below.
          </p>
        )}

        {branches.map((branch) => (
          <div className="branch" key={branch}>
            <h3>
              {BRANCH_LABELS[branch]!.name}
              <span className="bblurb">{BRANCH_LABELS[branch]!.blurb}</span>
            </h3>
            <div className="branch-row">
              {Object.values(TECH)
                .filter((node) => node.branch === branch)
                .sort((a, b) => a.col - b.col)
                .map((node) => {
                  const owned = state.unlocked.includes(node.id)
                  const check = canUnlock(node.id, state.unlocked, state.socialCapital)
                  const path = pathToTech(node.id, state.unlocked)
                  const blockedByChain = !owned && path.nodes.length > 1
                  const affordable = !owned && check.ok
                  const unlocksTowers = (node.unlocksTowers ?? []).map((t) => TOWERS[t]).filter(Boolean)

                  const title = owned
                    ? 'Delivered.'
                    : blockedByChain
                      ? `Blocked. Whole chain: ${path.nodes.map((n) => n.name).join(' → ')} = ${path.cost} Social Capital.`
                      : (check.reason ?? 'Make the case.')

                  return (
                    <button
                      key={node.id}
                      ref={focus === node.id ? focusRef : undefined}
                      className={[
                        'tech',
                        owned ? 'owned' : '',
                        !owned && blockedByChain ? 'locked' : '',
                        affordable ? 'affordable' : '',
                        onPath.has(node.id) ? 'onpath' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={owned || !check.ok}
                      title={title}
                      onClick={() => onUnlock(node.id)}
                    >
                      <div className="tn">
                        {owned && <Icon name="tick" size={9} colour={PALETTE.tubeGlow} />}
                        {!owned && blockedByChain && <Icon name="lock" size={9} colour={PALETTE.paperShadow} />}
                        {node.name}
                      </div>
                      <div className="tf">{node.flavour}</div>

                      {unlocksTowers.length > 0 && (
                        <div className="tunlocks">
                          {unlocksTowers.map((t) => (
                            <span key={t!.id} className="tu">
                              {t!.contributes.map((c) => (
                                <Icon key={c} name={CONTRIBUTIONS[c].icon} size={8} />
                              ))}
                              {t!.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="tc">
                        {owned ? (
                          'DELIVERED'
                        ) : (
                          <>
                            <Icon
                              name="social"
                              size={9}
                              colour={affordable ? PALETTE.social : PALETTE.paperShadow}
                            />{' '}
                            {node.cost}
                            {blockedByChain && (
                              <span className="tchain"> · chain {path.cost} via {path.nodes.length} steps</span>
                            )}
                            {!blockedByChain && !check.ok && <span className="tchain"> · not enough</span>}
                          </>
                        )}
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
