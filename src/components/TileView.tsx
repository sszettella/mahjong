import type { BoardTile } from '../types'
import { faceKey } from '../tiles'
import { TileFaceContent } from './TileFace'

interface Props {
  tile: BoardTile
  free: boolean
  /** Fully under another tile in the same stack — hide face art */
  buried: boolean
  selected: boolean
  hinted: boolean
  matching?: boolean
  pixelX: number
  pixelY: number
  tileW: number
  tileH: number
  depthPx: number
  onSelect: (id: string) => void
}

export function TileView({
  tile,
  free,
  buried,
  selected,
  hinted,
  matching = false,
  pixelX,
  pixelY,
  tileW,
  tileH,
  depthPx,
  onSelect,
}: Props) {
  if (tile.removed && !matching) return null

  // z-layer dominates paint order so stacks never interleave faces
  const zIndex = matching
    ? 9000
    : 100 + tile.z * 1000 + Math.round(tile.y * 20) + Math.round(tile.x)

  const classNames = [
    'mahjong-tile',
    free ? 'free' : 'blocked',
    buried ? 'buried' : 'exposed',
    selected ? 'selected' : '',
    hinted ? 'hinted' : '',
    matching ? 'is-matching-out' : '',
    `suit-${tile.face.suit}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classNames}
      style={{
        left: pixelX + depthPx,
        top: pixelY - depthPx,
        width: tileW,
        height: tileH,
        zIndex,
      }}
      onClick={() => free && onSelect(tile.id)}
      disabled={!free || matching}
      aria-label={`${tile.face.label}${buried ? ' (under stack)' : free ? '' : ' (blocked)'}${selected ? ' selected' : ''}`}
      data-face={faceKey(tile.face)}
      data-z={tile.z}
    >
      {buried ? (
        <span className="tile-face tile-face-buried" aria-hidden>
          <span className="tile-face-inner tile-face-inner-solid" />
        </span>
      ) : (
        <TileFaceContent tile={tile} />
      )}
      <span className="tile-edge" aria-hidden />
      {matching && <span className="tile-match-glow" aria-hidden />}
    </button>
  )
}
