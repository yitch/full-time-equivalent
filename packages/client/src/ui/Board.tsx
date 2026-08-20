import { BOARD_H, BOARD_W, TILE, ZOOM_STEP } from '@fte/shared'
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
  const [zoom, setZoom] = useState(1)
  const dragging = useRef<{ x: number; y: number } | null>(null)

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

  // React's onWheel is passive, so preventDefault there is ignored and the page
  // scrolls behind the board. This has to be a native non-passive listener.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || !mounted) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const stage = stageRef.current
      if (!stage) return
      const rect = el.getBoundingClientRect()
      const cssScale = rect.width / BOARD_W
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      stage.zoomAt(factor, (event.clientX - rect.left) / cssScale, (event.clientY - rect.top) / cssScale)
      setZoom(stage.zoomLevel)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [mounted])

  /**
   * Screen → tile, via the camera. The element is CSS-scaled to fit, and the
   * world inside it is separately zoomed and panned, so both have to be undone
   * or every click lands somewhere else once you zoom in.
   */
  function toTile(event: { clientX: number; clientY: number }, el: HTMLElement): Vec2 {
    const rect = el.getBoundingClientRect()
    const cssScale = rect.width / BOARD_W
    const logicalX = (event.clientX - rect.left) / cssScale
    const logicalY = (event.clientY - rect.top) / cssScale
    const stage = stageRef.current
    if (!stage) return { x: logicalX / TILE, y: logicalY / TILE }
    return stage.logicalToTile(logicalX, logicalY)
  }

  return (
    <div
      className="board"
      ref={wrapRef}
      style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}`, cursor: buildingTower ? 'crosshair' : 'default' }}
      onMouseMove={(e) => {
        const el = e.currentTarget
        if (dragging.current) {
          const rect = el.getBoundingClientRect()
          const cssScale = rect.width / BOARD_W
          stageRef.current?.panBy(
            (e.clientX - dragging.current.x) / cssScale,
            (e.clientY - dragging.current.y) / cssScale,
          )
          dragging.current = { x: e.clientX, y: e.clientY }
        }
        setHoverTile(toTile(e, el))
      }}
      onMouseLeave={() => {
        setHoverTile(null)
        dragging.current = null
      }}
      onMouseDown={(e) => {
        // Middle-drag pans. Left is placing and right is the headcount menu.
        if (e.button === 1) {
          e.preventDefault()
          dragging.current = { x: e.clientX, y: e.clientY }
        }
      }}
      onMouseUp={() => {
        dragging.current = null
      }}
      onDoubleClick={() => {
        stageRef.current?.resetCamera()
        setZoom(1)
      }}
      onClick={(e) => {
        if (buildingTower) onPlace(toTile(e, e.currentTarget))
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
          tile: toTile(e, e.currentTarget),
        })
      }}
    >
      <div className="canvas-host" ref={hostRef} />
      {zoom > 1 && (
        <div className="zoom-chip">
          {zoom.toFixed(1)}x · middle-drag to pan · double-click to fit
        </div>
      )}
      {children}
    </div>
  )
}
