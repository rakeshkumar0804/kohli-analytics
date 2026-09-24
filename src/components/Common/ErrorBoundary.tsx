import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card glass-card">
            <div className="error-boundary-icon" aria-hidden="true">⚠️</div>
            <h3 className="error-boundary-title">
              {this.props.fallbackTitle || 'Something went wrong rendering this section'}
            </h3>
            <p className="error-boundary-message">
              {this.props.fallbackMessage ||
                'An unexpected error occurred while processing analytics data. You can attempt to recover or reload the page.'}
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical Details</summary>
                <pre>{this.state.error.message || String(this.state.error)}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button
                type="button"
                className="error-boundary-btn error-boundary-retry-btn"
                onClick={this.handleRetry}
                aria-label="Retry rendering this section"
              >
                🔄 Retry Section
              </button>
              <button
                type="button"
                className="error-boundary-btn error-boundary-reload-btn"
                onClick={this.handleReload}
                aria-label="Reload the application"
              >
                🌐 Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
