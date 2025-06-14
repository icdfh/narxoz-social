// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }
  componentDidCatch(err, info) {
    console.error("Ошибка в компоненте:", info.componentStack, err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "white", background: "#C10029" }}>
          <h2>Что-то пошло не так в чате</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
