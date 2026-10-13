from app.models.schemas import AnalysisResponse, SkillGap
from app.services import groq_service
from app.services import scoring_service
from app.services import role_matching_service

def analyze_resume(clean_text: str) -> AnalysisResponse:
    # Step 1: Extract structured profile via Groq
    profile = groq_service.extract_resume_profile(clean_text)

    # Step 2: Calculate deterministic resume score
    score_result = scoring_service.calculate_score(profile)
    missing_sections = scoring_service.get_missing_sections(profile)

    # Step 3: Role matching
    role_matches = role_matching_service.match_roles(profile, 5)

    # Step 4: Skill gap analysis (based on top matched role)
    skill_gap = SkillGap()
    if role_matches:
        skill_gap = role_matching_service.analyse_skill_gaps(profile, role_matches[0])

    # Step 5: Groq role explanations
    role_matches = groq_service.generate_role_explanations(profile, role_matches)

    # Step 6: Groq improvement suggestions
    suggestions = groq_service.generate_improvement_suggestions(
        profile, score_result.weaknesses, missing_sections
    )

    return AnalysisResponse(
        resume_profile=profile,
        score=score_result,
        role_matches=role_matches,
        job_matches=[],
        skill_gaps=skill_gap,
        suggestions=suggestions
    )
