import logging
from fastapi import APIRouter, Depends
from app.dependencies.firebase_auth import verify_firebase_token
from app.models.schemas import JobSearchRequest, JobMatch
from app.repositories import job_repository
from app.services import job_matching_service
import re

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/search", response_model=list[JobMatch], dependencies=[Depends(verify_firebase_token)])
async def search_jobs(request: JobSearchRequest):
    locations = request.locations or []
    roles = request.roles or []
    has_remote = request.remote
    max_results = request.max_results if request.max_results > 0 else 10

    role_regex = ""
    if roles:
        sanitized_roles = [re.sub(r"[^a-zA-Z0-9 ]", "", r) for r in roles if r]
        role_regex = "|".join(sanitized_roles)

    candidate_jobs = {}

    # 1. Location x Role
    for loc in locations:
        location_token = re.sub(r"[^a-zA-Z0-9 ,]", "", loc).strip()
        if not location_token: continue

        if role_regex:
            loc_jobs = await job_repository.search_by_query_and_location(role_regex, location_token)
        else:
            loc_jobs = await job_repository.search_by_location(location_token)
        
        for job in loc_jobs:
            candidate_jobs[job.id] = job

    # 2. Remote jobs
    if has_remote:
        remote_jobs = await job_repository.find_remote_jobs()
        if role_regex:
            filtered = []
            pattern = re.compile(f".*({role_regex}).*", re.IGNORECASE)
            for job in remote_jobs:
                if (job.title and pattern.search(job.title)) or (job.description and pattern.search(job.description)):
                    filtered.append(job)
            remote_jobs = filtered
        
        for job in remote_jobs:
            candidate_jobs[job.id] = job

    # 3. Broad role search
    if not locations and not has_remote and role_regex and not candidate_jobs:
        role_jobs = await job_repository.search_by_keyword(role_regex)
        for job in role_jobs:
            candidate_jobs[job.id] = job

    logger.info(f"Job search - locations: {locations}, roles: {roles}, remote: {has_remote} -> {len(candidate_jobs)} candidate job(s)")

    if not candidate_jobs:
        return []

    # 4. Match
    matches = job_matching_service.match_jobs(request.resume_profile, list(candidate_jobs.values()), max_results)
    return matches
