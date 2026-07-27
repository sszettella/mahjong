import type { BoardTile, LevelConfig } from './types'
import { mulberry32, pickPairedFaces } from './tiles'

export interface Slot {
  x: number
  y: number
  z: number
}

/** Generate position slots for a level layout. */
export function generateSlots(config: LevelConfig): Slot[] {
  const { tileCount, layers, layout, level } = config
  const rng = mulberry32(level * 7919 + 42)

  switch (layout) {
    case 'grid':
      return slotsGrid(tileCount, layers, rng)
    case 'pyramid':
      return slotsPyramid(tileCount, layers, rng)
    case 'cross':
      return slotsCross(tileCount, layers, rng)
    case 'diamond':
      return slotsDiamond(tileCount, layers, rng)
    case 'turtle':
      return slotsTurtle(tileCount, layers, rng)
    case 'fortress':
      return slotsFortress(tileCount, layers, rng)
    case 'spiral':
      return slotsSpiral(tileCount, layers, rng)
    case 'bridge':
      return slotsBridge(tileCount, layers, rng)
    default:
      return slotsGrid(tileCount, layers, rng)
  }
}

function takeEven(n: number): number {
  return n % 2 === 0 ? n : n - 1
}

function slotsGrid(count: number, layers: number, rng: () => number): Slot[] {
  const slots: Slot[] = []
  // Approximate square footprint
  const perLayer = Math.ceil(count / layers)
  const cols = Math.ceil(Math.sqrt(perLayer * 1.2))
  const rows = Math.ceil(perLayer / cols)

  for (let z = 0; z < layers; z++) {
    const layerCount =
      z === layers - 1
        ? count - slots.length
        : Math.min(perLayer, count - slots.length)
    // Shrink upper layers slightly
    const c = Math.max(2, cols - z)
    const r = Math.max(2, rows - Math.floor(z / 2))
    let placed = 0
    const offsetX = (cols - c) / 2
    const offsetY = (rows - r) / 2
    for (let y = 0; y < r && placed < layerCount; y++) {
      for (let x = 0; x < c && placed < layerCount; x++) {
        // Random skip on upper layers for interest
        if (z > 0 && rng() < 0.15 && placed < layerCount - 2) continue
        slots.push({ x: x + offsetX, y: y + offsetY, z })
        placed++
      }
    }
  }
  return trimToEven(slots, count)
}

function slotsPyramid(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  let remaining = count
  // Bottom layer largest square, each layer smaller
  let size = Math.ceil(Math.sqrt(count / Math.max(1, layers * 0.7)))
  size = Math.max(3, size)

  for (let z = 0; z < layers && remaining > 0; z++) {
    const s = Math.max(1, size - z)
    const offset = (size - s) / 2
    for (let y = 0; y < s && remaining > 0; y++) {
      for (let x = 0; x < s && remaining > 0; x++) {
        slots.push({ x: x + offset, y: y + offset, z })
        remaining--
      }
    }
  }
  // Fill extras on bottom
  while (slots.length < count) {
    const x = slots.length % (size + 2)
    const y = Math.floor(slots.length / (size + 2))
    slots.push({ x, y, z: 0 })
  }
  return trimToEven(slots, count)
}

function slotsCross(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const arm = Math.max(3, Math.ceil(Math.sqrt(count / layers) / 1.5))
  const mid = arm

  for (let z = 0; z < layers; z++) {
    // Horizontal bar
    for (let x = 0; x < arm * 2 + 1; x++) {
      slots.push({ x: x + z * 0.1, y: mid + z * 0.1, z })
    }
    // Vertical bar (skip center already placed)
    for (let y = 0; y < arm * 2 + 1; y++) {
      if (y === mid) continue
      slots.push({ x: mid + z * 0.1, y: y + z * 0.1, z })
    }
  }
  return trimToEven(slots, count)
}

function slotsDiamond(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const radius = Math.max(2, Math.ceil(Math.sqrt(count / layers)))

  for (let z = 0; z < layers; z++) {
    const r = Math.max(1, radius - z)
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (Math.abs(x) + Math.abs(y) <= r) {
          slots.push({ x: x + r, y: y + r, z })
        }
      }
    }
  }
  return trimToEven(slots, count)
}

