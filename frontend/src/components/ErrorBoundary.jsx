import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#03050a",
          color: "#eef4ff",
          fontFamily: "Rajdhani, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}>
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>忍</div>
            <h1 style={{
              fontFamily: "Cinzel, serif",
              fontSize: "1.4rem",
              marginBottom: "0.8rem",
              background: "linear-gradient(90deg, #fff 20%, #ffb347, #ffd060)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Chakra Disruption Detected
            </h1>
            <p style={{ color: "#8aa0c0", marginBottom: "1.2rem", maxWidth: "400px" }}>
              Something went wrong. Refresh to re-enter the Nexus.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                appearance: "none",
                border: "none",
                borderRadius: "10px",
                padding: "0.55rem 1.4rem",
                fontFamily: "Teko, sans-serif",
                fontSize: "1.05rem",
                letterSpacing: "0.08em",
                fontWeight: 600,
                cursor: "pointer",
                background: "linear-gradient(135deg, #e86000, #ff9e2f)",
                color: "#fff",
                boxShadow: "0 4px 18px rgba(255, 110, 0, 0.35)",
              }}
            >
              Refresh
            </button>
            {this.state.error && (
              <p style={{
                marginTop: "1.2rem",
                fontSize: "0.75rem",
                color: "#5a7090",
                fontFamily: "monospace",
                maxWidth: "500px",
                wordBreak: "break-word",
              }}>
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
