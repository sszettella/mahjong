interface Props {
  onBack: () => void
}

export function HowToPlay({ onBack }: Props) {
  return (
    <div className="screen how-to">
      <header className="screen-header">
        <button type="button" className="btn-icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h2>How to Play</h2>
        <span className="header-spacer" />
      </header>

      <div className="how-content">
        <section>
          <h3>Goal</h3>
          <p>Clear every tile using the 4-slot storage. Complete all 100 levels!</p>
        </section>
        <section>
          <h3>Tap a free tile</h3>
          <p>
            Free tiles have nothing on top and are not blocked on both the left and right.
            When you tap one:
          </p>
          <ol className="how-list">
            <li>
              <strong>Match</strong> — if the same face is already in storage, both are cleared.
            </li>
            <li>
              <strong>Store</strong> — otherwise it parks in storage (you can hold up to 3).
            </li>
            <li>
              <strong>Fail</strong> — a 4th tile into storage with no match loses the level.
            </li>
          </ol>
        </section>
        <section>
          <h3>Storage (3 safe · 4th fails)</h3>
          <p>
            Storage holds unmatched free tiles. You may park up to 3. If you tap a free tile that
            does not match storage while 3 are already stored, that 4th tile fails the level.
            Clear pairs from storage before it fills.
          </p>
        </section>
        <section>
          <h3>Matching</h3>
          <p>
            Only identical faces match — same suit and number/symbol. If two tiles look
            different, they are not a pair.
          </p>
        </section>
        <section>
          <h3>Tools</h3>
          <p>
            <strong>Hint</strong> shows a useful free tile (or a storage match).
            <strong> Undo</strong> reverses the last tap. Shuffle reshuffles board faces only.
          </p>
        </section>
        <section>
          <h3>Stars</h3>
          <p>
            Earn up to 3 stars per level. Perfect play is about one park + one match for each
            pair, with no hints and few undos. Extra parking or thrashing costs stars.
          </p>
        </section>
        <section>
          <h3>No ads</h3>
          <p>Completely free, no advertisements. Progress is saved only on this device.</p>
        </section>
      </div>
    </div>
  )
}
