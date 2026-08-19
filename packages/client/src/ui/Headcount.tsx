import {
  APPROVAL_SLA_THRESHOLD,
  EXIT_OPTIONS,
  HEADCOUNT_COST,
  REQ_STAGES,
  SALARY_PER_HEAD,
  TICK_HZ,
  effectiveHeadcount,
  headcountFree,
  headcountUsed,
  requisitionCost,
  requisitionSetupCost,
} from '@fte/shared'
import type { EntityId, ExitKind, GameState } from '@fte/shared'

const EXIT_ORDER: ExitKind[] = ['attrition', 'voluntary', 'compulsory']

/**
 * The establishment panel.
 *
 * Getting a head is a queue you join and then wait in. Losing one is a form you
 * fill in and then live with. Both are laid out here with the full price on the
 * label, because the whole mechanic is that neither is free and the cheap option
 * is never the cheap option.
 */
export function Headcount({
  state,
  onRaise,
  onCancel,
  onRemove,
  onClose,
}: {
  state: GameState
  onRaise: () => void
  onCancel: (id: EntityId) => void
  onRemove: (kind: ExitKind) => void
  onClose: () => void
}) {
  const hc = state.headcount
  const used = headcountUsed(state)
  const free = headcountFree(state)
  const effective = effectiveHeadcount(state)
  const salary = hc.approved * SALARY_PER_HEAD
  const reqCost = requisitionCost(hc.approved)
  const setupCost = requisitionSetupCost(hc.approved)
  const slaOk = state.stats.slaCompliance >= APPROVAL_SLA_THRESHOLD
  const unstaffed = state.towers.filter((t) => t.unstaffed).length

  const canRaise =
    state.socialCapital >= reqCost && state.budget >= setupCost && hc.requisitions.length < 3

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel wide" onClick={(e) => e.stopPropagation()}>
        <h1>THE ESTABLISHMENT</h1>
        <p style={{ color: 'var(--paper-dim)' }}>
          Every process needs an owner. An automated one needs{' '}
          <b style={{ color: 'var(--tube-glow)' }}>{HEADCOUNT_COST.automation} FTE</b>; a manual one needs{' '}
          <b style={{ color: 'var(--escalate)' }}>{HEADCOUNT_COST.process}</b>. That is the entire argument for
          automation, and it is on this screen rather than in a deck.
        </p>

        <div className="hc-summary">
          <div className="hc-stat">
            <span>APPROVED</span>
            <b>{hc.approved}</b>
          </div>
          <div className="hc-stat">
            <span>AVAILABLE</span>
            <b>{effective}</b>
            {hc.exits.length > 0 && <em>{hc.exits.length} leaving</em>}
          </div>
          <div className="hc-stat">
            <span>IN USE</span>
            <b>{used}</b>
          </div>
          <div className="hc-stat">
            <span>FREE</span>
            <b style={{ color: free > 0 ? 'var(--tube-glow)' : 'var(--escalate)' }}>{free}</b>
          </div>
          <div className="hc-stat">
            <span>SALARY / WAVE</span>
            <b style={{ color: 'var(--budget)' }}>{salary}</b>
          </div>
        </div>

        {unstaffed > 0 && (
          <p className="hc-warn">
            {unstaffed} process{unstaffed === 1 ? '' : 'es'} standing idle — nobody is left to run{' '}
            {unstaffed === 1 ? 'it' : 'them'}. They still exist. They just do not work.
          </p>
        )}

        <div className="hc-grid">
          <section>
            <h2>RAISE A REQUISITION</h2>
            <p className="teaches">
              Approval is a queue, not a purchase. Three stages, one wave each — so a req raised now arrives
              about three waves late, which is roughly when you no longer need it.
            </p>

            <div className="hc-cost">
              <span>
                Cost to make the case: <b style={{ color: 'var(--social)' }}>{reqCost} Social Capital</b>
              </span>
              <span>
                Recruitment and kit: <b style={{ color: 'var(--budget)' }}>{setupCost} Budget</b>
              </span>
              <span>
                Then <b style={{ color: 'var(--budget)' }}>{SALARY_PER_HEAD} Budget</b> every wave, forever.
              </span>
            </div>

            <div className={`hc-gate${slaOk ? ' ok' : ''}`}>
              {slaOk ? (
                <>
                  SLA is {Math.round(state.stats.slaCompliance * 100)}%. The CFO will sign it.
                </>
              ) : (
                <>
                  SLA is {Math.round(state.stats.slaCompliance * 100)}%, below the{' '}
                  {Math.round(APPROVAL_SLA_THRESHOLD * 100)}% the CFO wants to see. The req will be{' '}
                  <b>deferred once</b>: "before we add people, show me you can run what you have."
                </>
              )}
            </div>

            <button className="chunky" disabled={!canRaise} onClick={onRaise}>
              RAISE A REQ
            </button>
            {!canRaise && hc.requisitions.length >= 3 && (
              <p className="teaches">Three already in the system. Finance will not look at a fourth.</p>
            )}

            <h3 className="hc-sub">IN THE PIPELINE ({hc.requisitions.length})</h3>
            {hc.requisitions.length === 0 && <p className="teaches">Nothing pending.</p>}
            {hc.requisitions.map((req) => {
              const stage = REQ_STAGES[Math.min(req.stage, REQ_STAGES.length - 1)]
              const total = REQ_STAGES.length
              return (
                <div className="req" key={req.id}>
                  <div className="rt">
                    Stage {Math.min(req.stage + 1, total)}/{total} — {stage?.name}
                    {req.deferred && <b className="def"> · DEFERRED ONCE</b>}
                  </div>
                  <div className="rf">{stage?.flavour}</div>
                  <div className="rprog">
                    {REQ_STAGES.map((_, i) => (
                      <span key={i} className={i < req.stage ? 'done' : i === req.stage ? 'now' : ''} />
                    ))}
                  </div>
                  <button onClick={() => onCancel(req.id)}>withdraw (Budget back, credibility gone)</button>
                </div>
              )
            })}
          </section>

          <section>
            <h2>REMOVE HEADCOUNT</h2>
            <p className="teaches">
              Three routes out. The trade is real: attrition is free and slow, voluntary is fast and expensive,
              compulsory is cheap in money and expensive in everything else.
            </p>

            {EXIT_ORDER.map((kind) => {
              const def = EXIT_OPTIONS[kind]
              const affordable = state.budget >= def.budget && effective > 1
              return (
                <div className={`exit ${kind}`} key={kind}>
                  <div className="en">{def.name}</div>
                  <div className="ef">{def.flavour}</div>
                  <div className="ec">
                    {def.budget > 0 && <span className="b">−{def.budget} Budget</span>}
                    {def.morale > 0 && <span className="m">−{def.morale} Morale</span>}
                    {def.social > 0 && <span className="s">−{def.social} Social Capital</span>}
                    <span className="t">{def.consultSeconds}s consultation</span>
                    {def.moralePerSecond > 0 && (
                      <span className="m">−{def.moralePerSecond}/s while it runs</span>
                    )}
                    {def.erRisk > 0 && <span className="r">{Math.round(def.erRisk * 100)}% claim risk</span>}
                  </div>
                  <button disabled={!affordable} onClick={() => onRemove(kind)}>
                    {effective <= 1 ? 'only one person left' : 'start the process'}
                  </button>
                </div>
              )
            })}

            {hc.exits.length > 0 && (
              <>
                <h3 className="hc-sub">CONSULTATIONS RUNNING ({hc.exits.length})</h3>
                {hc.exits.map((exit) => (
                  <div className="req" key={exit.id}>
                    <div className="rt">{EXIT_OPTIONS[exit.kind].name}</div>
                    <div className="rf">
                      {Math.ceil(exit.ticks / TICK_HZ)}s remaining. The head is already off the roster.
                    </div>
                    <div className="track" style={{ marginTop: 4 }}>
                      <div
                        className="fill"
                        style={{
                          width: `${100 - (exit.ticks / exit.totalTicks) * 100}%`,
                          background: 'var(--escalate)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>

        <button className="chunky ghost" onClick={onClose}>
          CLOSE (H)
        </button>
      </div>
    </div>
  )
}
