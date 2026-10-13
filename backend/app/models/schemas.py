from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any

class ResumeProfile(BaseModel):
    candidate_name: str = ""
    professional_summary: str = ""
    education: List[str] = []
    skills: List[str] = []
    programming_languages: List[str] = []
    frameworks: List[str] = []
    databases: List[str] = []
    cloud_tools: List[str] = []
    experience: List[str] = []
    projects: List[str] = []
    certifications: List[str] = []
    achievements: List[str] = []
    soft_skills: List[str] = []
    
    def all_technical_skills(self) -> List[str]:
        combined = (
            self.skills
            + self.programming_languages
            + self.frameworks
            + self.databases
            + self.cloud_tools
        )
        seen = set()
        unique = []
        for skill in combined:
            normalised = skill.lower().strip()
            if normalised not in seen:
                seen.add(normalised)
                unique.append(skill)
        return unique

class CategoryScores(BaseModel):
    skills: float
    experience: float
    projects: float
    education: float
    structure: float
    ats_readiness: float
    certifications: float
    achievements: float

class ScoreResult(BaseModel):
    overall_score: float = 0.0
    categories: CategoryScores
    strengths: List[str] = []
    weaknesses: List[str] = []
    improvement_priorities: List[str] = []

class RoleMatch(BaseModel):
    role: str
    match_percentage: float = 0.0
    matched_skills: List[str] = []
    missing_required: List[str] = []
    missing_preferred: List[str] = []
    explanation: str = ""

class SkillGapPriority(BaseModel):
    high: List[str] = []
    medium: List[str] = []
    low: List[str] = []

class SkillGap(BaseModel):
    target_role: str = ""
    existing_skills: List[str] = []
    gaps: Optional[SkillGapPriority] = None

class ImprovementSuggestions(BaseModel):
    summary_suggestion: str = ""
    bullet_point_suggestions: List[str] = []
    missing_sections: List[str] = []
    keyword_suggestions: List[str] = []
    general_suggestions: List[str] = []

class Job(BaseModel):
    id: str = Field(alias="_id", default="")
    title: str = ""
    company: str = ""
    location: str = ""
    work_mode: str = ""
    employment_type: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    source: str = ""
    job_url: str = ""
    application_url: str = ""
    posted_at: Any = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = ""
    description: str = ""

    model_config = ConfigDict(populate_by_name=True)

class JobMatch(BaseModel):
    job_id: str = ""
    title: str = ""
    company: str = ""
    location: str = ""
    work_mode: str = ""
    employment_type: str = ""
    source: str = ""
    job_url: str = ""
    application_url: str = ""
    posted_at: Any = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = ""
    description: str = ""
    match_percentage: float = 0.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    why_this_job: str = ""

class AnalysisResponse(BaseModel):
    resume_profile: ResumeProfile
    score: ScoreResult
    role_matches: List[RoleMatch]
    job_matches: List[JobMatch] = []
    skill_gaps: SkillGap
    suggestions: ImprovementSuggestions

class JobSearchRequest(BaseModel):
    resume_profile: ResumeProfile
    locations: List[str] = []
    roles: List[str] = []
    remote: bool = False
    max_results: int = 10

class ExtractRequest(BaseModel):
    resumeText: str

class RoleExplanationsRequest(BaseModel):
    resume_profile: ResumeProfile
    role_matches: List[RoleMatch]

class ImprovementSuggestionsRequest(BaseModel):
    resume_profile: ResumeProfile
    weaknesses: List[str]
    missing_sections: List[str]
