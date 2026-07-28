import type { TileFace } from './types'

const CHARS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

export const WINDS = [
  { value: 0, label: 'East', symbol: '東', color: '#1a4db8' },
  { value: 1, label: 'South', symbol: '南', color: '#0d8a45' },
  { value: 2, label: 'West', symbol: '西', color: '#c43a00' },
  { value: 3, label: 'North', symbol: '北', color: '#6b2d9b' },
]

export const DRAGONS = [
  { value: 0, label: 'Red', symbol: '中', color: '#c8102e' },
  { value: 1, label: 'Green', symbol: '發', color: '#0d8a45' },
  { value: 2, label: 'White', symbol: '白', color: '#2a2a32' },
]

export const FLOWERS = [
  { value: 0, label: 'Plum', symbol: '梅', color: '#d40d2a' },
  { value: 1, label: 'Orchid', symbol: '蘭', color: '#1557c0' },
  { value: 2, label: 'Chrysanthemum', symbol: '菊', color: '#d4940a' },
  { value: 3, label: 'Bamboo Flower', symbol: '竹', color: '#0d8a45' },
]

export const SEASONS = [
  { value: 0, label: 'Spring', symbol: '春', color: '#0d8a45' },
  { value: 1, label: 'Summer', symbol: '夏', color: '#d4940a' },
  { value: 2, label: 'Autumn', symbol: '秋', color: '#c43a00' },
  { value: 3, label: 'Winter', symbol: '冬', color: '#1557c0' },
]

const DOT_COLORS = [
  '#c8102e', '#c8102e', '#1a4db8', '#1a4db8', '#c8102e',
  '#1a4db8', '#c8102e', '#1a4db8', '#c8102e',
]

/** Build the full 144-tile face pool (4 of each regular, 1 of each flower/season). */
export function buildFullFacePool(): TileFace[] {
  const faces: TileFace[] = []

  for (let v = 1; v <= 9; v++) {
    for (let i = 0; i < 4; i++) {
      faces.push({
        suit: 'dots',
        value: v,
        label: `Dots ${v}`,
        symbol: String(v),
        color: DOT_COLORS[v - 1],
      })
      faces.push({
        suit: 'bamboo',
        value: v,
        label: `Bamboo ${v}`,
        symbol: v === 1 ? '鳥' : String(v),
        color: '#26a269',
      })
      faces.push({
        suit: 'characters',
        value: v,
        label: `Characters ${v}`,
        symbol: CHARS[v - 1],
        color: '#c01c28',
      })
    }
  }

  for (const w of WINDS) {
    for (let i = 0; i < 4; i++) {
      faces.push({
        suit: 'winds',
        value: w.value,
        label: w.label,
        symbol: w.symbol,
        color: w.color,
      })
    }
  }

  for (const d of DRAGONS) {
    for (let i = 0; i < 4; i++) {
      faces.push({
        suit: 'dragons',
        value: d.value,
        label: d.label,
        symbol: d.symbol,
        color: d.color,
      })
    }
  }

  for (const f of FLOWERS) {
    faces.push({
      suit: 'flowers',
      value: f.value,
      label: f.label,
      symbol: f.symbol,
      color: f.color,
    })
  }

  for (const s of SEASONS) {
    faces.push({
      suit: 'seasons',
      value: s.value,
      label: s.label,
      symbol: s.symbol,
      color: s.color,
    })
  }

  return faces
}

/**
 * Two faces match only when they look the same: same suit + same value.
 * (Previously flowers/seasons matched as wild groups, so e.g. Plum could
 * match Orchid — correct for classic solitaire, but looked like a bug.)
 */
export function facesMatch(a: TileFace, b: TileFace): boolean {
  return a.suit === b.suit && a.value === b.value
}

/** Stable key for pairing deals — must match facesMatch identity. */
export function faceKey(f: TileFace): string {
  return `${f.suit}-${f.value}`
}

/** Shuffle array (Fisher–Yates). */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Seeded PRNG for reproducible levels. */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick `count` faces that form valid pairs from the full pool. */
export function pickPairedFaces(count: number, rng: () => number): TileFace[] {
  if (count % 2 !== 0) throw new Error('Tile count must be even')
  const pool = buildFullFacePool()
  // Group by match key
  const groups = new Map<string, TileFace[]>()
  for (const f of pool) {
    const k = faceKey(f)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(f)
  }

  const keys = shuffle([...groups.keys()], rng)
  const result: TileFace[] = []
  let need = count

  // Prefer taking pairs from larger groups
  for (const key of keys) {
    if (need <= 0) break
    const group = groups.get(key)!
    const pairsAvailable = Math.floor(group.length / 2)
    const takePairs = Math.min(pairsAvailable, Math.floor(need / 2))
    for (let p = 0; p < takePairs; p++) {
      result.push(group[p * 2], group[p * 2 + 1])
      need -= 2
    }
  }

  // If still short (shouldn't happen), duplicate pairs
  while (need > 0) {
    const key = keys[Math.floor(rng() * keys.length)]
    const group = groups.get(key)!
    result.push({ ...group[0] }, { ...group[0] })
    need -= 2
  }

  return shuffle(result, rng)
}

