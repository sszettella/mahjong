import type { BoardTile, TileFace as Face } from '../types'

/** Soft radial “gem” circle for circles/dots suit */
function Dot({
  cx,
  cy,
  r,
  tone,
}: {
  cx: number
  cy: number
  r: number
  tone: 'red' | 'blue'
}) {
  const id = `dg-${tone}`
  return (
    <g>
      <circle cx={cx + 0.8} cy={cy + 1} r={r} fill="rgba(0,0,0,0.18)" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      <circle
        cx={cx - r * 0.28}
        cy={cy - r * 0.3}
        r={r * 0.28}
        fill="rgba(255,255,255,0.55)"
      />
    </g>
  )
}

function DotsPattern({ n }: { n: number; color: string }) {
  // Classic: 1,5,7,9 red · 2,3,4,6,8 blue
  const useTone: 'red' | 'blue' = [1, 5, 7, 9].includes(n) ? 'red' : 'blue'

  const positions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[50, 28], [50, 72]],
    3: [[50, 22], [50, 50], [50, 78]],
    4: [[30, 28], [70, 28], [30, 72], [70, 72]],
    5: [[30, 28], [70, 28], [50, 50], [30, 72], [70, 72]],
    6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
    7: [[30, 18], [70, 18], [50, 36], [30, 54], [70, 54], [30, 80], [70, 80]],
    8: [[30, 16], [70, 16], [30, 38], [70, 38], [30, 62], [70, 62], [30, 84], [70, 84]],
    9: [[26, 18], [50, 18], [74, 18], [26, 50], [50, 50], [74, 50], [26, 82], [50, 82], [74, 82]],
  }
  const pts = positions[n] ?? positions[1]
  const r = n >= 8 ? 8.5 : n >= 6 ? 9.5 : n === 1 ? 16 : 11

  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="dg-red" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="45%" stopColor="#e11d2e" />
          <stop offset="100%" stopColor="#8b0a14" />
        </radialGradient>
        <radialGradient id="dg-blue" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6eb6ff" />
          <stop offset="45%" stopColor="#1a6fd4" />
          <stop offset="100%" stopColor="#0a3a7a" />
        </radialGradient>
      </defs>
      {pts.map(([cx, cy], i) => (
        <Dot key={i} cx={cx} cy={cy} r={r} tone={useTone} />
      ))}
    </svg>
  )
}

function BambooStick({
  x,
  y0,
  y1,
  thin,
}: {
  x: number
  y0: number
  y1: number
  thin?: boolean
}) {
  const w = thin ? 5.5 : 7.5
  return (
    <g>
      {/* shadow */}
      <line
        x1={x + 1}
        y1={y0 + 1}
        x2={x + 1}
        y2={y1 + 1}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={w}
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={y0}
        x2={x}
        y2={y1}
        stroke="url(#bambooGrad)"
        strokeWidth={w}
        strokeLinecap="round"
      />
      {/* joint nodes */}
      <ellipse cx={x} cy={(y0 + y1) / 2} rx={w * 0.85} ry={2.2} fill="#0d5c32" />
      <ellipse cx={x} cy={y0 + (y1 - y0) * 0.28} rx={w * 0.7} ry={1.6} fill="#1a7a45" opacity={0.9} />
      <ellipse cx={x} cy={y0 + (y1 - y0) * 0.72} rx={w * 0.7} ry={1.6} fill="#1a7a45" opacity={0.9} />
      {/* highlight */}
      <line
        x1={x - w * 0.22}
        y1={y0 + 3}
        x2={x - w * 0.22}
        y2={y1 - 3}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </g>
  )
}

