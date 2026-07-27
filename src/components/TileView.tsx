import type { BoardTile } from '../types'
import { faceKey } from '../tiles'
import { TileFaceContent } from './TileFace'

interface Props {
  tile: BoardTile
  free: boolean
  selected: boolean
  hinted: boolean
  matching?: boolean
  pixelX: number
  pixelY: number
  tileW: number
  tileH: number
  onSelect: (id: string) => void
}

export function TileView({
  tile,
  free,
  selected,
  hinted,
  matching = false,
  pixelX,
  pixelY,
  tileW,
  tileH,
  onSelect,
}: Props) {
  if (tile.removed && !matching) return null

  const depth = tile.z * 3
  const classNames = [
    'mahjong-tile',
    free ? 'free' : 'blocked',
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
        left: pixelX + depth,
        top: pixelY - depth,
        width: tileW,
        height: tileH,
        zIndex: matching
          ? 900
          : 10 + tile.z * 20 + Math.round(tile.y * 2) + Math.round(tile.x),
      }}
      onClick={() => free && onSelect(tile.id)}
      disabled={!free || matching}
      aria-label={`${tile.face.label}${free ? '' : ' (blocked)'}${selected ? ' selected' : ''}`}
      data-face={faceKey(tile.face)}
    >
      <TileFaceContent tile={tile} />
      <span className="tile-edge" aria-hidden />
      {matching && <span className="tile-match-glow" aria-hidden />}
    </button>
  )
}
