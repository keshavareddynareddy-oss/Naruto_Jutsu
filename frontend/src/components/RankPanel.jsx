const RANKS = [
  { min: 0, title: "Academy Student", copy: "Learn the twelve seals." },
  { min: 1, title: "Genin", copy: "First jutsu released. Keep weaving." },
  { min: 3, title: "Chunin", copy: "Three techniques under your belt." },
  { min: 5, title: "Jonin", copy: "Five-element command." },
  { min: 6, title: "Hokage Candidate", copy: "Every scroll on this wall is yours." },
];

export function rankForCount(count) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (count >= rank.min) current = rank;
  }
  return current;
}

export default function RankPanel({ uniqueCount, total }) {
  const rank = rankForCount(uniqueCount);
  const percent = total > 0 ? Math.round((uniqueCount / total) * 100) : 0;

  return (
    <div className="panel rank-panel">
      <div className="row-between">
        <h3 className="panel-title">Shinobi Rank</h3>
        <span className="status-pill live">{rank.title}</span>
      </div>
      <p className="rank-copy">{rank.copy}</p>
      <div className="progress-track" aria-label="Scrolls mastered">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="tiny-note">
        {uniqueCount}/{total} unique jutsu released this session
      </p>
    </div>
  );
}
