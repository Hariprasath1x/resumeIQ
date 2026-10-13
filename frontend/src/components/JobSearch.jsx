import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Search, X, Briefcase, Building, Check } from 'lucide-react';
import { searchJobs } from '../services/api';

// ---------------------------------------------------------------------------
// Location suggestions — curated list; extend anytime without code changes
// ---------------------------------------------------------------------------
const LOCATION_SUGGESTIONS = [
  'Coimbatore, Tamil Nadu, India',
  'Chennai, Tamil Nadu, India',
  'Bengaluru, Karnataka, India',
  'Hyderabad, Telangana, India',
  'Pune, Maharashtra, India',
  'Mumbai, Maharashtra, India',
  'New Delhi, India',
  'Ahmedabad, Gujarat, India',
  'Kolkata, West Bengal, India',
  'Noida, Uttar Pradesh, India',
  'Gurgaon, Haryana, India',
  'Kochi, Kerala, India',
  'New York, NY, USA',
  'San Francisco, CA, USA',
  'Los Angeles, CA, USA',
  'Seattle, WA, USA',
  'Austin, TX, USA',
  'Chicago, IL, USA',
  'Boston, MA, USA',
  'London, UK',
  'Berlin, Germany',
  'Toronto, Canada',
  'Singapore',
  'Sydney, Australia',
];

// ---------------------------------------------------------------------------
// Role suggestions derived from a resume profile
// ---------------------------------------------------------------------------
function deriveRoleSuggestions(analysisResult) {
  if (!analysisResult) return [];
  
  const suggestions = new Set();

  // Add role matches from AI
  (analysisResult.role_matches || []).forEach(rm => {
    if (rm.role) suggestions.add(rm.role);
  });

  const profile = analysisResult.profile;
  if (profile) {
    // Role-inferred keywords based on experience text
    const experienceText = (profile.experience || []).join(' ').toLowerCase();
    const ROLE_KEYWORDS = [
      { match: /data engin/i, label: 'Data Engineer' },
      { match: /machine learn|ml engineer|ai engineer/i, label: 'ML Engineer' },
      { match: /backend|back-end|api developer|rest api/i, label: 'Backend Developer' },
      { match: /frontend|front-end|react|angular|vue/i, label: 'Frontend Developer' },
      { match: /full.?stack/i, label: 'Full Stack Developer' },
      { match: /devops|site reliability|sre/i, label: 'DevOps Engineer' },
      { match: /data analyst|data analysis/i, label: 'Data Analyst' },
      { match: /software engineer|software developer/i, label: 'Software Engineer' },
      { match: /python developer/i, label: 'Python Developer' },
      { match: /java developer/i, label: 'Java Developer' },
    ];
    ROLE_KEYWORDS.forEach(({ match, label }) => {
      if (match.test(experienceText)) suggestions.add(label);
    });
  }

  // Remove very generic or very long entries
  return [...suggestions]
    .filter(s => s && s.length >= 2 && s.length <= 40)
    .slice(0, 15);
}

