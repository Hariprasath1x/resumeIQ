import pytest
from unittest.mock import MagicMock
from app.models.schemas import Job, ResumeProfile
from app.services.job_matching_service import match_jobs
from app.repositories.job_repository import _map_mongo_doc_to_job

def test_map_mongo_doc_camelcase_and_skills():
    raw_doc = {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Software Engineer",
        "company": "Acme Corp",
        "location": "Remote",
        "workMode": "Remote",
        "employmentType": "Full-time",
        "skills": ["Python", "SQL", "Docker"],
        "source": "Remotive",
        "jobUrl": "https://example.com/jobs/1",
        "postedAt": "2026-10-01T00:00:00Z",
        "salary": {"min": 80000, "max": 120000, "currency": "USD"},
        "description": "Great job"
    }
    job = _map_mongo_doc_to_job(raw_doc)
    assert job.id == "507f1f77bcf86cd799439011"
    assert job.title == "Software Engineer"
    assert job.work_mode == "Remote"
    assert job.employment_type == "Full-time"
    assert "Python" in job.required_skills
    assert job.job_url == "https://example.com/jobs/1"
    assert job.application_url == "https://example.com/jobs/1"
    assert job.salary_min == 80000
    assert job.salary_max == 120000
    assert job.salary_currency == "USD"

def test_job_matching_calculation():
    job = Job(
        id="job-1",
        title="Python Engineer",
        company="Tech Co",
        location="Remote",
        work_mode="Remote",
        required_skills=["Python", "SQL", "Git"],
        preferred_skills=["Docker", "AWS"],
        job_url="https://example.com/apply"
    )
    profile = ResumeProfile(skills=["Python", "SQL", "Docker"])
    matches = match_jobs(profile, [job], 1)
    assert len(matches) == 1
    m = matches[0]
    assert m.job_id == "job-1"
    # Required: 2/3 = 66.7% * 0.7 = 46.7%, Preferred: 1/2 = 50% * 0.3 = 15.0%, Total = 61.7%
    assert m.match_percentage == 61.7
    assert "Python" in m.matched_skills
    assert "SQL" in m.matched_skills
    assert "Docker" in m.matched_skills
    assert "Git" in m.missing_skills
