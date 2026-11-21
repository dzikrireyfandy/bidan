import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', margin: '1.5rem 0', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem' }}>
            {this.props.fallbackTitle || 'Terjadi Kendala Memuat Data Tampilan'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#b91c1c', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
            {this.state.error?.message || 'Data dari server memiliki struktur yang berbeda atau sedang disinkronkan.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Coba Muat Ulang Tampilan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
