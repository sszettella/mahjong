import { useId } from 'react'
import type { BoardTile, TileFace as Face } from '../types'

/** Vita-style gem circle — soft rings + glossy core */
function Dot({
  cx,
  cy,
  r,
  tone,
  gid,
}: {
  cx: number
  cy: number
  r: number
  tone: 'red' | 'blue'
  gid: string
}) {
  return (
    <g>
      <circle cx={cx + 0.6} cy={cy + 1.1} r={r * 1.02} fill="rgba(40,30,20,0.14)" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#${gid}-dot-${tone})`}
        stroke={tone === 'red' ? '#9a1020' : '#0d3d8a'}
        strokeWidth={r * 0.12}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.62}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={r * 0.08}
      />
      <ellipse
        cx={cx - r * 0.28}
        cy={cy - r * 0.32}
        rx={r * 0.32}
        ry={r * 0.22}
        fill="rgba(255,255,255,0.7)"
      />
    </g>
  )
}

function DotsPattern({ n }: { n: number }) {
  const gid = useId().replace(/:/g, '')
  const useTone: 'red' | 'blue' = [1, 5, 7, 9].includes(n) ? 'red' : 'blue'
  const positions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[50, 26], [50, 74]],
    3: [[50, 20], [50, 50], [50, 80]],
    4: [[28, 26], [72, 26], [28, 74], [72, 74]],
    5: [[28, 26], [72, 26], [50, 50], [28, 74], [72, 74]],
    6: [[28, 20], [72, 20], [28, 50], [72, 50], [28, 80], [72, 80]],
    7: [[28, 16], [72, 16], [50, 36], [28, 54], [72, 54], [28, 84], [72, 84]],
    8: [[28, 14], [72, 14], [28, 38], [72, 38], [28, 62], [72, 62], [28, 86], [72, 86]],
    9: [[24, 16], [50, 16], [76, 16], [24, 50], [50, 50], [76, 50], [24, 84], [50, 84], [76, 84]],
  }
  const pts = positions[n] ?? positions[1]
  const r = n >= 8 ? 10.5 : n >= 6 ? 12 : n === 1 ? 24 : n <= 3 ? 14.5 : 13

  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={`${gid}-dot-red`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ff8a8a" />
          <stop offset="40%" stopColor="#e82038" />
          <stop offset="100%" stopColor="#8c0c1c" />
        </radialGradient>
        <radialGradient id={`${gid}-dot-blue`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#8ec5ff" />
          <stop offset="40%" stopColor="#1f78e8" />
          <stop offset="100%" stopColor="#0a3a8c" />
        </radialGradient>
      </defs>
      {pts.map(([cx, cy], i) => (
        <Dot key={i} cx={cx} cy={cy} r={r} tone={useTone} gid={gid} />
      ))}
    </svg>
  )
}

function BambooStick({
  x,
  y0,
  y1,
  thin,
  gid,
}: {
  x: number
  y0: number
  y1: number
  thin?: boolean
  gid: string
}) {
  const w = thin ? 9 : 12
  return (
    <g>
      <line
        x1={x + 1.2}
        y1={y0 + 1}
        x2={x + 1.2}
        y2={y1 + 1}
        stroke="rgba(20,50,30,0.18)"
        strokeWidth={w}
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={y0}
        x2={x}
        y2={y1}
        stroke={`url(#${gid}-bam)`}
        strokeWidth={w}
        strokeLinecap="round"
      />
      {/* leaf-like tips */}
      <ellipse cx={x} cy={y0 + 1} rx={w * 0.55} ry={w * 0.35} fill="#1f9a52" />
      <ellipse cx={x} cy={y1 - 1} rx={w * 0.55} ry={w * 0.35} fill="#0f6b38" />
      {/* joints */}
      <ellipse cx={x} cy={(y0 + y1) / 2} rx={w * 0.95} ry={2.6} fill="#0a5230" />
      <ellipse
        cx={x}
        cy={y0 + (y1 - y0) * 0.28}
        rx={w * 0.78}
        ry={1.9}
        fill="#178a48"
      />
      <ellipse
        cx={x}
        cy={y0 + (y1 - y0) * 0.72}
        rx={w * 0.78}
        ry={1.9}
        fill="#178a48"
      />
      <line
        x1={x - w * 0.22}
        y1={y0 + 4}
        x2={x - w * 0.22}
        y2={y1 - 4}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  )
}

