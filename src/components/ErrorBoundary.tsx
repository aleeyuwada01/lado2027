import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = error.message || 'An unexpected operational error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.operationType && parsed?.error) {
        message = `Database permission or sync error (${parsed.operationType} on ${parsed.path || 'unknown path'}): ${parsed.error}`;
      }
    } catch {
      // Plain error string
    }
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F8FA] dark:bg-[#090E1A] p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400 mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h1 className="text-base font-semibold">Operational Interface Recovery</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-700 rounded-md hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reload Command Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
