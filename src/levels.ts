import type { LevelConfig } from './types'

const LAYOUTS: LevelConfig['layout'][] = [
  'grid',
  'pyramid',
  'cross',
  'diamond',
  'turtle',
  'fortress',
  'spiral',
  'bridge',
]

const NAMES = [
  'First Steps', 'Gentle Path', 'Morning Light', 'Quiet Pond', 'Bamboo Grove',
  'Cherry Blossom', 'Stone Garden', 'Temple Gate', 'Lantern Walk', 'Misty Hills',
  'Jade Stream', 'Crane Nest', 'Lotus Lake', 'Silk Road', 'Golden Peak',
  'Dragon Gate', 'Phoenix Rise', 'Tiger Den', 'Turtle Island', 'Koi Pond',
  'Moon Bridge', 'Star Court', 'Cloud Palace', 'Wind Temple', 'Fire Shrine',
  'Water Gate', 'Earth Hall', 'Metal Forge', 'Wood Grove', 'Spirit Path',
  'Hidden Cove', 'Crystal Cave', 'Amber Forest', 'Silver Peak', 'Copper Mine',
  'Iron Bridge', 'Pearl Harbor', 'Ruby Nest', 'Emerald Isle', 'Sapphire Bay',
  'Opal Garden', 'Topaz Tower', 'Amethyst Hall', 'Diamond Peak', 'Onyx Gate',
  'Ivory Path', 'Ebony Grove', 'Coral Reef', 'Jade Emperor', 'Silk Empress',
  'Paper Crane', 'Ink Scroll', 'Tea House', 'Rice Field', 'Plum Orchard',
  'Pine Ridge', 'Willow Bank', 'Maple Grove', 'Cedar Peak', 'Oak Temple',
  'Mountain Pass', 'River Bend', 'Desert Wind', 'Ocean Tide', 'Glacier Edge',
  'Volcano Rim', 'Canyon Deep', 'Prairie Wide', 'Tundra Frost', 'Rainforest',
  'Savanna', 'Archipelago', 'Peninsula', 'Isthmus', 'Delta',
  'Fjord', 'Plateau', 'Mesa', 'Butte', 'Dune',
  'Cliff', 'Cave', 'Grotto', 'Ravine', 'Gorge',
  'Summit', 'Valley', 'Basin', 'Ridge', 'Spur',
  'Crest', 'Slope', 'Col', 'Saddle', 'Notch',
  'Final Ascent', 'Master Court', 'Grand Temple', 'Celestial Hall', 'Legend',
]

function tileCountForLevel(level: number): number {
  // Progressive difficulty: 12 tiles → full 144-tile boards
  let count: number
  if (level <= 10) {
    count = 12 + (level - 1) * 2 // 12–30
  } else if (level <= 30) {
    count = 32 + Math.floor((level - 11) * 1.6) // ~32–62
  } else if (level <= 60) {
    count = 64 + Math.floor((level - 31) * 1.2) // ~64–99
  } else if (level <= 90) {
    count = 100 + Math.floor((level - 61) * 0.95) // ~100–127
  } else {
    count = 128 + Math.floor((level - 91) * 1.7) // ~128–144
  }
  count = Math.min(144, Math.max(12, count))
  if (count % 2 !== 0) count++
  return count
}

function layersForLevel(level: number): number {
  if (level <= 5) return 1
  if (level <= 20) return 2
  if (level <= 50) return 3
  if (level <= 80) return 4
  return 5
}

function layoutForLevel(level: number): LevelConfig['layout'] {
  if (level <= 5) return 'grid'
  if (level <= 12) return LAYOUTS[(level - 1) % 3]
  return LAYOUTS[(level + 2) % LAYOUTS.length]
}

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(100, level))
  return {
    level: clamped,
    name: NAMES[clamped - 1] ?? `Level ${clamped}`,
    tileCount: tileCountForLevel(clamped),
    layers: layersForLevel(clamped),
    layout: layoutForLevel(clamped),
    hint:
      clamped <= 10
        ? 'Match free identical tiles. Free tiles are not blocked on both sides.'
        : clamped <= 40
          ? 'Look for tiles on top layers — they are often free first.'
          : 'Plan ahead. Use hints sparingly — stars reward efficiency!',
  }
}

export function getAllLevels(): LevelConfig[] {
  return Array.from({ length: 100 }, (_, i) => getLevelConfig(i + 1))
}

export function starsForLevel(
  level: number,
  moves: number,
  hintsUsed: number,
  undosUsed: number,
  tileCount: number,
): number {
  const minMoves = tileCount / 2
  const efficiency = moves / Math.max(1, minMoves)
  let stars = 3
  if (hintsUsed > 0 || undosUsed > 2) stars = Math.min(stars, 2)
  if (hintsUsed > 2 || undosUsed > 5) stars = Math.min(stars, 1)
  if (efficiency > 1.5) stars = Math.min(stars, 2)
  if (efficiency > 2.2) stars = Math.min(stars, 1)
  if (level >= 50 && (hintsUsed > 0 || undosUsed > 0)) stars = Math.min(stars, 2)
  return Math.max(1, stars)
}