function BambooPattern({ n }: { n: number }) {
  const gid = useId().replace(/:/g, '')
  const cols = n <= 3 ? n : 3
  const rows = Math.ceil(n / cols)
  const sticks: { x: number; y0: number; y1: number }[] = []
  let left = n
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, left)
    for (let c = 0; c < inRow; c++) {
      const x = 50 + (c - (inRow - 1) / 2) * 26
      const y0 = 8 + r * (78 / rows)
      const y1 = y0 + 66 / rows
      sticks.push({ x, y0, y1 })
    }
    left -= inRow
  }
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-bam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0c5c30" />
          <stop offset="35%" stopColor="#34c974" />
          <stop offset="70%" stopColor="#1a9a52" />
          <stop offset="100%" stopColor="#0a4a28" />
        </linearGradient>
      </defs>
      {sticks.map((s, i) => (
        <BambooStick key={i} {...s} thin={n >= 7} gid={gid} />
      ))}
    </svg>
  )
}

function BambooBird() {
  const gid = useId().replace(/:/g, '')
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-bird`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5aef9a" />
          <stop offset="55%" stopColor="#22b86a" />
          <stop offset="100%" stopColor="#0d6b38" />
        </linearGradient>
        <radialGradient id={`${gid}-belly`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#b8f5d0" />
          <stop offset="100%" stopColor="#2db86a" />
        </radialGradient>
      </defs>
      {/* soft ground shadow */}
      <ellipse cx={50} cy={90} rx={28} ry={5} fill="rgba(40,30,20,0.1)" />
      <ellipse cx={50} cy={60} rx={26} ry={30} fill={`url(#${gid}-bird)`} />
      <ellipse cx={50} cy={62} rx={16} ry={18} fill={`url(#${gid}-belly)`} opacity={0.85} />
      <ellipse cx={50} cy={34} rx={17} ry={19} fill="#1f9a52" />
      <circle cx={44} cy={31} r={3.2} fill="#0a2e18" />
      <circle cx={45} cy={30} r={1.1} fill="#fff" />
      <path
        d="M50 12 C64 -2, 86 6, 86 26 C70 18, 58 22, 50 34 Z"
        fill="#3dd87a"
      />
      <path
        d="M50 12 C36 -2, 14 6, 14 26 C30 18, 42 22, 50 34 Z"
        fill="#28b86a"
      />
      <path d="M68 66 Q92 76 80 94 Q66 80 64 72 Z" fill="#0d6b38" />
      <path d="M32 66 Q8 76 20 94 Q34 80 36 72 Z" fill="#0d6b38" />
      <circle cx={80} cy={24} r={5} fill="#e82038" stroke="#fff" strokeWidth={1.2} />
      <path d="M58 36 L68 34" stroke="#0a2e18" strokeWidth={2.2} strokeLinecap="round" />
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
  const gid = useId().replace(/:/g, '')
  return (
    <svg className="tile-pattern" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-wd`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a44" />
          <stop offset="50%" stopColor="#6a6a78" />
          <stop offset="100%" stopColor="#1e1e28" />
        </linearGradient>
      </defs>
      <rect
        x={12}
        y={10}
        width={76}
        height={80}
        rx={8}
        fill="none"
        stroke={`url(#${gid}-wd)`}
        strokeWidth={8}
      />
      <rect
        x={22}
        y={20}
        width={56}
        height={60}
        rx={4}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={2}
      />
      {/* soft inner fill so it reads as porcelain */}
      <rect x={24} y={22} width={52} height={56} rx={3} fill="rgba(255,255,255,0.35)" />
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
        suit === 'winds' ? 'honor-wind' : '',
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

  if (suit === 'dots') return <DotsPattern n={value} />
  if (suit === 'bamboo') {
    if (value === 1) return <BambooBird />
    return <BambooPattern n={value} />
  }
  if (suit === 'characters') return <CharStack symbol={symbol} />
  if (suit === 'dragons' && value === 2) return <WhiteDragon />
  return <HonorGlyph symbol={symbol} color={color} suit={suit} />
}

export function TileFaceContent({ tile }: { tile: BoardTile }) {
  return (
    <span className={`tile-face suit-face-${tile.face.suit}`}>
      <span className="tile-face-inner">
        <span className="tile-face-sheen" aria-hidden />
        {renderFaceDecor(tile.face)}
      </span>
    </span>
  )
}
