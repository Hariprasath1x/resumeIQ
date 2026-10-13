import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard using useEffect
  React.useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', borderBottom: '2px solid var(--primary)', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  // Prevent flashing login UI right before redirect
  if (user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show a scary error
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setError('Please allow popups for ResumeIQ to continue with Google.');
        return;
      }
      setError('An error occurred during sign in. Please try again.');
      console.error(err);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '2rem', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>ResumeIQ</h1>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
          AI Resume Analyzer & Job Matcher
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Analyze your resume. Discover suitable roles. Find your skill gaps.
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          className="analyze-btn" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
        >
          <LogIn size={20} />
          Continue with Google
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  );
}
