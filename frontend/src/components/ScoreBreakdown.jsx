import React from 'react';

const MAX_SCORES = {
  skills: 20,
  experience: 20,
  projects: 15,
  education: 10,
  structure: 10,
  ats_readiness: 15,
  certifications: 5,
  achievements: 5,
};

const FORMATTED_NAMES = {
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  structure: 'Structure',
  ats_readiness: 'ATS Readiness',
  certifications: 'Certifications',
  achievements: 'Achievements',
};

export default function ScoreBreakdown({ categories }) {
  if (!categories) return null;

  return (
    <div className="card breakdown-card">
      <h3 className="card-title">Score Breakdown</h3>
      
      <div className="breakdown-list">
        {Object.entries(categories).map(([key, value]) => {
          const max = MAX_SCORES[key] || 10;
          const name = FORMATTED_NAMES[key] || key;
          const percentage = (value / max) * 100;
          
          return (
            <div key={key} className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-name">{name}</span>
                <span className="breakdown-value">{Math.round(value)} / {max}</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
