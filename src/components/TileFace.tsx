import type { BoardTile, TileFace as Face } from '../types'

function DotsPattern({ n, color }: { n: number; color: string }) {
  const positions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[50, 28], [50, 72]],
    3: [[50, 22], [50, 50], [50, 78]],
    4: [[32, 28], [68, 28], [32, 72], [68, 72]],
    5: [[32, 28], [68, 28], [50, 50], [32, 72], [68, 72]],
    6: [[32, 22], [68, 22], [32, 50], [68, 50], [32, 78], [68, 78]],
    7: [[32, 18], [68, 18], [50, 36], [32, 54], [68, 54], [32, 80], [68, 80]],
    8: [[32, 18], [68, 18], [32, 40], [68, 40], [32, 62], [68, 62], [32, 84], [68, 84]],
    9: [[28, 20], [50, 20], [72, 20], [28, 50], [50, 50], [72, 50], [28, 80], [50, 80], [72, 80]],
  }
  const pts = positions[n] ?? positions[1]
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      {pts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={n >= 7 ? 8 : 10} fill={color} />
      ))}
    </svg>
  )
}

function BambooPattern({ n, color }: { n: number; color: string }) {
  const cols = n <= 3 ? n : 3
  const rows = Math.ceil(n / cols)
  const sticks: { x: number; y0: number; y1: number }[] = []
  let left = n
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, left)
    for (let c = 0; c < inRow; c++) {
      const x = 50 + (c - (inRow - 1) / 2) * 22
      const y0 = 18 + r * (60 / rows)
      const y1 = y0 + 50 / rows
      sticks.push({ x, y0, y1 })
    }
    left -= inRow
  }
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      {sticks.map((s, i) => (
        <g key={i}>
          <line
            x1={s.x}
            y1={s.y0}
            x2={s.x}
            y2={s.y1}
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
          />
          <line
            x1={s.x - 5}
            y1={(s.y0 + s.y1) / 2}
            x2={s.x + 5}
            y2={(s.y0 + s.y1) / 2}
            stroke={color}
            strokeWidth={3}
          />
        </g>
      ))}
    </svg>
  )
}

export function renderFaceDecor(face: Face) {
  const { suit, value, symbol, color } = face

  if (suit === 'dots') {
    return <DotsPattern n={value} color={color} />
  }
  if (suit === 'bamboo') {
    if (value === 1) {
      return (
        <span className="tile-symbol bamboo-bird" style={{ color }}>
          雀
        </span>
      )
    }
    return <BambooPattern n={value} color={color} />
  }
  if (suit === 'characters') {
    return (
      <div className="tile-char-stack">
        <span className="tile-symbol char-num" style={{ color }}>
          {symbol}
        </span>
        <span className="tile-char-label" style={{ color }}>
          萬
        </span>
      </div>
    )
  }
  if (suit === 'dragons' && value === 2) {
    return <div className="white-dragon-box" />
  }
  return (
    <span className="tile-symbol honor" style={{ color }}>
      {symbol}
    </span>
  )
}

export function TileFaceContent({ tile }: { tile: BoardTile }) {
  return <span className="tile-face">{renderFaceDecor(tile.face)}</span>
}
