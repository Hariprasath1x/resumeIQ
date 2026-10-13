import re
from app.models.schemas import ResumeProfile, ScoreResult, CategoryScores

WEIGHT_SKILLS = 20.0
WEIGHT_EXPERIENCE = 20.0
WEIGHT_PROJECTS = 15.0
WEIGHT_EDUCATION = 10.0
WEIGHT_STRUCTURE = 10.0
WEIGHT_ATS = 15.0
WEIGHT_CERTIFICATIONS = 5.0
WEIGHT_ACHIEVEMENTS = 5.0

ATS_ACTION_VERBS = {
    "developed", "built", "designed", "implemented", "led", "managed",
    "improved", "optimised", "optimized", "created", "delivered", "reduced",
    "increased", "automated", "deployed", "architected", "collaborated",
    "maintained", "migrated", "integrated", "analysed", "analyzed", "tested",
    "reviewed", "mentored", "launched", "engineered", "streamlined"
}

TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "node",
    "spring", "django", "fastapi", "flask", "sql", "nosql", "mongodb",
    "postgresql", "mysql", "docker", "kubernetes", "aws", "azure", "gcp",
    "git", "linux", "api", "rest", "graphql", "ci/cd", "agile", "scrum",
    "machine learning", "ml", "deep learning", "tensorflow", "pytorch",
    "data", "analytics", "excel", "tableau", "power bi"
}

METRIC_PATTERN = re.compile(r"\b\d+\s*(%|x|k|\+|years?|months?|users?|requests?)\b", re.IGNORECASE)

def calculate_score(profile: ResumeProfile) -> ScoreResult:
    skills_score = _score_skills(profile)
    experience_score = _score_experience(profile)
    projects_score = _score_projects(profile)
    education_score = _score_education(profile)
    structure_score = _score_structure(profile)
    ats_score = _score_ats(profile)
    cert_score = _score_certifications(profile)
    achievements_score = _score_achievements(profile)

    overall = round(
        skills_score + experience_score + projects_score + education_score +
        structure_score + ats_score + cert_score + achievements_score, 1
    )

    categories = CategoryScores(
        skills=round(skills_score, 1),
        experience=round(experience_score, 1),
        projects=round(projects_score, 1),
        education=round(education_score, 1),
        structure=round(structure_score, 1),
        ats_readiness=round(ats_score, 1),
        certifications=round(cert_score, 1),
        achievements=round(achievements_score, 1)
    )

    strengths = []
    weaknesses = []
    _derive_strengths_weaknesses(categories, strengths, weaknesses)
    priorities = _derive_priorities(categories)

    return ScoreResult(
        overall_score=overall,
        categories=categories,
        strengths=strengths,
        weaknesses=weaknesses,
        improvement_priorities=priorities
    )

def _score_skills(profile: ResumeProfile) -> float:
    count = len(profile.all_technical_skills())
    if count == 0: return 0.0
    if count < 5: return 8.0
    if count < 10: return 13.0
    if count < 15: return 16.0
    return 20.0

def _score_experience(profile: ResumeProfile) -> float:
    entries = profile.experience
    if not entries: return 0.0
    count = len(entries)
    if count == 1: base = 10.0
    elif count == 2: base = 14.0
    elif count == 3: base = 17.0
    else: base = 19.0

    has_metrics = any(re.search(r"\d", e) for e in entries)
    bonus = 1.0 if has_metrics else 0.0
    return min(base + bonus, WEIGHT_EXPERIENCE)

def _score_projects(profile: ResumeProfile) -> float:
    projects = profile.projects
    if not projects: return 0.0
    count = len(projects)
    avg_len = sum(len(p) for p in projects) / count if count > 0 else 0.0
    
    if count == 1: base = 7.0
    elif count == 2: base = 10.0
    else: base = 12.0

    bonus = 3.0 if avg_len > 60 else (1.5 if avg_len > 30 else 0.0)
    return min(base + bonus, WEIGHT_PROJECTS)

def _score_education(profile: ResumeProfile) -> float:
    education = profile.education
    if not education: return 0.0
    avg_len = sum(len(e) for e in education) / len(education) if education else 0.0
    return 10.0 if avg_len > 40 else 7.0

