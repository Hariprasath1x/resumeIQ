import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="ResumeIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "ResumeIQ Backend API"}

from app.api import resume, jobs, roles

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(roles.router, prefix="/api/analysis", tags=["analysis"])

