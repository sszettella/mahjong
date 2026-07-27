export type Suit = 'dots' | 'bamboo' | 'characters' | 'winds' | 'dragons' | 'flowers' | 'seasons'

export interface TileFace {
  suit: Suit
  value: number // 1-9 for numbered, 0-3 for honors/special
  label: string
  symbol: string
  color: string
}

export interface BoardTile {
  id: string
  face: TileFace
  x: number // grid column (half-tile units for offset layouts)
  y: number // grid row
  z: number // layer (0 = bottom)
  removed: boolean
}

export interface LevelConfig {
  level: number
  name: string
  tileCount: number
  layers: number
  layout: 'grid' | 'pyramid' | 'cross' | 'diamond' | 'turtle' | 'fortress' | 'spiral' | 'bridge'
  hint: string
}

export type Screen = 'home' | 'levels' | 'game' | 'how-to-play'

export interface Progress {
  unlockedLevel: number
  completedLevels: number[]
  bestMoves: Record<number, number>
  stars: Record<number, number> // 1-3 stars per level
}

export interface GameStats {
  moves: number
  matches: number
  hintsUsed: number
  undosUsed: number
  startTime: number
}

/**
 * Vita-style temporary holding area — 4 visible slots.
 * You may safely hold 3 tiles; parking a 4th (no match) fails the level.
 */
export type StorageSlots = [BoardTile | null, BoardTile | null, BoardTile | null, BoardTile | null]

export const STORAGE_SIZE = 4
/** Max tiles you can hold without failing. The 4th park is a fail. */
export const STORAGE_SAFE_MAX = 3

export function emptyStorage(): StorageSlots {
  return [null, null, null, null]
}

export interface GameSnapshot {
  board: BoardTile[]
  storage: StorageSlots
}
