import type { StorageSlots } from '../types'
import { STORAGE_SAFE_MAX, STORAGE_SIZE } from '../types'
import { faceKey } from '../tiles'
import { TileFaceContent } from './TileFace'

interface Props {
  storage: StorageSlots
  hintIds: string[]
  matchingIds?: string[]
  /** Id of a board tile just parked — flash the slot that received it */
  parkFlashId?: string | null
  failed?: boolean
}

export function StorageRack({
  storage,
  hintIds,
  matchingIds = [],
  parkFlashId = null,
  failed,
}: Props) {
  const filled = storage.filter(Boolean).length
  const matchSet = new Set(matchingIds)
  const atLimit = filled >= STORAGE_SAFE_MAX

  return (
    <div
      className={[
        'storage-rack',
        failed ? 'storage-full-fail' : '',
        atLimit ? 'storage-at-limit' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={`Storage, ${filled} of ${STORAGE_SAFE_MAX} safe slots. A 4th tile fails the level.`}
    >
      <div className="storage-label">
        <span>Storage</span>
        <span className={`storage-count ${atLimit ? 'at-limit' : ''}`}>
          {filled}/{STORAGE_SAFE_MAX}
          <span className="storage-fail-hint"> · 4th fails</span>
        </span>
      </div>
      <div className="storage-slots">
        {Array.from({ length: STORAGE_SIZE }, (_, i) => {
          const tile = storage[i]
          const isDangerSlot = i === STORAGE_SAFE_MAX // 4th slot (index 3)

          if (tile) {
            const hinted = hintIds.includes(tile.id)
            const matching = matchSet.has(tile.id)
            const justParked = parkFlashId === tile.id
            return (
              <div
                key={tile.id}
                className={[
                  'mahjong-tile',
                  'storage-tile',
                  'free',
                  'storage-tile-static',
                  hinted ? 'hinted' : '',
                  matching ? 'is-matching-out' : '',
                  justParked ? 'just-parked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`${tile.face.label} in storage`}
                data-face={faceKey(tile.face)}
              >
                <TileFaceContent tile={tile} />
                {matching && <span className="tile-match-glow" aria-hidden />}
              </div>
            )
          }

          return (
            <div
              key={`empty-${i}`}
              className={[
                'storage-slot-empty',
                isDangerSlot ? 'storage-slot-danger' : '',
                atLimit && isDangerSlot ? 'storage-slot-danger-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={
                isDangerSlot
                  ? 'Danger slot — parking a 4th tile fails the level'
                  : `Empty storage slot ${i + 1}`
              }
            >
              <span className="slot-plus">{isDangerSlot ? '!' : '+'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
