import { EXIT_OPTIONS, HEADCOUNT_COST, SELL_REFUND, effectiveHeadcount, getTower } from '@fte/shared'
import type { EntityId, ExitKind, GameState } from '@fte/shared'

const EXIT_ORDER: ExitKind[] = ['attrition', 'voluntary', 'compulsory']

export interface ContextTarget {
  /** Screen position, relative to the board element. */
  x: number
  y: number
  /** Tower under the cursor, if any. */
  towerId: EntityId | null
}

/**
 * Right-click menu.
 *
 * Two things live here because they are the same decision from two directions:
 * decommissioning a process frees the people running it, and removing people
 * takes processes offline. Putting them on the same menu makes that legible
 * without a tutorial.
 */
export function ContextMenu({
  state,
  target,
  onSell,
  onRemove,
  onClose,
}: {
  state: GameState
  target: ContextTarget
  onSell: (id: EntityId) => void
  onRemove: (kind: ExitKind) => void
  onClose: () => void
}) {
  const tower = target.towerId ? state.towers.find((t) => t.id === target.towerId) : null
  const def = tower ? getTower(tower.type) : null
  const effective = effectiveHeadcount(state)

  return (
    <>
      <div className="ctx-scrim" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <div
        className="ctx"
        style={{ left: `${target.x}%`, top: `${target.y}%` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {def && tower && (
          <>
            <div className="ctx-head">{def.name}</div>
            <button
              className="ctx-item"
              onClick={() => {
                onSell(tower.id)
                onClose()
              }}
            >
              <span className="l">Decommission the process</span>
              <span className="r">
                +{Math.round(def.cost * SELL_REFUND)} Budget · frees {HEADCOUNT_COST[def.channel]} FTE
              </span>
            </button>
            <div className="ctx-rule" />
          </>
        )}

        <div className="ctx-head">
          REMOVE HEADCOUNT <em>{effective} FTE available</em>
        </div>

        {EXIT_ORDER.map((kind) => {
          const exit = EXIT_OPTIONS[kind]
          const blocked = effective <= 1 || state.budget < exit.budget
          const reason =
            effective <= 1
              ? 'only one person left'
              : state.budget < exit.budget
                ? `needs ${exit.budget} Budget`
                : null
          return (
            <button
              key={kind}
              className={`ctx-item ${kind}`}
              disabled={blocked}
              title={exit.flavour}
              onClick={() => {
                onRemove(kind)
                onClose()
              }}
            >
              <span className="l">{exit.name}</span>
              <span className="r">
                {reason ?? (
                  <>
                    {exit.budget > 0 && `−${exit.budget} Budget · `}
                    {exit.morale > 0 && `−${exit.morale} Morale · `}
                    {exit.consultSeconds}s
                    {exit.erRisk > 0 && ` · ${Math.round(exit.erRisk * 100)}% claim`}
                  </>
                )}
              </span>
            </button>
          )
        })}

        <div className="ctx-foot">Esc or left-click to dismiss</div>
      </div>
    </>
  )
}