def _score_structure(profile: ResumeProfile) -> float:
    present = 0
    if profile.professional_summary: present += 1
    if profile.education: present += 1
    if profile.skills or profile.programming_languages: present += 1
    if profile.experience: present += 1
    if profile.projects: present += 1
    if profile.certifications: present += 1

    if present >= 6: return 10.0
    if present == 5: return 9.0
    if present == 4: return 7.0
    if present == 3: return 5.0
    if present == 2: return 3.0
    if present == 1: return 1.0
    return 0.0

def _score_ats(profile: ResumeProfile) -> float:
    all_text = " ".join(
        [profile.professional_summary] +
        profile.experience +
        profile.projects +
        profile.skills
    ).lower()

    verb_count = sum(1 for v in ATS_ACTION_VERBS if v in all_text)
    verb_score = min((verb_count / 5.0) * 6.0, 6.0)

    tech_count = sum(1 for t in TECH_KEYWORDS if t in all_text)
    tech_score = min((tech_count / 5.0) * 5.0, 5.0)

    has_numbers = bool(METRIC_PATTERN.search(all_text))
    metric_score = 4.0 if has_numbers else 0.0

    return min(verb_score + tech_score + metric_score, WEIGHT_ATS)

def _score_certifications(profile: ResumeProfile) -> float:
    count = len(profile.certifications) if profile.certifications else 0
    if count == 0: return 0.0
    if count == 1: return 3.0
    if count == 2: return 4.0
    return 5.0

def _score_achievements(profile: ResumeProfile) -> float:
    count = len(profile.achievements) if profile.achievements else 0
    if count == 0: return 0.0
    if count == 1: return 3.0
    if count == 2: return 4.0
    return 5.0

def _derive_strengths_weaknesses(categories: CategoryScores, strengths: list, weaknesses: list):
    if categories.skills >= 16: strengths.append("Strong and diverse technical skill set")
    elif categories.skills < 10: weaknesses.append("Limited technical skills listed")

    if categories.experience >= 16: strengths.append("Solid professional experience")
    elif categories.experience < 8: weaknesses.append("Work experience section needs more detail")

    if categories.projects >= 12: strengths.append("Good portfolio of projects")
    elif categories.projects < 6: weaknesses.append("Few or brief project descriptions")

    if categories.education >= 8: strengths.append("Education section is well documented")
    elif categories.education == 0: weaknesses.append("No education information found")

    if categories.ats_readiness >= 12: strengths.append("Good use of action verbs and measurable results")
    elif categories.ats_readiness < 7: weaknesses.append("Resume lacks action verbs and quantified results")

    if categories.certifications >= 4: strengths.append("Relevant certifications listed")
    elif categories.certifications == 0: weaknesses.append("No certifications found")

    if categories.achievements >= 4: strengths.append("Notable achievements highlighted")
    elif categories.achievements == 0: weaknesses.append("No achievements section found")

    if categories.structure >= 8: strengths.append("Resume has a clear and complete structure")
    elif categories.structure < 5: weaknesses.append("Resume is missing standard sections")

def _derive_priorities(categories: CategoryScores) -> list[str]:
    gaps = [
        (WEIGHT_EXPERIENCE - categories.experience, "Expand work experience with quantified achievements"),
        (WEIGHT_SKILLS - categories.skills, "Add more relevant technical skills"),
        (WEIGHT_ATS - categories.ats_readiness, "Use more action verbs and add measurable metrics"),
        (WEIGHT_PROJECTS - categories.projects, "Add detailed project descriptions"),
        (WEIGHT_STRUCTURE - categories.structure, "Ensure all standard sections are present"),
        (WEIGHT_EDUCATION - categories.education, "Complete the education section"),
        (WEIGHT_CERTIFICATIONS - categories.certifications, "Consider adding industry certifications"),
        (WEIGHT_ACHIEVEMENTS - categories.achievements, "Highlight key achievements")
    ]
    
    gaps = [g for g in gaps if g[0] > 0]
    gaps.sort(key=lambda x: x[0], reverse=True)
    return [g[1] for g in gaps[:5]]

def get_missing_sections(profile: ResumeProfile) -> list[str]:
    missing = []
    if not profile.professional_summary:
        missing.append("Professional Summary / Objective")
    if not profile.education:
        missing.append("Education")
    if not profile.skills and not profile.programming_languages:
        missing.append("Skills")
    if not profile.experience:
        missing.append("Work Experience")
    if not profile.projects:
        missing.append("Projects")
    if not profile.certifications:
        missing.append("Certifications")
    if not profile.achievements:
        missing.append("Achievements")
    return missing
