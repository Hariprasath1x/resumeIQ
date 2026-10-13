import React from 'react';
import { Check, X } from 'lucide-react';

export default function RoleMatches({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="card roles-card">
        <h3 className="card-title">Matching Roles</h3>
        <p className="empty-text">No roles matched sufficiently.</p>
      </div>
    );
  }

  return (
    <div className="card roles-card">
      <h3 className="card-title">Matching Roles</h3>
      
      <div className="roles-list">
        {matches.map((match, idx) => (
          <div key={idx} className="role-item">
            <div className="role-header">
              <span className="role-name">{match.role}</span>
              <span className="role-score">{Math.round(match.match_percentage)}% Match</span>
            </div>
            
            {match.explanation && (
              <p className="role-explanation">{match.explanation}</p>
            )}

            <div className="role-skills">
              <div className="skills-column">
                <h5>Matched Skills</h5>
                <ul className="skill-list matched-skills">
                  {match.matched_skills && match.matched_skills.map((skill, i) => (
                    <li key={i}><Check size={14} className="icon-success"/> {skill}</li>
                  ))}
                  {(!match.matched_skills || match.matched_skills.length === 0) && (
                    <li className="empty-li">None</li>
                  )}
                </ul>
              </div>
              
              <div className="skills-column">
                <h5>Missing Required</h5>
                <ul className="skill-list missing-skills">
                  {match.missing_required && match.missing_required.map((skill, i) => (
                    <li key={i}><X size={14} className="icon-error"/> {skill}</li>
                  ))}
                  {(!match.missing_required || match.missing_required.length === 0) && (
                    <li className="empty-li">None</li>
                  )}
                </ul>
              </div>

              <div className="skills-column">
                <h5>Missing Preferred</h5>
                <ul className="skill-list missing-skills" style={{ opacity: 0.8 }}>
                  {match.missing_preferred && match.missing_preferred.map((skill, i) => (
                    <li key={i}><X size={14} style={{ color: 'var(--score-medium)' }}/> {skill}</li>
                  ))}
                  {(!match.missing_preferred || match.missing_preferred.length === 0) && (
                    <li className="empty-li">None</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
