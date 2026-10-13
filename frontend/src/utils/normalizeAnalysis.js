/**
 * Normalizes the backend API response to ensure a predictable shape.
 * This prevents the React app from crashing if properties are missing, undefined, or the wrong type.
 */
export function normalizeAnalysisResponse(response) {
  if (!response) {
    return null;
  }

  // Safely extract the raw sections
  const profile = response.resume_profile || {};
  const score = response.score || {};
  const skillGaps = response.skill_gaps || {};
  const suggestions = response.suggestions || {};

  return {
    profile: {
      candidate_name: profile.candidate_name || '',
      professional_summary: profile.professional_summary || '',
      education: Array.isArray(profile.education) ? profile.education : [],
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      programming_languages: Array.isArray(profile.programming_languages) ? profile.programming_languages : [],
      frameworks: Array.isArray(profile.frameworks) ? profile.frameworks : [],
      databases: Array.isArray(profile.databases) ? profile.databases : [],
      cloud_tools: Array.isArray(profile.cloud_tools) ? profile.cloud_tools : [],
      experience: Array.isArray(profile.experience) ? profile.experience : [],
      projects: Array.isArray(profile.projects) ? profile.projects : [],
      certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
      achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
      soft_skills: Array.isArray(profile.soft_skills) ? profile.soft_skills : [],
    },
    
    score: {
      overall_score: typeof score.overall_score === 'number' ? score.overall_score : 0,
      categories: score.categories || {
        skills: 0,
        experience: 0,
        projects: 0,
        education: 0,
        structure: 0,
        ats_readiness: 0,
        certifications: 0,
        achievements: 0
      },
      strengths: Array.isArray(score.strengths) ? score.strengths : [],
      weaknesses: Array.isArray(score.weaknesses) ? score.weaknesses : [],
      improvement_priorities: Array.isArray(score.improvement_priorities) ? score.improvement_priorities : []
    },
    
    role_matches: Array.isArray(response.role_matches) 
      ? response.role_matches.map(rm => ({
          role: rm.role || '',
          match_percentage: typeof rm.match_percentage === 'number' ? rm.match_percentage : 0,
          matched_skills: Array.isArray(rm.matched_skills) ? rm.matched_skills : [],
          missing_required: Array.isArray(rm.missing_required) ? rm.missing_required : [],
          missing_preferred: Array.isArray(rm.missing_preferred) ? rm.missing_preferred : [],
          explanation: rm.explanation || ''
        }))
      : [],
      
    job_matches: Array.isArray(response.job_matches)
      ? response.job_matches.map(jm => ({
          job_id: jm.job_id || 0,
          title: jm.title || '',
          company: jm.company || '',
          location: jm.location || '',
          employment_type: jm.employment_type || '',
          experience: jm.experience || '',
          match_percentage: typeof jm.match_percentage === 'number' ? jm.match_percentage : 0,
          matched_skills: Array.isArray(jm.matched_skills) ? jm.matched_skills : [],
          missing_skills: Array.isArray(jm.missing_skills) ? jm.missing_skills : [],
          source: jm.source || '',
          job_url: jm.job_url || '',
          application_url: jm.application_url || '',
          posted_at: jm.posted_at || '',
          salary_min: jm.salary_min || null,
          salary_max: jm.salary_max || null,
          salary_currency: jm.salary_currency || '',
          why_this_job: jm.why_this_job || ''
        }))
      : [],
      
    skill_gaps: {
      target_role: skillGaps.target_role || '',
      existing_skills: Array.isArray(skillGaps.existing_skills) ? skillGaps.existing_skills : [],
      gaps: {
        high: Array.isArray(skillGaps.gaps?.high) ? skillGaps.gaps.high : [],
        medium: Array.isArray(skillGaps.gaps?.medium) ? skillGaps.gaps.medium : [],
        low: Array.isArray(skillGaps.gaps?.low) ? skillGaps.gaps.low : []
      }
    },
    
    suggestions: {
      summary_suggestion: suggestions.summary_suggestion || '',
      bullet_point_suggestions: Array.isArray(suggestions.bullet_point_suggestions) ? suggestions.bullet_point_suggestions : [],
      missing_sections: Array.isArray(suggestions.missing_sections) ? suggestions.missing_sections : [],
      keyword_suggestions: Array.isArray(suggestions.keyword_suggestions) ? suggestions.keyword_suggestions : [],
      general_suggestions: Array.isArray(suggestions.general_suggestions) ? suggestions.general_suggestions : []
    }
  };
}
