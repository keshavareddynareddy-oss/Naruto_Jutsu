export default function Academy({ selectedJutsu }) {
  return (
    <div className="panel academy-panel">
      <h3 className="panel-title">Ninja Academy</h3>
      <ol className="academy-steps">
        <li>Start the camera or tap seals in the guide to practice.</li>
        <li>Hold each sign still until it commits to the sequence.</li>
        <li>Follow a jutsu scroll left-to-right, then release.</li>
      </ol>
      {selectedJutsu ? (
        <p className="academy-focus">
          Training focus: <strong>{selectedJutsu.name}</strong> — {selectedJutsu.seals.join(" → ")}
        </p>
      ) : (
        <p className="tiny-note">Pick a jutsu scroll to pin its seal path.</p>
      )}
    </div>
  );
}
