import React from "react";

export default function SealSequence({ sequence, progress }) {
  const nextSeal   = progress?.next_required_seal;
  const errors     = progress?.errors ?? 0;
  const matchRatio =
    progress && progress.total_required > 0
      ? progress.matched_count / progress.total_required
      : 0;

  return (
    <div className="panel">
      <div className="row-between">
        <h3 className="panel-title">Seal Sequence</h3>
        <span className="tiny-note">Max 6 signs tracked</span>
      </div>

      {sequence.length === 0 ? (
        <p className="panel-placeholder">
          Perform hand signs in front of the camera to begin. 🤲
        </p>
      ) : (
        <div className="sequence-row">
          {sequence.map((seal, index) => (
            <span
              key={`${seal}-${index}`}
              className={`seal-badge ${index === sequence.length - 1 ? "latest" : ""}`}
            >
              {seal}
            </span>
          ))}
        </div>
      )}

      {progress && (
        <div className="progress-box">
          <div className="progress-line">
            Target: <strong>{progress.target_jutsu}</strong>
          </div>

          {/* FIX: Visual progress bar so users see % completion at a glance. */}
          <div className="progress-track" aria-label="Sequence progress">
            <div
              className="progress-fill"
              style={{ width: `${Math.round(matchRatio * 100)}%` }}
            />
          </div>

          <div className="progress-line">
            Progress: {progress.matched_count}/{progress.total_required}
            {" "}
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              ({Math.round(matchRatio * 100)}%)
            </span>
          </div>

          {/* FIX: Show error count so users know a fuzzy match is in progress. */}
          {errors > 0 && (
            <div className="progress-line" style={{ color: "var(--warning, #f5a623)" }}>
              ⚠ {errors} sign{errors > 1 ? "s" : ""} misread — keep going
            </div>
          )}

          {nextSeal && (
            <div className="progress-line">
              Next seal: <strong>{nextSeal}</strong>
            </div>
          )}

          {!nextSeal && (
            <div className="progress-line" style={{ color: "var(--cyan)" }}>
              ✦ Sequence complete — release!
            </div>
          )}

          {/* FIX: Show the full required sequence so users can self-correct. */}
          {progress.required_sequence && (
            <div className="progress-line required-sequence">
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                Required:{" "}
                {progress.required_sequence.map((s, i) => (
                  <span
                    key={i}
                    className={
                      i < progress.matched_count
                        ? "req-seal req-seal--done"
                        : i === progress.matched_count
                        ? "req-seal req-seal--next"
                        : "req-seal"
                    }
                  >
                    {s}
                    {i < progress.required_sequence.length - 1 ? " → " : ""}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}