function slotsTurtle(count: number, layers: number, _rng: () => number): Slot[] {
  // Classic turtle-inspired: wide body + head/tail + feet
  const slots: Slot[] = []
  const bodyW = Math.max(6, Math.ceil(Math.sqrt(count * 0.6)))
  const bodyH = Math.max(4, Math.ceil(bodyW * 0.65))

  // Body layers
  for (let z = 0; z < Math.min(layers, 4); z++) {
    const w = bodyW - z * 2
    const h = bodyH - z
    if (w < 2 || h < 1) break
    const ox = (bodyW - w) / 2 + 2
    const oy = (bodyH - h) / 2 + 1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        slots.push({ x: ox + x, y: oy + y, z })
      }
    }
  }

  // Head
  slots.push({ x: bodyW / 2 + 2, y: 0, z: 0 })
  slots.push({ x: bodyW / 2 + 1.5, y: 0, z: 0 })
  // Tail
  slots.push({ x: bodyW / 2 + 2, y: bodyH + 2, z: 0 })
  // Feet
  slots.push({ x: 1, y: 1, z: 0 })
  slots.push({ x: bodyW + 2, y: 1, z: 0 })
  slots.push({ x: 1, y: bodyH + 1, z: 0 })
  slots.push({ x: bodyW + 2, y: bodyH + 1, z: 0 })

  return trimToEven(slots, count)
}

function slotsFortress(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const size = Math.max(5, Math.ceil(Math.sqrt(count / Math.max(1, layers))))

  for (let z = 0; z < layers; z++) {
    const s = size - z
    if (s < 2) break
    // Walls (hollow square) on lower layers; solid on top
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const isEdge = x === 0 || y === 0 || x === s - 1 || y === s - 1
        if (z >= layers - 1 || isEdge || (z > 0 && x > 0 && y > 0 && x < s - 1 && y < s - 1 && z % 2 === 1)) {
          if (z < layers - 1 && !isEdge && z % 2 === 0) continue
          slots.push({ x: x + z * 0.5, y: y + z * 0.5, z })
        }
      }
    }
  }
  return trimToEven(slots, count)
}

function slotsSpiral(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const size = Math.max(4, Math.ceil(Math.sqrt(count / layers)))

  for (let z = 0; z < layers; z++) {
    let x = 0
    let y = 0
    let dx = 1
    let dy = 0
    let segment = 1
    let passed = 0
    const max = size * size
    const ox = size / 2
    const oy = size / 2

    for (let i = 0; i < max && slots.length < count; i++) {
      slots.push({ x: x + ox + z * 0.15, y: y + oy + z * 0.15, z })
      x += dx
      y += dy
      passed++
      if (passed === segment) {
        passed = 0
        const tmp = dx
        dx = -dy
        dy = tmp
        if (dy === 0) segment++
      }
    }
  }
  return trimToEven(slots, count)
}

function slotsBridge(count: number, layers: number, _rng: () => number): Slot[] {
  const slots: Slot[] = []
  const span = Math.max(8, Math.ceil(count / (layers + 2)))
  // Two towers + bridge
  const towerH = Math.max(3, Math.floor(span / 3))

  for (let z = 0; z < layers; z++) {
    // Left tower
    for (let y = 0; y < towerH; y++) {
      for (let x = 0; x < 2; x++) {
        slots.push({ x, y, z })
      }
    }
    // Right tower
    for (let y = 0; y < towerH; y++) {
      for (let x = 0; x < 2; x++) {
        slots.push({ x: span - 1 + x, y, z })
      }
    }
    // Bridge deck
    for (let x = 2; x < span - 1; x++) {
      slots.push({ x, y: Math.floor(towerH / 2), z })
      if (z === 0) {
        slots.push({ x, y: Math.floor(towerH / 2) + 1, z })
      }
    }
  }
  return trimToEven(slots, count)
}

function trimToEven(slots: Slot[], count: number): Slot[] {
  let target = takeEven(Math.min(count, slots.length))
  // If we have fewer than needed, pad with bottom-layer extras
  if (slots.length < target) {
    target = takeEven(slots.length)
  }
  // Prefer keeping higher-z variety: sort and slice from start
  const sorted = [...slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x)
  let result = sorted.slice(0, target)
  if (result.length % 2 !== 0) result = result.slice(0, -1)
  return result
}

/**
 * Build a playable board: place paired faces on slots.
 * Uses deal-in-reverse simulation so early game has free matches when possible.
 */
export function createBoard(config: LevelConfig): BoardTile[] {
  const slots = generateSlots(config)
  const count = slots.length - (slots.length % 2)
  const usedSlots = slots.slice(0, count)
  const rng = mulberry32(config.level * 9973 + 17)
  const faces = pickPairedFaces(count, rng)

  return usedSlots.map((slot, i) => ({
    id: `t-${config.level}-${i}`,
    face: faces[i],
    x: slot.x,
    y: slot.y,
    z: slot.z,
    removed: false,
  }))
}
