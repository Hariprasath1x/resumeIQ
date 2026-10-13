import React from 'react';
import { Briefcase, MapPin, Building, Check, X } from 'lucide-react';

export default function JobMatches({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="card jobs-card">
        <h3 className="card-title">Recommended Jobs</h3>
        <p className="empty-text">No jobs matched your profile.</p>
      </div>
    );
  }

  return (
    <div className="card jobs-card">
      <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="card-title" style={{ margin: 0 }}>Recommended Jobs</h3>
        <span className="badge badge-primary">Live Jobs Match</span>
      </div>
      
      <div className="jobs-list">
        {jobs.map((job, idx) => (
          <div key={idx} className="job-item">
            <div className="job-header">
              <div>
                <h4 className="job-title">{job.title}</h4>
                <div className="job-source" style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                  Source: {job.source || 'ResumeIQ Jobs'} &bull; {job.posted_at ? `Posted: ${job.posted_at}` : 'Recently added'}
                </div>
              </div>
              <span className="job-score">{Math.round(job.match_percentage)}% Match</span>
            </div>
            
            <div className="job-meta" style={{ marginTop: '12px' }}>
              <span className="meta-item"><Building size={14}/> {job.company}</span>
              <span className="meta-item"><MapPin size={14}/> {job.location}</span>
              {job.employment_type && <span className="meta-item"><Briefcase size={14}/> {job.employment_type}</span>}
              {job.salary_min && (
                <span className="meta-item" style={{ color: 'var(--success-color)', fontWeight: 500 }}>
                  💰 {job.salary_currency || '$'}{job.salary_min.toLocaleString()} 
                  {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                </span>
              )}
            </div>

            <div className="job-skills-split">
              <div className="skills-column">
                <h5>Matched Skills</h5>
                <ul className="skill-list matched-skills">
                  {job.matched_skills && job.matched_skills.map((skill, i) => (
                    <li key={i}><Check size={14} className="icon-success"/> {skill}</li>
                  ))}
                  {(!job.matched_skills || job.matched_skills.length === 0) && (
                    <li className="empty-li">None</li>
                  )}
                </ul>
              </div>
              
              <div className="skills-column">
                <h5>Missing Skills</h5>
                <ul className="skill-list missing-skills">
                  {job.missing_skills && job.missing_skills.map((skill, i) => (
                    <li key={i}><X size={14} className="icon-error"/> {skill}</li>
                  ))}
                  {(!job.missing_skills || job.missing_skills.length === 0) && (
                    <li className="empty-li">None</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="job-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              {(job.application_url || job.job_url) ? (
                <a 
                  href={job.application_url || job.job_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary" 
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  🔗 View Job / Apply
                </a>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', padding: '8px 0' }}>
                  Source link unavailable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
