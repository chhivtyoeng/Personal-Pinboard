import React from 'react';
import { Button } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/pins';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center mx-auto shadow-md">
              <IconAlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Something went wrong</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected display error occurred while rendering this page.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="default"
                radius="xl"
                size="sm"
                leftSection={<IconRefresh size={14} />}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button
                color="brandRed"
                radius="xl"
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 font-bold"
                leftSection={<IconHome size={14} />}
                onClick={this.handleReset}
              >
                Back to Feed
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
