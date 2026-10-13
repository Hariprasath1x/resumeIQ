import pytest
from app.models.schemas import ResumeProfile
from app.services.scoring_service import calculate_score

def test_score_calculation():
    profile = ResumeProfile(
        skills=["python", "java"],
        experience=["Software Engineer at TechCorp 2 years"],
        projects=["Built a cool app"],
        education=["BSc Computer Science"],
        professional_summary="A summary",
    )
    score = calculate_score(profile)
    assert score.overall_score > 0
    assert score.categories.skills == 8.0 # < 5 skills
    assert score.categories.experience == 11.0 # 1 entry + metrics (10 + 1)

def test_empty_profile():
    empty_profile = ResumeProfile()
    result = calculate_score(empty_profile)
    assert result.overall_score == 0.0
    assert result.categories.skills == 0.0
    assert "No education information found" in result.weaknesses

def test_strong_profile():
    profile = ResumeProfile(
        candidate_name="John Doe",
        professional_summary="A very strong software engineer with 10 years of experience.",
        education=["B.S. in Computer Science, University of Technology, 2010"],
        skills=["Java", "Spring Boot", "Docker", "Kubernetes", "SQL", "Git", "AWS"],
        programming_languages=["Python", "TypeScript"],
        experience=[
            "Senior Engineer at TechCorp: Increased performance by 50% and managed 10 engineers.",
            "Software Engineer at Startup: Built REST APIs and deployed to AWS."
        ],
        projects=[
            "E-commerce Platform: Designed and developed a scalable microservices architecture using Spring Boot and React.",
            "Analytics Dashboard: Built a real-time data visualization tool using Vue.js and D3.js."
        ],
        certifications=["AWS Certified Solutions Architect", "Certified Kubernetes Administrator"],
        achievements=["Employee of the Year 2021", "Hackathon Winner"]
    )
    result = calculate_score(profile)
    assert result.overall_score > 50.0
    assert result.categories.skills > 10.0
    assert result.categories.experience > 10.0
    assert "Good portfolio of projects" in result.strengths
