import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: 'var(--score-low)', marginBottom: '1rem' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            There was an error while displaying the analysis. Please try analyzing the resume again.
          </p>
          <button 
            className="analyze-btn" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
          >
            Start Over
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: '2rem', textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
              <pre style={{ color: 'var(--score-low)' }}>{this.state.error.toString()}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
