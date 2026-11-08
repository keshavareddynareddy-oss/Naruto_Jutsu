import React from "react";

// FIX: Added confidence display and visual confidence bar so users can see
// in real-time whether the model is reading their sign clearly.
// Previously there was no feedback when confidence was low, making it
// impossible to tell if a low score was causing signs to be rejected.

const CONFIDENCE_THRESHOLDS = {
  high:   0.85,
  medium: 0.72,
};

function getConfidenceTier(confidence) {
  if (confidence >= CONFIDENCE_THRESHOLDS.high)   return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "low";
}

function getConfidenceLabel(tier) {
  return { high: "Strong read", medium: "Acceptable", low: "Weak — hold still" }[tier];
}

export default function SealDisplay({ seal, confidence = 0 }) {
  const tier = seal ? getConfidenceTier(confidence) : "low";
  const pct  = Math.round(confidence * 100);

  return (
    <div className={`seal-display seal-display--${tier}`}>
      <div className="detect-label">Current Seal</div>

      <div className="seal-name">
        {seal ?? <span className="seal-none">None</span>}
      </div>

      {/* FIX: Confidence bar — gives users instant feedback on sign quality. */}
      <div className="confidence-bar-wrap" aria-label={`Confidence ${pct}%`}>
        <div
          className={`confidence-bar confidence-bar--${tier}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`confidence-label confidence-label--${tier}`}>
        {seal
          ? `${pct}% — ${getConfidenceLabel(tier)}`
          : "No hand detected"}
      </div>
    </div>
  );
}