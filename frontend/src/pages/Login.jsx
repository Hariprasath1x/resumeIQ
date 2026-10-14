import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.7099c-.18-.54-.2823-1.1168-.2823-1.7099s.1023-1.17.2823-1.7099V4.9582H.9573A8.9967 8.9967 0 000 9c0 1.4523.3477 2.8268.9573 4.0418l3.0067-2.3319z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.9245 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.2901C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login({ initialMode }) {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSignUp = initialMode === 'signup' || location.pathname === '/signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, navigate to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="login-page-root" style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #eaf0ff', borderTopColor: '#3f72e4', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address. Please log in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please try again in a few minutes.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for ResumeIQ.';
      default:
        return err?.message || 'Authentication failed. Please check your credentials and try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(trimmedEmail, password);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      navigate('/');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(formatAuthError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address above to receive a password reset link.');
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      setSuccessMsg('Password reset link sent to your email. Please check your inbox.');
    } catch (err) {
      setError(formatAuthError(err));
    }
  };

  return (
    <div className="login-page-root">
      <div className="page">
        {/* Left Side: Brand Panel */}
        <aside className="side">
          <Link to="/" className="logo">
            ResumeIQ
          </Link>

          <div>
            <h2>Know how your resume stacks up.</h2>
            <p>Upload your resume, add a job description, and see where you match and what's missing.</p>
          </div>

          <div className="desk" aria-hidden="true">
            <div className="sheet back" />
            <div className="sheet front">
              <div className="stamp">
                <div>
                  <b>86%</b>
                  <span>Match</span>
                </div>
              </div>
              <div className="row">
                <div className="avatar" />
                <div className="stack">
                  <div className="bar dark" style={{ width: '62%' }} />
                  <div className="bar" style={{ width: '40%' }} />
                </div>
              </div>
              <div className="label" />
              <div className="bar line hl" style={{ width: '88%' }} />
              <div className="bar line" style={{ width: '94%' }} />
              <div className="bar line" style={{ width: '70%' }} />
              <div className="label" style={{ width: '28%' }} />
              <div className="bar line" style={{ width: '92%' }} />
              <div className="bar line hl" style={{ width: '76%' }} />
              <div className="bar line" style={{ width: '84%' }} />
              <div className="label" style={{ width: '22%' }} />
              <div className="bar line hl" style={{ width: '58%' }} />
              <div className="bar line" style={{ width: '80%' }} />
            </div>
          </div>

          <div className="foot">AI Resume Analyzer &amp; Job Matcher</div>
        </aside>

        {/* Right Side: Form */}
        <main className="main">
          <div className="form-wrap">
            <Link to="/" className="mobile-logo">
              ResumeIQ
            </Link>
            <h1>{isSignUp ? 'Create an account' : 'Welcome back'}</h1>
            <p className="lead">
              {isSignUp ? 'Sign up to analyze and optimize your resume.' : 'Log in to analyze your resume.'}
            </p>

            {error && <div className="err">{error}</div>}
            {successMsg && <div className="success">{successMsg}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="pw">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? 'Create a secure password (min 6 chars)' : 'Enter your password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="opts">
                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  {' Remember me'}
                </label>
                {!isSignUp && (
                  <a href="#forgot" onClick={handleForgotPassword}>
                    Forgot password?
                  </a>
                )}
              </div>

              <button className="submit" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (isSignUp ? 'Creating account…' : 'Logging in…')
                  : (isSignUp ? 'Create account' : 'Log in')}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            <p className="alt">
              {isSignUp ? (
                <>
                  Already have an account? <Link to="/login">Log in</Link>
                </>
              ) : (
                <>
                  New to ResumeIQ? <Link to="/signup">Create an account</Link>
                </>
              )}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
