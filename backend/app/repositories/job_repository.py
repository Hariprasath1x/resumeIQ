from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.models.schemas import Job

client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.resumeiq
jobs_collection = db.jobs

def _map_mongo_doc_to_job(doc: dict) -> Job:
    doc_id = str(doc.get("_id", ""))
    title = doc.get("title", "")
    company = doc.get("company", "")
    location = doc.get("location", "")
    work_mode = doc.get("work_mode") or doc.get("workMode") or ""
    employment_type = doc.get("employment_type") or doc.get("employmentType") or ""
    required_skills = doc.get("required_skills") or doc.get("skills") or []
    preferred_skills = doc.get("preferred_skills") or []
    source = doc.get("source", "")
    job_url = doc.get("job_url") or doc.get("jobUrl") or ""
    application_url = doc.get("application_url") or doc.get("applicationUrl") or job_url
    posted_at = doc.get("posted_at") or doc.get("postedAt")
    salary_dict = doc.get("salary") if isinstance(doc.get("salary"), dict) else {}
    salary_min = doc.get("salary_min") or salary_dict.get("min")
    salary_max = doc.get("salary_max") or salary_dict.get("max")
    salary_currency = doc.get("salary_currency") or salary_dict.get("currency") or ""
    description = doc.get("description", "")
    return Job(
        id=doc_id,
        title=title,
        company=company,
        location=location,
        work_mode=work_mode,
        employment_type=employment_type,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        source=source,
        job_url=job_url,
        application_url=application_url,
        posted_at=posted_at,
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=salary_currency,
        description=description
    )

async def search_by_query_and_location(query: str, location: str) -> list[Job]:
    filter_query = {
        "$and": [
            {"$or": [{"title": {"$regex": query, "$options": "i"}}, {"description": {"$regex": query, "$options": "i"}}]},
            {"location": {"$regex": location, "$options": "i"}}
        ]
    }
    cursor = jobs_collection.find(filter_query)
    jobs = []
    async for doc in cursor:
        jobs.append(_map_mongo_doc_to_job(doc))
    return jobs

async def search_by_keyword(query: str) -> list[Job]:
    filter_query = {
        "$or": [{"title": {"$regex": query, "$options": "i"}}, {"description": {"$regex": query, "$options": "i"}}]
    }
    cursor = jobs_collection.find(filter_query)
    jobs = []
    async for doc in cursor:
        jobs.append(_map_mongo_doc_to_job(doc))
    return jobs

async def search_by_location(location: str) -> list[Job]:
    filter_query = {"location": {"$regex": location, "$options": "i"}}
    cursor = jobs_collection.find(filter_query)
    jobs = []
    async for doc in cursor:
        jobs.append(_map_mongo_doc_to_job(doc))
    return jobs

async def find_remote_jobs() -> list[Job]:
    filter_query = {
        "$or": [
            {"work_mode": {"$regex": "remote", "$options": "i"}},
            {"workMode": {"$regex": "remote", "$options": "i"}}
        ]
    }
    cursor = jobs_collection.find(filter_query)
    jobs = []
    async for doc in cursor:
        jobs.append(_map_mongo_doc_to_job(doc))
    return jobs
