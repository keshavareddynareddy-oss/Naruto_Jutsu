import React, { useEffect, useRef } from "react";

const ELEMENT_ICONS = {
  fire: "🔥",
  shadow: "🌑",
  water: "💧",
  lightning: "⚡",
  wind: "🌪",
  earth: "🪨",
};

const AUTO_DISMISS_MS = 4200;

export default function JutsuEffect({ jutsu, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!jutsu?.name) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (typeof onDismiss === "function") {
      timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jutsu, onDismiss]);

  if (!jutsu?.name) return null;

  const type = jutsu.type?.toLowerCase() ?? "default";
  const icon = ELEMENT_ICONS[type] ?? "✦";

  return (
    <div className={`jutsu-overlay jutsu-overlay--${type}`} role="status" aria-live="polite">
      <div className={`jutsu-effect jutsu-effect--${type}`}>
        <div className="jutsu-effect-kicker">JUTSU ACTIVATED</div>
        <h2>
          {icon} {jutsu.name}
        </h2>
        {(jutsu.japaneseName || jutsu.japanese_name) && (
          <p className="jutsu-japanese">{jutsu.japaneseName || jutsu.japanese_name}</p>
        )}
        <p className="jutsu-chant">{jutsu.chant || `${jutsu.type} chakra resonance detected.`}</p>
        <p>{jutsu.description || "Seal sequence complete."}</p>
        {typeof onDismiss === "function" && (
          <button className="jutsu-dismiss-btn" onClick={onDismiss} aria-label="Dismiss jutsu notification">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
