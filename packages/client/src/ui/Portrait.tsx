import { ROLES } from '@fte/shared'
import type { RoleId } from '@fte/shared'
import { useMemo } from 'react'
import { rasteriseToDataUrl } from '../render/sprites.js'

/**
 * A rendered animal, for anywhere the DOM needs to show a character rather than
 * describe one. Uses the same pixel maps as the board, so the thing on the card
 * is provably the thing you will be playing.
 */
export function Portrait({
  animal,
  size = 56,
  stakeholder = false,
  dim = false,
}: {
  animal: RoleId
  size?: number
  stakeholder?: boolean
  dim?: boolean
}) {
  const role = ROLES[animal]
  const src = useMemo(
    () => rasteriseToDataUrl(`${stakeholder ? 'sh' : 'pc'}_${animal}`, role?.colour),
    [animal, stakeholder, role?.colour],
  )
  if (!src) return null
  return (
    <img
      className="portrait"
      src={src}
      alt={role?.name ?? animal}
      width={size * (14 / 18)}
      height={size}
      style={{ imageRendering: 'pixelated', opacity: dim ? 0.45 : 1 }}
    />
  )
}
