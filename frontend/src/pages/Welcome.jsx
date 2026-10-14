import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Welcome.css';

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="welcome-page-root">
      <div className="page">
        {/* Navigation */}
        <nav>
          <Link className="logo" to="/">
            ResumeIQ
          </Link>
          <div className="links">
            {user ? (
              <>
                <Link className="plain" to="/">
                  Dashboard
                </Link>
                <Link className="btn btn-blue" to="/profile">
                  {user.displayName || user.email || 'My Profile'}
                </Link>
              </>
            ) : (
              <>
                <Link className="plain" to="/login">
                  Log in
                </Link>
                <Link className="btn btn-blue" to="/signup">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="copy">
            <div className="eyebrow">AI Resume Analyzer &amp; Job Matcher</div>
            <h1>
              Make your resume <span>fit the job.</span>
            </h1>
            <p className="lead">
              Upload your resume, add the job description, and see how well you match, what keywords are missing, and what to fix before you apply.
            </p>
            <div className="cta">
              {user ? (
                <Link className="btn btn-blue big" to="/">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link className="btn btn-blue big" to="/signup">
                    Get started
                  </Link>
                  <Link className="btn btn-line big" to="/login">
                    I have an account
                  </Link>
                </>
              )}
            </div>
            <div className="note">PDF or DOCX &bull; Max 10 MB</div>
          </div>

          <div className="art" aria-hidden="true">
            <div className="panel">
              <div className="sheets">
                <div className="sheet l">
                  <div className="tab">RESUME</div>
                  <div className="bar dark" style={{ width: '58%' }} />
                  <div className="bar" style={{ width: '38%' }} />
                  <div className="gap" />
                  <div className="bar hl" style={{ width: '90%' }} />
                  <div className="bar" style={{ width: '96%' }} />
                  <div className="bar hl" style={{ width: '72%' }} />
                  <div className="gap" />
                  <div className="bar" style={{ width: '88%' }} />
                  <div className="bar" style={{ width: '76%' }} />
                  <div className="bar hl" style={{ width: '64%' }} />
                  <div className="gap" />
                  <div className="bar" style={{ width: '84%' }} />
                  <div className="bar" style={{ width: '55%' }} />
                </div>
                <div className="sheet r">
                  <div className="tab">JOB DESCRIPTION</div>
                  <div className="bar dark" style={{ width: '64%' }} />
                  <div className="bar" style={{ width: '42%' }} />
                  <div className="gap" />
                  <div className="bar hl" style={{ width: '86%' }} />
                  <div className="bar" style={{ width: '94%' }} />
                  <div className="bar" style={{ width: '70%' }} />
                  <div className="gap" />
                  <div className="bar hl" style={{ width: '80%' }} />
                  <div className="bar" style={{ width: '92%' }} />
                  <div className="bar hl" style={{ width: '60%' }} />
                  <div className="gap" />
                  <div className="bar" style={{ width: '78%' }} />
                  <div className="bar" style={{ width: '50%' }} />
                </div>
                <div className="badge">
                  <div>
                    <b>86%</b>
                    <span>Match</span>
                  </div>
                </div>
              </div>
              <div className="keys">
                <span className="k ok">Python</span>
                <span className="k ok">SQL</span>
                <span className="k ok">REST APIs</span>
                <span className="k no">Docker</span>
                <span className="k no">CI/CD</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Steps */}
        <div className="steps">
          <div className="step">
            <div className="no-c">1</div>
            <div>
              <b>Upload your resume</b>
              <span>PDF or DOCX, up to 10 MB</span>
            </div>
          </div>
          <div className="step">
            <div className="no-c">2</div>
            <div>
              <b>Add a job description</b>
              <span>Paste the role you're applying for</span>
            </div>
          </div>
          <div className="step">
            <div className="no-c">3</div>
            <div>
              <b>See your match</b>
              <span>Get a score and what's missing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
