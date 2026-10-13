import re
from app.models.schemas import RoleMatch, ResumeProfile, SkillGap, SkillGapPriority

SKILL_SYNONYMS = {
    "springboot": "spring boot",
    "spring-boot": "spring boot",
    "nodejs": "node.js",
    "node js": "node.js",
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue.js",
    "vue js": "vue.js",
    "angularjs": "angular",
    "postgres": "postgresql",
    "postgressql": "postgresql",
    "mongo": "mongodb",
    "k8s": "kubernetes",
    "gke": "kubernetes",
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "ml": "machine learning",
    "dl": "deep learning",
    "tf": "tensorflow",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "rest": "rest api",
    "restful": "rest api",
    "restful api": "rest api",
    "amazon web services": "aws",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "azure cloud": "azure",
    "microsoft azure": "azure",
    "powerbi": "power bi",
    "power-bi": "power bi"
}

def normalize_skill(skill: str) -> str:
    if not skill:
        return ""
    lower = skill.lower().strip()
    lower = re.sub(r"[.,;:!?]+$", "", lower)
    return SKILL_SYNONYMS.get(lower, lower)

def skills_match(candidate_skill: str, required_skill: str) -> bool:
    c = normalize_skill(candidate_skill)
    r = normalize_skill(required_skill)
    if c == r:
        return True
    
    # Check if one is a distinct word in the other
    c_pattern = r"\b" + re.escape(c) + r"\b"
    r_pattern = r"\b" + re.escape(r) + r"\b"
    
    if re.search(r_pattern, c) or re.search(c_pattern, r):
        return True
        
    return False

ROLE_CATALOG = [
    {"role": "Software Engineer", "required_skills": ["Python", "Git", "SQL", "REST API"], "preferred_skills": ["Docker", "AWS", "CI/CD", "Linux"]},
    {"role": "Backend Developer", "required_skills": ["Python", "SQL", "REST API", "Git"], "preferred_skills": ["Docker", "Redis", "Kubernetes", "FastAPI", "Django"]},
    {"role": "Java Developer", "required_skills": ["Java", "Spring Boot", "SQL"], "preferred_skills": ["Docker", "AWS", "MongoDB", "Maven", "JUnit"]},
    {"role": "Python Developer", "required_skills": ["Python", "Git", "REST API"], "preferred_skills": ["FastAPI", "Django", "Flask", "Docker", "PostgreSQL"]},
    {"role": "Full Stack Developer", "required_skills": ["JavaScript", "HTML", "CSS", "REST API"], "preferred_skills": ["React", "Node.js", "SQL", "Docker", "TypeScript"]},
    {"role": "Data Analyst", "required_skills": ["SQL", "Python", "Excel"], "preferred_skills": ["Tableau", "Power BI", "Pandas", "NumPy", "Statistics"]},
    {"role": "Data Engineer", "required_skills": ["Python", "SQL", "ETL"], "preferred_skills": ["Spark", "Airflow", "AWS", "Kafka", "Databricks"]},
    {"role": "Machine Learning Engineer", "required_skills": ["Python", "Machine Learning", "SQL"], "preferred_skills": ["TensorFlow", "PyTorch", "Scikit-learn", "Docker", "AWS"]},
    {"role": "DevOps Engineer", "required_skills": ["Docker", "Linux", "CI/CD", "Git"], "preferred_skills": ["Kubernetes", "AWS", "Terraform", "Ansible", "Jenkins"]},
    {"role": "QA Engineer", "required_skills": ["Testing", "SQL", "Git"], "preferred_skills": ["Selenium", "Jest", "Postman", "CI/CD", "Python"]}
]

def split_matched_missing(candidate_skills: list[str], target_skills: list[str]) -> tuple[list[str], list[str]]:
    matched = []
    missing = []
    if not target_skills:
        return matched, missing
    for skill in target_skills:
        is_matched = any(skills_match(cs, skill) for cs in candidate_skills)
        if is_matched:
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing

def calculate_match_percentage(matched_req: int, total_req: int, matched_pref: int, total_pref: int) -> float:
    req_ratio = (matched_req / total_req) if total_req > 0 else 0.0
    pref_ratio = (matched_pref / total_pref) if total_pref > 0 else 0.0
    return (req_ratio * 0.70 + pref_ratio * 0.30) * 100

def match_roles(profile: ResumeProfile, top_n: int) -> list[RoleMatch]:
    candidate_skills = profile.all_technical_skills()
    results = []

    for role_def in ROLE_CATALOG:
        role_name = role_def["role"]
        required = role_def["required_skills"]
        preferred = role_def["preferred_skills"]

        req_matched, req_missing = split_matched_missing(candidate_skills, required)
        pref_matched, pref_missing = split_matched_missing(candidate_skills, preferred)

        pct = calculate_match_percentage(
            len(req_matched), len(required),
            len(pref_matched), len(preferred)
        )

        all_matched = req_matched + pref_matched
        
        results.append(RoleMatch(
            role=role_name,
            match_percentage=round(pct, 1),
            matched_skills=all_matched,
            missing_required=req_missing,
            missing_preferred=pref_missing
        ))

    results.sort(key=lambda x: x.match_percentage, reverse=True)
    return results[:top_n]

def analyse_skill_gaps(profile: ResumeProfile, top_role: RoleMatch) -> SkillGap:
    gaps = SkillGapPriority(
        high=top_role.missing_required,
        medium=top_role.missing_preferred,
        low=[]
    )
    return SkillGap(
        target_role=top_role.role,
        existing_skills=top_role.matched_skills,
        gaps=gaps
    )

def get_role_catalog() -> list[dict]:
    return ROLE_CATALOG
