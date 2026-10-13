import React from 'react';

export default function ResumeProfile({ profile }) {
  if (!profile) return null;

  const renderSection = (title, content) => {
    const isEmpty = !content || (Array.isArray(content) && content.length === 0);

    return (
      <div className="profile-section">
        <h4>{title}</h4>
        {isEmpty ? (
          <p className="empty-text">No {title.toLowerCase()} detected in this resume.</p>
        ) : Array.isArray(content) ? (
          <div className="badges">
            {content.map((item, idx) => (
              <span key={idx} className="badge">{item}</span>
            ))}
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    );
  };

  const renderListSection = (title, items) => {
    const isEmpty = !items || items.length === 0;

    return (
      <div className="profile-section">
        <h4>{title}</h4>
        {isEmpty ? (
          <p className="empty-text">No professional {title.toLowerCase()} detected.</p>
        ) : (
          <ul className="profile-list">
            {items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="card profile-card">
      <h3 className="card-title">Resume Profile</h3>
      
      <div className="profile-header">
        <h4>Candidate</h4>
        <p className="candidate-name">{profile.candidate_name || 'Unknown'}</p>
      </div>

      {renderSection('Summary', profile.professional_summary)}
      {renderSection('Skills', profile.skills)}
      {renderSection('Programming Languages', profile.programming_languages)}
      {renderSection('Frameworks', profile.frameworks)}
      {renderSection('Databases', profile.databases)}
      {renderSection('Cloud Tools', profile.cloud_tools)}
      {renderSection('Soft Skills', profile.soft_skills)}
      
      {renderListSection('Experience', profile.experience)}
      {renderListSection('Projects', profile.projects)}
      {renderListSection('Education', profile.education)}
      {renderListSection('Certifications', profile.certifications)}
      {renderListSection('Achievements', profile.achievements)}
    </div>
  );
}
