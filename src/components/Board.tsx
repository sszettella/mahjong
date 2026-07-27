import { useMemo } from 'react'
import type { BoardTile } from '../types'
import { boardBounds, isTileFree } from '../gameLogic'
import { TileView } from './TileView'

interface Props {
  board: BoardTile[]
  selectedId: string | null
  hintIds: string[]
  matchingIds?: string[]
  onSelect: (id: string) => void
}

export function Board({ board, selectedId, hintIds, matchingIds = [], onSelect }: Props) {
  const { minX, maxX, minY, maxY, maxZ } = useMemo(() => boardBounds(board), [board])

  const cols = maxX - minX + 1
  const rows = maxY - minY + 1

  const tileW = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390
    const available = Math.min(vw - 24, 440)
    const raw = available / (cols + 0.5 + maxZ * 0.15)
    return Math.max(28, Math.min(52, raw))
  }, [cols, maxZ])

  const tileH = tileW * 1.28
  const gapX = tileW * 0.92
  const gapY = tileH * 0.88
  const pad = 12 + maxZ * 4

  const width = cols * gapX + pad * 2 + maxZ * 4
  const height = rows * gapY + pad * 2 + maxZ * 4

  const freeSet = useMemo(() => {
    const s = new Set<string>()
    for (const t of board) {
      if (isTileFree(t, board)) s.add(t.id)
    }
    return s
  }, [board])

  const matchSet = useMemo(() => new Set(matchingIds), [matchingIds])

  const sorted = useMemo(
    () =>
      [...board]
        .filter((t) => !t.removed || matchSet.has(t.id))
        .sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x),
    [board, matchSet],
  )

  return (
    <div className="board-scroll">
      <div className="board" style={{ width, height, minHeight: height }}>
        {sorted.map((tile) => {
          const px = pad + (tile.x - minX) * gapX
          const py = pad + (tile.y - minY) * gapY
          return (
            <TileView
              key={tile.id}
              tile={tile}
              free={freeSet.has(tile.id) && !matchSet.has(tile.id)}
              selected={selectedId === tile.id}
              hinted={hintIds.includes(tile.id)}
              matching={matchSet.has(tile.id)}
              pixelX={px}
              pixelY={py}
              tileW={tileW}
              tileH={tileH}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
