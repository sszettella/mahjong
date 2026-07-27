import { useEffect, useMemo, type CSSProperties } from 'react'
import type { BoardTile } from '../types'
import { TileFaceContent } from './TileFace'

export interface MatchBurstData {
  id: number
  boardTile: BoardTile
  storageTile: BoardTile
  matchNumber: number
}

interface Props {
  burst: MatchBurstData | null
  onDone: () => void
}

const CONFETTI_COUNT = 48
const BURST_MS = 900

const COLORS = [
  '#ff5c5c',
  '#ff8a3d',
  '#ffd166',
  '#ffe566',
  '#6ddf8c',
  '#3dd9c0',
  '#5eb3ff',
  '#8b7cff',
  '#ff6bcb',
  '#ffffff',
  '#e8b84a',
  '#f0a0c8',
]

type Shape = 'rect' | 'ribbon' | 'circle' | 'square'

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function MatchBurst({ burst, onDone }: Props) {
  const pieces = useMemo(() => {
    if (!burst) return []
    const seed = burst.id * 97 + burst.matchNumber * 13
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const r1 = seeded(seed + i)
      const r2 = seeded(seed + i + 50)
      const r3 = seeded(seed + i + 100)
      const r4 = seeded(seed + i + 150)
      const r5 = seeded(seed + i + 200)
      const r6 = seeded(seed + i + 250)
      const r7 = seeded(seed + i + 300)

      // Burst outward with gravity bias downward
      const angle = r1 * Math.PI * 2
      const power = 70 + r2 * 140
      const driftX = Math.cos(angle) * power * (0.55 + r3 * 0.7)
      // Upward kick then fall
      const lift = -40 - r4 * 90
      const fall = 80 + r5 * 160
      const shapes: Shape[] = ['rect', 'ribbon', 'circle', 'square']
      const shape = shapes[Math.floor(r6 * shapes.length)]

      return {
        i,
        color: COLORS[Math.floor(r7 * COLORS.length)],
        shape,
        driftX,
        lift,
        fall,
        delay: r1 * 0.08,
        duration: 0.65 + r2 * 0.35,
        rot0: r3 * 360,
        rot1: (r4 - 0.5) * 720,
        w: shape === 'ribbon' ? 4 + r5 * 4 : shape === 'circle' ? 6 + r5 * 6 : 6 + r5 * 8,
        h:
          shape === 'ribbon'
            ? 14 + r6 * 16
            : shape === 'circle'
              ? 6 + r5 * 6
              : shape === 'square'
                ? 7 + r5 * 6
                : 5 + r6 * 5,
        spin: r7 > 0.5 ? 1 : -1,
      }
    })
  }, [burst])

  useEffect(() => {
    if (!burst) return
    const t = window.setTimeout(onDone, BURST_MS)
    return () => clearTimeout(t)
  }, [burst, onDone])

  if (!burst) return null

  const ghostA = { ...burst.boardTile, removed: false }
  const ghostB = { ...burst.storageTile, removed: false }

  return (
    <div className="match-burst-layer" aria-hidden>
      <div className="match-burst-flash" />
      <div className="match-burst-core">
        <div className="match-ring" />
        <div className="match-ring match-ring-delay" />

        <div className="match-ghost match-ghost-left">
          <div className="mahjong-tile free match-ghost-tile">
            <TileFaceContent tile={ghostA} />
          </div>
        </div>
        <div className="match-ghost match-ghost-right">
          <div className="mahjong-tile free match-ghost-tile">
            <TileFaceContent tile={ghostB} />
          </div>
        </div>

        <div className="match-spark">✦</div>
        <div className="match-pop-label">Match!</div>

        <div className="confetti-field">
          {pieces.map((p) => (
            <span
              key={p.i}
              className={`confetti confetti-${p.shape}`}
              style={
                {
                  '--c': p.color,
                  '--dx': `${p.driftX}px`,
                  '--lift': `${p.lift}px`,
                  '--fall': `${p.fall}px`,
                  '--delay': `${p.delay}s`,
                  '--dur': `${p.duration}s`,
                  '--rot0': `${p.rot0}deg`,
                  '--rot1': `${p.rot1}deg`,
                  '--spin': p.spin,
                  '--w': `${p.w}px`,
                  '--h': `${p.h}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
