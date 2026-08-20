import { TUTORIAL_STEPS, TUTORIAL_VERSION } from '@fte/shared'
import type { GameState, PlayerId, TutorialTrigger } from '@fte/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.js'

const KEY = `fte.tutorial.v${TUTORIAL_VERSION}`

interface Progress {
  step: number
  skipped: boolean
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Progress
  } catch {
    /* a corrupt tutorial state is not worth crashing over */
  }
  return { step: 0, skipped: false }
}

function write(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    /* private browsing; the tutorial just repeats */
  }
}

/** Has the player done the thing this step is waiting on? */
function satisfied(trigger: TutorialTrigger, state: GameState, moved: boolean): boolean {
  switch (trigger) {
    case 'built_tower':
      return state.towers.length > 0
    case 'wave_started':
      return state.phase === 'wave'
    case 'wave_cleared':
      return state.waveIndex > 0 || state.phase === 'steering'
    case 'tech_unlocked':
      return state.unlocked.length > 1
    case 'moved':
      return moved
    default:
      return false
  }
}

export function useTutorial() {
  const [progress, setProgress] = useState<Progress>(() => read())
  const update = useCallback((next: Progress) => {
    setProgress(next)
    write(next)
  }, [])
  return { progress, update }
}

/**
 * A self-guided tour that gets out of the way.
 *
 * Steps that can be learned by doing advance themselves the moment the player
 * does the thing — nobody should have to click Next to acknowledge that they
 * have, in fact, just built a tower. Everything else is Next/Back, and Skip is
 * always one click away and remembered.
 */
export function Tutorial({
  state,
  localPlayerId,
  progress,
  overlayActive,
  onUpdate,
}: {
  state: GameState
  localPlayerId: PlayerId | null
  progress: Progress
  /** A briefing or end card owns the middle of the screen; do not sit on top of it. */
  overlayActive: boolean
  onUpdate: (next: Progress) => void
}) {
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const [moved, setMoved] = useState(false)

  const me = localPlayerId ? state.players[localPlayerId] : null

  useEffect(() => {
    if (!me) return
    if (!startPos.current) {
      startPos.current = { ...me.pos }
      return
    }
    const d = Math.hypot(me.pos.x - startPos.current.x, me.pos.y - startPos.current.y)
    if (d > 3) setMoved(true)
  }, [me?.pos.x, me?.pos.y, me])

  const step = TUTORIAL_STEPS[progress.step]

  // Whether the current step's condition is met. Recomputed every snapshot, but
  // reduced to a boolean so the effect below does not re-run at 10Hz.
  const ready = !!step?.doneWhen && !progress.skipped && satisfied(step.doneWhen, state, moved)

  const stepId = step?.id
  const advance = useRef(onUpdate)
  advance.current = onUpdate
  const at = useRef(progress)
  at.current = progress

  // Auto-advance a beat after the player does the thing. The dependency list is
  // deliberately only [ready, stepId]: keying it on `state` meant the timer was
  // cleared and restarted on every snapshot and never fired at all.
  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      advance.current({
        ...at.current,
        step: Math.min(TUTORIAL_STEPS.length - 1, at.current.step + 1),
      })
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [ready, stepId])

  if (progress.skipped || !step) return null

  const last = progress.step === TUTORIAL_STEPS.length - 1
  const waiting = !!step.doneWhen && !ready

  const anchor = overlayActive && step.anchor === 'centre' ? 'side' : step.anchor

  return (
    <div className={`tut tut-${anchor}`}>
      <div className="tut-head">
        {step.icon && <Icon name={step.icon} size={12} colour="var(--highlighter)" />}
        <span className="tut-title">{step.title}</span>
        <span className="tut-count">
          {progress.step + 1}/{TUTORIAL_STEPS.length}
        </span>
      </div>
      <p className="tut-body">{step.body}</p>
      {step.aside && <p className="tut-aside">{step.aside}</p>}

      <div className="tut-actions">
        <button
          className="tut-skip"
          onClick={() => onUpdate({ step: progress.step, skipped: true })}
          title="You can bring it back with ?"
        >
          skip the tour
        </button>
        <div className="tut-nav">
          {progress.step > 0 && (
            <button onClick={() => onUpdate({ ...progress, step: progress.step - 1 })}>back</button>
          )}
          {last ? (
            <button className="go" onClick={() => onUpdate({ step: 0, skipped: true })}>
              got it
            </button>
          ) : (
            <button
              className={waiting ? '' : 'go'}
              onClick={() => onUpdate({ ...progress, step: progress.step + 1 })}
            >
              {waiting ? 'skip this step' : 'next'}
            </button>
          )}
        </div>
      </div>

      {waiting && <div className="tut-wait">waiting for you to try it…</div>}
    </div>
  )
}
