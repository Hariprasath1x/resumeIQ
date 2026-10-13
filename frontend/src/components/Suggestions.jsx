import React from 'react';

export default function Suggestions({ suggestions }) {
  if (!suggestions) return null;

  return (
    <div className="card suggestions-card">
      <h3 className="card-title">Resume Improvements</h3>

      {suggestions.summary_suggestion && (
        <div className="suggestion-section">
          <h4>Summary Improvement</h4>
          <p>{suggestions.summary_suggestion}</p>
        </div>
      )}

      {suggestions.bullet_point_suggestions && suggestions.bullet_point_suggestions.length > 0 && (
        <div className="suggestion-section">
          <h4>Bullet Point Suggestions</h4>
          <div className="bullets-list">
            <ul className="simple-list">
              {suggestions.bullet_point_suggestions.map((bp, idx) => (
                <li key={idx}>{bp}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {suggestions.missing_sections && suggestions.missing_sections.length > 0 && (
        <div className="suggestion-section">
          <h4>Missing Sections</h4>
          <ul className="simple-list">
            {suggestions.missing_sections.map((section, idx) => (
              <li key={idx}>{section}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.keyword_suggestions && suggestions.keyword_suggestions.length > 0 && (
        <div className="suggestion-section">
          <h4>Keyword Suggestions</h4>
          <div className="badges">
            {suggestions.keyword_suggestions.map((kw, idx) => (
              <span key={idx} className="badge keyword-badge">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {suggestions.general_suggestions && suggestions.general_suggestions.length > 0 && (
        <div className="suggestion-section">
          <h4>General Suggestions</h4>
          <ul className="simple-list">
            {suggestions.general_suggestions.map((sug, idx) => (
              <li key={idx}>{sug}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
