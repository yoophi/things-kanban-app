import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Sensitive todo content is intentionally not logged.
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="state-page">
          <h1>앱 화면을 표시하지 못했습니다</h1>
          <button className="primary" onClick={() => window.location.reload()}>
            다시 불러오기
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
