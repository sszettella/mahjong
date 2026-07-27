import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoardTile } from '../types'
import { boardBounds, isCoveredByStack, isTileFree } from '../gameLogic'
import { TileView } from './TileView'

interface Props {
  board: BoardTile[]
  selectedId: string | null
  hintIds: string[]
  matchingIds?: string[]
  onSelect: (id: string) => void
  /** Report board tile size so storage can match (never larger) */
  onTileSize?: (size: { w: number; h: number }) => void
}

/** Stable key for a deal — layout positions, not which tiles remain. */
function layoutKey(board: BoardTile[]): string {
  return board.map((t) => `${t.id}:${t.x},${t.y},${t.z}`).join('|')
}

export function Board({
  board,
  selectedId,
  hintIds,
  matchingIds = [],
  onSelect,
  onTileSize,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ w: 360, h: 420 })
  // Lock tile size for the current deal so matches don't reflow the board
  const lockedSizeRef = useRef<{ key: string; w: number; h: number } | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const measure = () => {
      const r = el.getBoundingClientRect()
      setViewport({
        w: Math.max(120, r.width),
        h: Math.max(120, r.height),
      })
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Full layout bounds (includes removed tiles) — fixed for the level
  const { minX, maxX, minY, maxY, maxZ } = useMemo(() => boardBounds(board), [board])
  const dealKey = useMemo(() => layoutKey(board), [board])

  const cols = maxX - minX + 1
  const rows = maxY - minY + 1

  const { tileW, tileH } = useMemo(() => {
    // New deal (restart/next level) — drop any previous lock
    if (lockedSizeRef.current && lockedSizeRef.current.key !== dealKey) {
      lockedSizeRef.current = null
    }

    // Already locked for this deal — keep size even if viewport jitter
    if (lockedSizeRef.current?.key === dealKey) {
      return { tileW: lockedSizeRef.current.w, tileH: lockedSizeRef.current.h }
    }

    const padBudget = 10
    const availW = Math.max(80, viewport.w - padBudget * 2)
    const availH = Math.max(80, viewport.h - padBudget * 2)

    const gapFactorX = 1.02
    const gapFactorY = 1.28
    const zFactor = 0.14 * (maxZ + 1) + 0.08 * maxZ

    const fromW = availW / (cols * gapFactorX + zFactor + 0.35)
    const fromH = availH / (rows * gapFactorY + zFactor + 0.35)
    const w = Math.max(24, Math.min(78, Math.min(fromW, fromH)))
    const h = w * 1.28

    // Only lock once we have a real measured viewport (not the default stub)
    if (viewport.w > 200 && viewport.h > 150) {
      lockedSizeRef.current = { key: dealKey, w, h }
    }

    return { tileW: w, tileH: h }
  }, [viewport.w, viewport.h, cols, rows, maxZ, dealKey])

  useEffect(() => {
    onTileSize?.({ w: tileW, h: tileH })
  }, [tileW, tileH, onTileSize])

  const gapX = tileW * 1.02
  const gapY = tileH * 1.0
  const layerShift = Math.max(3, Math.round(tileW * 0.11))
  const pad = 8 + maxZ * Math.max(2, Math.floor(layerShift * 0.5))

  const width = cols * gapX + pad * 2 + maxZ * layerShift
  const height = rows * gapY + pad * 2 + maxZ * layerShift

  const freeSet = useMemo(() => {
    const s = new Set<string>()
    for (const t of board) {
      if (isTileFree(t, board)) s.add(t.id)
    }
    return s
  }, [board])

  const buriedSet = useMemo(() => {
    const s = new Set<string>()
    for (const t of board) {
      if (!t.removed && isCoveredByStack(t, board)) s.add(t.id)
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
    <div className="board-scroll" ref={scrollRef}>
      <div className="board" style={{ width, height, minHeight: height }}>
        {sorted.map((tile) => {
          const px = pad + (tile.x - minX) * gapX
          const py = pad + (tile.y - minY) * gapY
          const depthPx = tile.z * layerShift
          return (
            <TileView
              key={tile.id}
              tile={tile}
              free={freeSet.has(tile.id) && !matchSet.has(tile.id)}
              buried={buriedSet.has(tile.id) && !matchSet.has(tile.id)}
              selected={selectedId === tile.id}
              hinted={hintIds.includes(tile.id)}
              matching={matchSet.has(tile.id)}
              pixelX={px}
              pixelY={py}
              tileW={tileW}
              tileH={tileH}
              depthPx={depthPx}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
