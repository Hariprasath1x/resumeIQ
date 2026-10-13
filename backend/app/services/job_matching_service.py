from app.models.schemas import Job, JobMatch, ResumeProfile
from app.services.role_matching_service import split_matched_missing, calculate_match_percentage

def match_jobs(profile: ResumeProfile, jobs: list[Job], top_n: int) -> list[JobMatch]:
    candidate_skills = profile.all_technical_skills()
    results = []

    for job in jobs:
        req_matched, req_missing = split_matched_missing(candidate_skills, job.required_skills)
        pref_matched, pref_missing = split_matched_missing(candidate_skills, job.preferred_skills)

        pct = calculate_match_percentage(
            len(req_matched), len(job.required_skills),
            len(pref_matched), len(job.preferred_skills)
        )

        all_matched = req_matched + pref_matched
        all_missing = req_missing + pref_missing

        match = JobMatch(
            job_id=job.id,
            title=job.title,
            company=job.company,
            location=job.location,
            work_mode=job.work_mode,
            employment_type=job.employment_type,
            source=job.source,
            job_url=job.job_url,
            application_url=job.application_url,
            posted_at=job.posted_at,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            description=job.description,
            match_percentage=round(pct, 1),
            matched_skills=all_matched,
            missing_skills=all_missing
        )
        results.append(match)

    results.sort(key=lambda x: x.match_percentage, reverse=True)
    return results[:top_n]
