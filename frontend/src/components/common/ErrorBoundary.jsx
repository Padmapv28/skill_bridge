import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-navy-900 border border-brand-gold/30 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center mx-auto shadow-glow-gold/20">
              <AlertTriangle className="w-8 h-8 text-brand-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                An unexpected interface issue occurred. You can return to the homepage or reload the application.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-[11px] font-mono text-rose-300 text-left overflow-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-glow-blue transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Home
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
