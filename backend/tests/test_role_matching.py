from app.services.role_matching_service import match_roles, split_matched_missing
from app.models.schemas import ResumeProfile

def test_role_matching():
    profile = ResumeProfile(skills=["Python", "SQL", "Docker"])
    roles = match_roles(profile, 5)
    assert len(roles) > 0
    assert any(r.role == "Software Engineer" for r in roles)
    
    
def test_skill_normalization():
    matched, missing = split_matched_missing(["nodejs", "react.js"], ["Node.js", "React", "Python"])
    assert "Node.js" in matched
    assert "React" in matched
    assert "Python" in missing

def test_match_roles_perfect_match():
    profile = ResumeProfile(skills=["Python", "Git", "REST API", "FastAPI", "Docker", "PostgreSQL", "Flask", "Django"])
    matches = match_roles(profile, 1)
    assert len(matches) > 0
    assert matches[0].role == "Python Developer"
    assert matches[0].match_percentage == 100.0

def test_match_roles_partial_match():
    profile = ResumeProfile(skills=["Java", "Spring Boot", "Git"])
    matches = match_roles(profile, 5)
    java_dev = next((m for m in matches if m.role == "Java Developer"), None)
    assert java_dev is not None
    assert "SQL" in java_dev.missing_required
    assert java_dev.match_percentage < 100.0

def test_analyse_skill_gaps():
    from app.services.role_matching_service import analyse_skill_gaps
    profile = ResumeProfile(skills=["Java", "Spring Boot", "Git"])
    matches = match_roles(profile, 5)
    java_dev = next((m for m in matches if m.role == "Java Developer"), None)
    gaps = analyse_skill_gaps(profile, java_dev)
    assert gaps.target_role == "Java Developer"
    assert "SQL" in gaps.gaps.high
