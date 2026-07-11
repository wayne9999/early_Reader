import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportRuntimeError } from "../../services/errorReporting";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  eventId: string | null;
};

/**
 * Top-level React error boundary. A single crashing child component would
 * otherwise white-screen the whole app; here we render a recovery panel and
 * report the error so we can see it later.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, eventId: null };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, eventId: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportRuntimeError({
      source: "react-error-boundary",
      message: error.message,
      stack: error.stack ?? null,
      componentStack: info.componentStack ?? null
    })
      .then((eventId) => this.setState({ eventId }))
      .catch(() => undefined);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary-panel" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>We ran into a problem loading this page.</h1>
        <p>
          Refreshing usually fixes it. If it keeps happening, the Support page can help and
          your progress is safe on your account.
        </p>
        <div className="subscription-actions">
          <button className="primary-button" type="button" onClick={this.handleReload}>
            Reload the page
          </button>
          <a className="secondary-button" href="/#/support">
            Contact support
          </a>
        </div>
        {this.state.eventId ? (
          <p className="helper-text">Reference ID: {this.state.eventId}</p>
        ) : null}
      </div>
    );
  }
}
