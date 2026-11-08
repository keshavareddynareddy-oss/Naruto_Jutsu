import { SIGN_IMAGE_BY_NAME, ZODIAC_SEALS } from "../data/jutsuData";

export default function SignGuide({ highlightedSeal, nextSeal, onSelectSeal, practiceEnabled }) {
  return (
    <div className="panel">
      <div className="row-between">
        <h3 className="panel-title">Hand Sign Guide</h3>
        <span className="tiny-note">{practiceEnabled ? "Tap to weave" : "Live tracking"}</span>
      </div>

      <div className="sign-grid">
        {ZODIAC_SEALS.map((name) => {
          const isActive = highlightedSeal === name;
          const isNext = nextSeal === name;
          return (
            <button
              type="button"
              key={name}
              className={`sign-card ${isActive ? "active" : ""} ${isNext ? "next" : ""}`}
              onClick={() => onSelectSeal?.(name)}
              disabled={!practiceEnabled}
            >
              <img src={SIGN_IMAGE_BY_NAME[name]} alt={`${name} hand seal`} loading="lazy" />
              <p>{name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
