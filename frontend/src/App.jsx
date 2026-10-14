import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import UploadResume from './components/UploadResume';
import ScoreCard from './components/ScoreCard';
import ScoreBreakdown from './components/ScoreBreakdown';
import ResumeProfile from './components/ResumeProfile';
import RoleMatches from './components/RoleMatches';
import SkillGaps from './components/SkillGaps';
import JobSearch from './components/JobSearch';
import Suggestions from './components/Suggestions';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { analyzeResume } from './services/api';

// ---------------------------------------------------------------------------
// App views / steps:
//   'upload'   – initial upload screen
//   'analysis' – resume analysis results + "Find Jobs" CTA
//   'jobs'     – user-driven job search (profile stays in state)
// ---------------------------------------------------------------------------

function Dashboard() {
  const [view, setView] = useState('upload');          // 'upload' | 'analysis' | 'jobs'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAnalyze = async (file) => {
    setIsLoading(true);
    setError(null);

    const steps = [
      'Extracting resume content…',
      'Understanding your profile…',
      'Calculating resume score…',
      'Matching suitable roles…',
      'Finalising analysis…',
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) setLoadingStep(steps[stepIndex]);
    }, 1200);

    try {
      const result = await analyzeResume(file);
      setAnalysisResult(result);
      setView('analysis');
    } catch (err) {
      if (err.message.includes('401')) {
        setError('Authentication session expired. Please logout and login again.');
      } else {
        setError(err.message || 'Unable to analyze your resume. Please check the file and try again.');
      }
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setView('upload');
    setError(null);
  };

  return (
    <div className="app-container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <div>
          <h1 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>ResumeIQ</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>AI Resume Analyzer &amp; Job Matcher</p>
        </div>

        {user && (
          <div
            onClick={() => navigate('/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background-color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--background)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {user.displayName || user.email}
            </span>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="app-main">

        {/* ── VIEW: upload ──────────────────────────────────────────────────── */}
        {view === 'upload' && (
          <div className="landing-view">
            <UploadResume onAnalyze={handleAnalyze} isLoading={isLoading} />

            {isLoading && (
              <div className="loading-state">
                <div className="spinner" />
                <p className="loading-text">{loadingStep}</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <h3>Analysis Failed</h3>
                <p>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: analysis ────────────────────────────────────────────────── */}
        {view === 'analysis' && analysisResult && (
          <div className="dashboard-view">
            <div className="dashboard-header">
              <h2>Analysis Complete</h2>
              <button className="reset-btn" onClick={handleReset} id="btn-analyze-another">
                Analyze Another Resume
              </button>
            </div>

            <ErrorBoundary onReset={handleReset}>
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <ScoreCard score={analysisResult.score.overall_score} />
                  <RoleMatches matches={analysisResult.role_matches} />

                  {/* ── Find Jobs CTA ─────────────────────────────────────── */}
                  <div className="card find-jobs-cta">
                    <div className="find-jobs-cta-content">
                      <div className="find-jobs-icon">🎯</div>
                      <div>
                        <h3>Find Jobs Matching Your Profile</h3>
                        <p>
                          Your resume has been analysed successfully.<br />
                          Choose your preferred locations and roles to discover relevant jobs.
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-find-jobs"
                      className="btn btn-primary find-jobs-btn"
                      onClick={() => setView('jobs')}
                    >
                      🔎 Find Jobs
                    </button>
                  </div>
                </div>

                <div className="dashboard-right">
                  <ResumeProfile profile={analysisResult.profile} />
                  <ScoreBreakdown categories={analysisResult.score.categories} />
                  <SkillGaps gaps={analysisResult.skill_gaps} />
                  <Suggestions suggestions={analysisResult.suggestions} />
                </div>
              </div>
            </ErrorBoundary>
          </div>
        )}

        {/* ── VIEW: jobs ────────────────────────────────────────────────────── */}
        {view === 'jobs' && analysisResult && (
          <JobSearch
            analysisResult={analysisResult}
            onBack={() => setView('analysis')}
          />
        )}
      </main>
    </div>
  );
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #eaf0ff', borderTopColor: '#3f72e4', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  return user ? <Dashboard /> : <Welcome />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login initialMode="login" />} />
          <Route path="/signup" element={<Login initialMode="signup" />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<RootRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
