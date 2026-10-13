import React from 'react';

export default function ScoreCard({ score }) {
  // Determine color based on score
  let colorClass = 'score-high';
  if (score < 50) colorClass = 'score-low';
  else if (score < 75) colorClass = 'score-medium';

  return (
    <div className="card score-card">
      <h3 className="card-title">Resume Readiness</h3>
      
      <div className={`score-circle ${colorClass}`}>
        <div className="score-value">
          <span className="score-number">{Math.round(score)}</span>
          <span className="score-max">/ 100</span>
        </div>
      </div>
      
      <p className="score-description">
        Application-generated heuristic based on resume completeness, skills, experience, projects, structure and keyword readiness.
      </p>
    </div>
  );
}
