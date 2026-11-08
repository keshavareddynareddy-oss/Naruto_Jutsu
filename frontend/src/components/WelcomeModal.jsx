export default function WelcomeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <p className="welcome-kicker">Konohagakure · Ninja Academy</p>
        <h2 id="welcome-title">Weave the twelve seals. Release jutsu.</h2>
        <p className="welcome-copy">
          Hidden Seal Nexus reads one hand in your camera, commits a seal only after a
          stable hold, then matches the sequence against the village scrolls.
        </p>
        <ol className="welcome-steps">
          <li>Allow the camera, or stay in practice mode and tap the Hand Sign Guide.</li>
          <li>Hold each zodiac seal still until it appears in Seal Sequence.</li>
          <li>Try Shadow Clone first — Ox → Hare → Monkey — then work up to Fireball.</li>
        </ol>
        <button className="camera-btn" type="button" onClick={onClose}>
          Enter the Nexus
        </button>
      </div>
    </div>
  );
}
