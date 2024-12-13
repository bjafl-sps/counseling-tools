import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode, onErrorMsg: string },
  { hasError: boolean, error: Error | null }> {

  constructor(props: { 
    children: React.ReactNode, 
    onErrorMsg: 'Det oppstod en feil.' }) {
    super(props);
    this.state = {hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, errMsg: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>{this.props.onErrorMsg}</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;