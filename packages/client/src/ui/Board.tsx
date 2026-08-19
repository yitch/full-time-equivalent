import { BOARD_H, BOARD_W, TILE } from '@fte/shared'
import type { GameState, PlayerId, Vec2 } from '@fte/shared'
import { useEffect, useRef, useState } from 'react'
import { GameStage } from '../render/stage.js'

interface Props {
  state: GameState
  localPlayerId: PlayerId | null
  buildingTower: string | null
  onPlace: (tile: Vec2) => void
  onCancel: () => void
  /** Right-click with nothing being placed: percentage position + tower under cursor. */
  onContext: (target: { x: number; y: number; tile: Vec2 }) => void
  children?: React.ReactNode
}

/**
 * Owns the Pixi canvas and translates mouse position into tile coordinates.
 * React never touches the renderer's internals — it hands it state once a frame.
 */
export function Board({ state, localPlayerId, buildingTower, onPlace, onCancel, onContext, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<GameStage | null>(null)
  const [hoverTile, setHoverTile] = useState<Vec2 | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    const stage = new GameStage()

    void stage.mount(host).then(() => {
      if (cancelled) {
        stage.destroy()
        return
      }
      stageRef.current = stage
      setMounted(true)
    })

    return () => {
      cancelled = true
      stageRef.current = null
      stage.destroy()
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    stageRef.current?.sync(state, { buildingTower, hoverTile, localPlayerId })
  }, [state, buildingTower, hoverTile, localPlayerId, mounted])

  function toTile(event: React.MouseEvent<HTMLDivElement>): Vec2 {
    const rect = event.currentTarget.getBoundingClientRect()
    const scale = rect.width / BOARD_W
    return {
      x: (event.clientX - rect.left) / scale / TILE,
      y: (event.clientY - rect.top) / scale / TILE,
    }
  }

  return (
    <div
      className="board"
      ref={wrapRef}
      style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}`, cursor: buildingTower ? 'crosshair' : 'default' }}
      onMouseMove={(e) => setHoverTile(toTile(e))}
      onMouseLeave={() => setHoverTile(null)}
      onClick={(e) => {
        if (buildingTower) onPlace(toTile(e))
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        // While placing, right-click means "never mind". Otherwise it is the menu.
        if (buildingTower) {
          onCancel()
          return
        }
        const rect = e.currentTarget.getBoundingClientRect()
        onContext({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
          tile: toTile(e),
        })
      }}
    >
      <div className="canvas-host" ref={hostRef} />
      {children}
    </div>
  )
}
