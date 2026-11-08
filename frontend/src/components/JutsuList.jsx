import React from "react";

const ELEMENT_ICONS = {
  fire: "🔥",
  shadow: "🌑",
  water: "💧",
  lightning: "⚡",
  wind: "🌪",
  earth: "🪨",
};

export default function JutsuList({ jutsus, activeJutsuName, progressTarget, onSelectJutsu }) {
  return (
    <div className="panel">
      <h3 className="panel-title">Jutsu Scrolls</h3>

      {jutsus.map((jutsu) => {
        const isActive = activeJutsuName === jutsu.name;
        const isTracking = progressTarget === jutsu.name;
        const icon = ELEMENT_ICONS[jutsu.type.toLowerCase()] ?? "✦";

        return (
          <button
            type="button"
            key={jutsu.name}
            className={`jutsu-item ${isActive ? "active" : ""} ${isTracking ? "tracking" : ""}`}
            onClick={() => onSelectJutsu?.(jutsu)}
          >
            <div className="jutsu-title-row">
              <div className="jutsu-title">
                {icon} {jutsu.name}
              </div>
              <span className={`element-tag ${jutsu.type.toLowerCase()}`}>
                {jutsu.type}
              </span>
            </div>
            <div className="jutsu-seals">
              {jutsu.seals.map((seal, i) => (
                <React.Fragment key={`${jutsu.name}-${seal}-${i}`}>
                  {i > 0 && <span className="seal-arrow">▶</span>}
                  {seal}
                </React.Fragment>
              ))}
            </div>
            {jutsu.description && <p className="jutsu-copy">{jutsu.description}</p>}
          </button>
        );
      })}
    </div>
  );
}
