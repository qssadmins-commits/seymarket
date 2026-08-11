import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Caught render error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 40, fontFamily: "monospace" }}>
          <h2>Something broke rendering this page</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
            {String(this.state.error.stack || this.state.error.message)}
          </pre>
        </main>
      );
    }
    return this.props.children;
  }
}
