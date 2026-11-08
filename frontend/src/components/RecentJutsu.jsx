import React from "react";

export default function RecentJutsu({ history }) {
  return (
    <div className="panel">
      <h3 className="panel-title">Recent Activations</h3>

      {history.length === 0 ? (
        <p className="panel-placeholder">No jutsu released this session. 👁️</p>
      ) : (
        <div className="history-list">
          {history.map((jutsu, index) => (
            <div key={`${jutsu}-${index}`} className="recent-jutsu">
              {jutsu}
              {index === 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.68rem",
                    fontFamily: "Teko, sans-serif",
                    letterSpacing: "0.1em",
                    color: "var(--orange-2)",
                    opacity: 0.8,
                  }}
                >
                  LATEST
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
