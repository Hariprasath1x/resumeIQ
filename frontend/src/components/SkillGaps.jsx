import React from 'react';

export default function SkillGaps({ gaps }) {
  // gaps here is the SkillGap object from backend: 
  // { target_role: str, existing_skills: str[], gaps: { high: str[], medium: str[], low: str[] } }
  
  if (!gaps || !gaps.gaps) {
    return (
      <div className="card gaps-card">
        <h3 className="card-title">Skill Gaps</h3>
        <p className="empty-text">No significant skill gaps found.</p>
      </div>
    );
  }

  const highPriority = gaps.gaps.high || [];
  const mediumPriority = gaps.gaps.medium || [];
  const lowPriority = gaps.gaps.low || [];

  const totalGaps = highPriority.length + mediumPriority.length + lowPriority.length;

  if (totalGaps === 0) {
    return (
      <div className="card gaps-card">
        <h3 className="card-title">Skill Gaps</h3>
        <p className="empty-text">No significant skill gaps found.</p>
      </div>
    );
  }

  const renderGroup = (title, items, className) => {
    if (!items || items.length === 0) return null;
    return (
      <div className={`gap-group ${className}`}>
        <h4>{title}</h4>
        <ul className="gap-list">
          {items.map((skill, idx) => (
            <li key={idx}>• {skill}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="card gaps-card">
      <h3 className="card-title">
        Skill Gaps 
        {gaps.target_role && <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px'}}>(for {gaps.target_role})</span>}
      </h3>
      <div className="gaps-container">
        {renderGroup('High Priority', highPriority, 'priority-high')}
        {renderGroup('Medium Priority', mediumPriority, 'priority-medium')}
        {renderGroup('Low Priority', lowPriority, 'priority-low')}
      </div>
    </div>
  );
}
