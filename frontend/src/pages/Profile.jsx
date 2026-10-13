import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!user) return null;

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <h1 style={{ margin: 0 }}>ResumeIQ</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>AI Resume Analyzer & Job Matcher</p>
        </div>
      </header>

      <main className="app-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4rem', flex: 1 }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.displayName || 'User'}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Authentication</p>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>Google / Firebase</p>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>User ID</p>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.uid}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.85rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
