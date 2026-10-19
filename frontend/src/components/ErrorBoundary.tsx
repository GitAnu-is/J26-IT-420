import React from 'react';
import { CrashScreen } from './CrashScreen';

interface State {
  hasError: boolean;
}

// Catches render errors anywhere below it so a single broken screen never blanks the whole app.
export class ErrorBoundary extends React.Component<{children: React.ReactNode;}, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send to your logging service (e.g. POST /api/v1/client-errors) in production.
    console.error('AgriGuard UI error', error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <CrashScreen /> : this.props.children;
  }
}