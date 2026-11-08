export default function Header({ activeJutsuName, backendOk, muted, onToggleMute, onShowHelp }) {
  return (
    <div className="header-container">
      <div className="header-left">
        <div className="logo" title="Hidden Seal Nexus">忍</div>
        <div>
          <h1 className="title">Hidden Seal Nexus</h1>
          <p className="subtitle">Perform signs · Build sequence · Release jutsu</p>
        </div>
      </div>

      <div className="header-right">
        <span className={`status-pill ${backendOk ? "live" : "idle"}`}>
          {backendOk == null ? "Connecting" : backendOk ? "Nexus Online" : "Practice Mode"}
        </span>
        <button className="ghost-btn" type="button" onClick={onToggleMute} aria-pressed={muted}>
          {muted ? "Sound Off" : "Sound On"}
        </button>
        <button className="ghost-btn" type="button" onClick={onShowHelp}>
          How to weave
        </button>
        <div className={`header-status ${activeJutsuName ? "active" : ""}`}>
          {activeJutsuName ? (
            <>
              <span className="header-status-kicker">ACTIVATED ✦</span>
              <br />
              {activeJutsuName}
            </>
          ) : (
            "Awaiting Chakra Flow"
          )}
        </div>
      </div>
    </div>
  );
}
