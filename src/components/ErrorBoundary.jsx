import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatal-error" role="alert">
        <h1>화면을 불러오지 못했습니다</h1>
        <p>작성 중인 SQL은 브라우저에 보관되어 있습니다. 화면을 새로고침해 다시 시도해주세요.</p>
        <button type="button" onClick={() => window.location.reload()}>새로고침</button>
      </main>
    );
  }
}