function BambooPattern({ n }: { n: number; color: string }) {
  const cols = n <= 3 ? n : 3
  const rows = Math.ceil(n / cols)
  const sticks: { x: number; y0: number; y1: number }[] = []
  let left = n
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, left)
    for (let c = 0; c < inRow; c++) {
      const x = 50 + (c - (inRow - 1) / 2) * 22
      const y0 = 14 + r * (68 / rows)
      const y1 = y0 + 52 / rows
      sticks.push({ x, y0, y1 })
    }
    left -= inRow
  }
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="bambooGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f6b38" />
          <stop offset="40%" stopColor="#2db86a" />
          <stop offset="100%" stopColor="#0a4d28" />
        </linearGradient>
      </defs>
      {sticks.map((s, i) => (
        <BambooStick key={i} {...s} thin={n >= 7} />
      ))}
    </svg>
  )
}

function BambooBird() {
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="birdGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3dd87a" />
          <stop offset="100%" stopColor="#0f6b38" />
        </linearGradient>
      </defs>
      {/* stylized peacock / bird mark */}
      <ellipse cx={50} cy={58} rx={18} ry={22} fill="url(#birdGrad)" />
      <ellipse cx={50} cy={38} rx={12} ry={14} fill="#1a8f4a" />
      <circle cx={46} cy={35} r={2.2} fill="#0a2e18" />
      <path
        d="M50 20 C58 8, 72 12, 74 26 C62 22, 54 24, 50 32 Z"
        fill="#2db86a"
      />
      <path
        d="M50 20 C42 8, 28 12, 26 26 C38 22, 46 24, 50 32 Z"
        fill="#1f9a52"
      />
      <path d="M62 62 Q78 70 70 82 Q60 72 58 66 Z" fill="#0f6b38" />
      <path d="M38 62 Q22 70 30 82 Q40 72 42 66 Z" fill="#0f6b38" />
      <circle cx={72} cy={28} r={3} fill="#e11d2e" />
    </svg>
  )
}

function CharStack({ symbol }: { symbol: string }) {
  return (
    <div className="tile-char-stack">
      <span className="tile-symbol char-num">{symbol}</span>
      <span className="tile-char-label">萬</span>
    </div>
  )
}

function WhiteDragon() {
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="wdFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a2a32" />
          <stop offset="50%" stopColor="#5a5a68" />
          <stop offset="100%" stopColor="#1a1a22" />
        </linearGradient>
      </defs>
      <rect
        x={18}
        y={16}
        width={64}
        height={68}
        rx={4}
        fill="none"
        stroke="url(#wdFrame)"
        strokeWidth={7}
      />
      <rect
        x={26}
        y={24}
        width={48}
        height={52}
        rx={2}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={2}
      />
    </svg>
  )
}

function HonorGlyph({
  symbol,
  color,
  suit,
}: {
  symbol: string
  color: string
  suit: string
}) {
  const isRed = suit === 'dragons' && symbol === '中'
  const isGreen = suit === 'dragons' && symbol === '發'
  return (
    <span
      className={[
        'tile-symbol',
        'honor',
        isRed ? 'honor-red' : '',
        isGreen ? 'honor-green' : '',
        suit === 'flowers' || suit === 'seasons' ? 'honor-special' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ color }}
    >
      {symbol}
    </span>
  )
}

export function renderFaceDecor(face: Face) {
  const { suit, value, symbol, color } = face

  if (suit === 'dots') {
    return <DotsPattern n={value} color={color} />
  }
  if (suit === 'bamboo') {
    if (value === 1) return <BambooBird />
    return <BambooPattern n={value} color={color} />
  }
  if (suit === 'characters') {
    return <CharStack symbol={symbol} />
  }
  if (suit === 'dragons' && value === 2) {
    return <WhiteDragon />
  }
  return <HonorGlyph symbol={symbol} color={color} suit={suit} />
}

export function TileFaceContent({ tile }: { tile: BoardTile }) {
  return (
    <span className={`tile-face suit-face-${tile.face.suit}`}>
      <span className="tile-face-sheen" aria-hidden />
      {renderFaceDecor(tile.face)}
    </span>
  )
}