// ---------------------------------------------------------------------------
// JobSearch component
// ---------------------------------------------------------------------------
export default function JobSearch({ analysisResult, onBack }) {
  const profile = analysisResult?.profile;

  // --- Locations ---
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const locationRef = useRef(null);

  // --- Roles ---
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleInput, setRoleInput] = useState('');

  // --- Search state ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [lastSearchParams, setLastSearchParams] = useState(null);

  const roleSuggestions = useMemo(() => deriveRoleSuggestions(analysisResult), [analysisResult]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // --- Location helpers ---
  const filteredLocations = useMemo(() => {
    if (!locationInput.trim()) return LOCATION_SUGGESTIONS.filter(l => !selectedLocations.includes(l));
    const q = locationInput.toLowerCase();
    return LOCATION_SUGGESTIONS.filter(
      l => l.toLowerCase().includes(q) && !selectedLocations.includes(l)
    );
  }, [locationInput, selectedLocations]);

  function addLocation(loc) {
    if (!selectedLocations.includes(loc)) {
      setSelectedLocations(prev => [...prev, loc]);
    }
    setLocationInput('');
    setShowLocationDropdown(false);
  }

  function addCustomLocation() {
    const val = locationInput.trim();
    if (val && !selectedLocations.includes(val)) {
      setSelectedLocations(prev => [...prev, val]);
    }
    setLocationInput('');
    setShowLocationDropdown(false);
  }

  function removeLocation(loc) {
    setSelectedLocations(prev => prev.filter(l => l !== loc));
  }

  // --- Role helpers ---
  function toggleRole(role) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function addCustomRole() {
    const val = roleInput.trim();
    if (val && !selectedRoles.includes(val)) {
      setSelectedRoles(prev => [...prev, val]);
    }
    setRoleInput('');
  }

  function removeRole(role) {
    setSelectedRoles(prev => prev.filter(r => r !== role));
  }

  // --- Search ---
  async function handleSearch() {
    if (!profile) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const results = await searchJobs(selectedLocations, selectedRoles, isRemote, profile);
      setSearchResults(results);
      setLastSearchParams({ locations: [...selectedLocations], roles: [...selectedRoles], remote: isRemote });
    } catch (err) {
      setSearchError(err.message || 'Job search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }

  // --- Render ---
  return (
    <div className="job-search-container">
      {/* Header */}
      <div className="job-search-header">
        <button className="back-btn" onClick={onBack} id="btn-back-to-analysis">
          ← Back to Analysis
        </button>
        <div>
          <h2 className="job-search-title">Find Your Next Job</h2>
          <p className="job-search-subtitle">
            Search based on your resume profile — no re-upload needed.
          </p>
        </div>
      </div>

      {/* Search form — always visible so the user can refine criteria after seeing results */}
      <div className="job-search-form card">

          {/* Role section */}
          <div className="search-section">
            <h3 className="search-section-title">
              <Search size={18} /> What role are you looking for?
            </h3>

            {roleSuggestions.length > 0 && (
              <div className="keyword-suggestions-label">Suggested roles from your resume:</div>
            )}

            <div className="keyword-chips">
              {roleSuggestions.map(role => (
                <button
                  key={role}
                  className={`keyword-chip ${selectedRoles.includes(role) ? 'keyword-chip-selected' : ''}`}
                  onClick={() => toggleRole(role)}
                  id={`role-chip-${role.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {selectedRoles.includes(role) && <Check size={12} />} {role}
                </button>
              ))}
            </div>

            <div className="custom-keyword-row">
              <input
                id="custom-role-input"
                type="text"
                className="search-input"
                placeholder="Type a job title..."
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addCustomRole(); }
                }}
              />
              <button className="btn btn-secondary" onClick={addCustomRole} disabled={!roleInput.trim()}>
                Add
              </button>
            </div>

            {selectedRoles.length > 0 && (
              <div className="selected-tags">
                {selectedRoles.map(role => (
                  <span key={role} className="selected-tag selected-tag-keyword">
                    🔎 {role}
                    <button className="tag-remove-btn" onClick={() => removeRole(role)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location section */}
          <div className="search-section">
            <h3 className="search-section-title">
              <MapPin size={18} /> Where do you want to work?
            </h3>

            <div className="location-input-wrapper" ref={locationRef}>
              <input
                id="location-search-input"
                type="text"
                className="search-input"
                placeholder="Search city, state, or country..."
                value={locationInput}
                onChange={e => { setLocationInput(e.target.value); setShowLocationDropdown(true); }}
                onFocus={() => setShowLocationDropdown(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addCustomLocation(); }
                }}
              />
              {showLocationDropdown && filteredLocations.length > 0 && (
                <ul className="location-dropdown">
                  {filteredLocations.map(loc => (
                    <li key={loc} className="location-option" onMouseDown={() => addLocation(loc)}>
                      <MapPin size={14} /> {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedLocations.length > 0 && (
              <div className="selected-tags">
                {selectedLocations.map(loc => (
                  <span key={loc} className="selected-tag selected-tag-location">
                    📍 {loc}
                    <button className="tag-remove-btn" onClick={() => removeLocation(loc)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="remote-checkbox" 
                checked={isRemote}
                onChange={e => setIsRemote(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="remote-checkbox" style={{ cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Remote
              </label>
            </div>
          </div>

          {/* Search button */}
          <button
            id="btn-search-jobs"
            className="btn btn-primary search-jobs-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <span className="spinner-small" /> Searching…
              </>
            ) : (
              '🔍 Search Jobs'
            )}
          </button>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="search-error-state">
          <h3>Search Failed</h3>
          <p>{searchError}</p>
        </div>
      )}

      {/* Results */}
      {searchResults !== null && (
        <JobResults
          results={searchResults}
          locations={lastSearchParams?.locations || []}
          roles={lastSearchParams?.roles || []}
          remote={lastSearchParams?.remote}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobResults sub-component
// ---------------------------------------------------------------------------
function JobResults({ results, locations, roles, remote }) {
  if (results.length === 0) {
    return (
      <div className="card no-results-card">
        <h3>No jobs found</h3>
        <p>
          No jobs matched{' '}
          {locations.length > 0 && (
            <strong>{locations.join(', ')}</strong>
          )}
          {remote && (
            <strong>{locations.length > 0 ? ' (or Remote)' : 'Remote'}</strong>
          )}
          {roles.length > 0 && (
            <> for roles <strong>{roles.join(', ')}</strong></>
          )}
          {' '}in the current database.
        </p>
        <p className="no-results-hint">
          The job database is populated via n8n from Remotive. Try <strong>Remote</strong> or
          different roles — more location-specific jobs will appear as the database grows.
        </p>
      </div>
    );
  }

  return (
    <div className="job-results-section">
      {/* Active filter pills */}
      <div className="results-header">
        <h3 className="results-title">Jobs Matching Your Preferences</h3>
        <div className="active-filters">
          {locations.map(l => (
            <span key={l} className="filter-pill filter-pill-location">📍 {l}</span>
          ))}
          {remote && (
            <span className="filter-pill filter-pill-location">📍 Remote</span>
          )}
          {roles.map(r => (
            <span key={r} className="filter-pill filter-pill-keyword">🔎 {r}</span>
          ))}
        </div>
        <p className="results-count">{results.length} job{results.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="jobs-list">
        {results.map((job, idx) => (
          <JobCard key={job.job_id || idx} job={job} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobCard sub-component — displays a single scored job
// ---------------------------------------------------------------------------
function JobCard({ job }) {
  const score = typeof job.match_percentage === 'number' ? job.match_percentage : 0;
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  const jobUrl = job.application_url || job.job_url || '';

  function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="job-item">
      <div className="job-header">
        <div>
          <h4 className="job-title">{job.title}</h4>
          <div className="job-source" style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            Source: {job.source || 'Unknown'}
            {job.posted_at && ` • Posted: ${formatDate(job.posted_at)}`}
          </div>
        </div>
        <span className={`job-score ${scoreClass}`}>{Math.round(score)}% Match</span>
      </div>

      <div className="job-meta" style={{ marginTop: '12px' }}>
        {job.company && <span className="meta-item"><Building size={14} /> {job.company}</span>}
        {job.location && <span className="meta-item"><MapPin size={14} /> {job.location}</span>}
        {job.employment_type && (
          <span className="meta-item"><Briefcase size={14} /> {job.employment_type}</span>
        )}
        {job.salary_min && (
          <span className="meta-item" style={{ color: 'var(--score-high)', fontWeight: 500 }}>
            💰 {job.salary_currency || '$'}{job.salary_min.toLocaleString()}
            {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : '+'}
          </span>
        )}
      </div>

      <div className="job-skills-split">
        <div className="skills-column">
          <h5>Matched Skills</h5>
          <ul className="skill-list matched-skills">
            {(job.matched_skills || []).length > 0
              ? job.matched_skills.map((s, i) => (
                  <li key={i}><Check size={14} className="icon-success" /> {s}</li>
                ))
              : <li className="empty-li">None</li>}
          </ul>
        </div>
        <div className="skills-column">
          <h5>Missing Skills</h5>
          <ul className="skill-list missing-skills">
            {(job.missing_skills || []).length > 0
              ? job.missing_skills.map((s, i) => (
                  <li key={i}><X size={14} className="icon-error" /> {s}</li>
                ))
              : <li className="empty-li">None</li>}
          </ul>
        </div>
      </div>

      <div className="job-actions" style={{ marginTop: '16px' }}>
        {jobUrl ? (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ flex: 1, textAlign: 'center', display: 'block' }}
          >
            🔗 View Job / Apply
          </a>
        ) : (
          <span style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', padding: '8px 0', display: 'block' }}>
            Source link unavailable
          </span>
        )}
      </div>
    </div>
  );
}
