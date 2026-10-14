# ResumeIQ REST API Reference

The ResumeIQ-py backend is built with FastAPI. When the server is running locally on port 8000, interactive API documentation is available at:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## Endpoint Summary

| Method | Endpoint | Auth Required | Content-Type | Description |
|---|---|:---:|---|---|
| `GET` | `/` | No | `application/json` | Health check endpoint returning backend service status. |
| `GET` | `/api/analysis/roles` | No | `application/json` | Returns the deterministic 10-role industry catalogue. |
| `POST` | `/api/resume/analyze` | **Yes (Bearer)** | `multipart/form-data` | Uploads a PDF/DOCX resume for extraction, scoring, and analysis. |
| `POST` | `/api/jobs/search` | **Yes (Bearer)** | `application/json` | Searches MongoDB jobs matching resume profile and criteria. |

---

## Authentication

Protected endpoints require a valid Firebase ID Token passed in the HTTP Authorization header:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Failure to provide a valid token results in an HTTP 401 response:

```json
{
  "detail": "Missing or invalid Authorization header"
}
```

Or when an invalid or expired token is presented:

```json
{
  "detail": "Invalid authentication token"
}
```

---

## 1. Health Check

### `GET /`
Verifies that the FastAPI server is running and responding.

- **Request:** No parameters or headers required.
- **Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "ResumeIQ Backend API"
  }
  ```

---

## 2. Role Catalogue

### `GET /api/analysis/roles`
Retrieves the predefined list of industry target roles used for deterministic role matching and skill gap derivation.

- **Request:** No parameters or headers required.
- **Response (`200 OK`):**
  ```json
  [
    {
      "role": "Software Engineer",
      "required_skills": ["Python", "Git", "SQL", "REST API"],
      "preferred_skills": ["Docker", "AWS", "CI/CD", "Linux"]
    },
    {
      "role": "Backend Developer",
      "required_skills": ["Python", "SQL", "REST API", "Git"],
      "preferred_skills": ["Docker", "Redis", "Kubernetes", "FastAPI", "Django"]
    },
    {
      "role": "Java Developer",
      "required_skills": ["Java", "Spring Boot", "SQL"],
      "preferred_skills": ["Docker", "AWS", "MongoDB", "Maven", "JUnit"]
    },
    {
      "role": "Python Developer",
      "required_skills": ["Python", "Git", "REST API"],
      "preferred_skills": ["FastAPI", "Django", "Flask", "Docker", "PostgreSQL"]
    },
    {
      "role": "Full Stack Developer",
      "required_skills": ["JavaScript", "HTML", "CSS", "REST API"],
      "preferred_skills": ["React", "Node.js", "SQL", "Docker", "TypeScript"]
    },
    {
      "role": "Data Analyst",
      "required_skills": ["SQL", "Python", "Excel"],
      "preferred_skills": ["Tableau", "Power BI", "Pandas", "NumPy", "Statistics"]
    },
    {
      "role": "Data Engineer",
      "required_skills": ["Python", "SQL", "ETL"],
      "preferred_skills": ["Spark", "Airflow", "AWS", "Kafka", "Databricks"]
    },
    {
      "role": "Machine Learning Engineer",
      "required_skills": ["Python", "Machine Learning", "SQL"],
      "preferred_skills": ["TensorFlow", "PyTorch", "Scikit-learn", "Docker", "AWS"]
    },
    {
      "role": "DevOps Engineer",
      "required_skills": ["Docker", "Linux", "CI/CD", "Git"],
      "preferred_skills": ["Kubernetes", "AWS", "Terraform", "Ansible", "Jenkins"]
    },
    {
      "role": "QA Engineer",
      "required_skills": ["Testing", "SQL", "Git"],
      "preferred_skills": ["Selenium", "Jest", "Postman", "CI/CD", "Python"]
    }
  ]
  ```

---

## 3. Resume Analysis

### `POST /api/resume/analyze`
Extracts structured information from an uploaded resume file (`.pdf` or `.docx`), executes deterministic scoring across eight categories, evaluates role fits, identifies skill gaps, and generates AI improvement recommendations.

- **Headers:**
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>` (Required)
  - `Content-Type: multipart/form-data`
- **Request Form Body:**
  - `file`: The binary document file (`.pdf` or `.docx`). Maximum file size: **10 MB**.
- **curl Example:**
  ```bash
  curl -X POST http://127.0.0.1:8000/api/resume/analyze \
    -H "Authorization: Bearer <TOKEN>" \
    -F "file=@sample_resume.pdf;type=application/pdf"
  ```

- **Response (`200 OK` - `AnalysisResponse`):**
  ```json
  {
    "resume_profile": {
      "candidate_name": "Alex Rivera",
      "professional_summary": "Senior Python Backend Developer with 5 years experience...",
      "education": [
        "B.S. in Computer Science, 2019"
      ],
      "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "Redis", "Kubernetes", "AWS", "SQL", "Git"],
      "programming_languages": ["Python"],
      "frameworks": ["FastAPI"],
      "databases": ["PostgreSQL", "Redis"],
      "cloud_tools": ["Docker", "Kubernetes", "AWS"],
      "experience": [
        "Backend Engineer at CloudScale: Designed and implemented high-throughput APIs using Python, FastAPI, and Redis."
      ],
      "projects": [
        "Microservices Gateway: Built containerized service on AWS using Docker and Kubernetes."
      ],
      "certifications": [],
      "achievements": [],
      "soft_skills": []
    },
    "score": {
      "overall_score": 61.6,
      "categories": {
        "skills": 16.0,
        "experience": 10.0,
        "projects": 8.5,
        "education": 7.0,
        "structure": 7.0,
        "ats_readiness": 13.1,
        "certifications": 0.0,
        "achievements": 0.0
      },
      "strengths": [
        "Strong and diverse technical skill set",
        "Good use of action verbs and measurable results"
      ],
      "weaknesses": [
        "Few or brief project descriptions",
        "No certifications found",
        "No achievements section found"
      ],
      "improvement_priorities": [
        "Expand work experience with quantified achievements",
        "Add detailed project descriptions",
        "Consider adding industry certifications",
        "Highlight key achievements",
        "Add more relevant technical skills"
      ]
    },
    "role_matches": [
      {
        "role": "Backend Developer",
        "match_percentage": 76.5,
        "matched_skills": ["Python", "SQL", "Git", "Docker", "FastAPI", "Kubernetes", "Redis"],
        "missing_required": ["REST API"],
        "missing_preferred": ["Django"],
        "explanation": "Strong foundation in Python and microservices aligns well with core backend responsibilities."
      }
    ],
    "job_matches": [],
    "skill_gaps": {
      "target_role": "Backend Developer",
      "existing_skills": ["Python", "SQL", "Git", "Docker", "FastAPI", "Kubernetes", "Redis"],
      "gaps": {
        "high": ["REST API"],
        "medium": ["Django"],
        "low": []
      }
    },
    "suggestions": {
      "summary_suggestion": "Quantify outcomes in your summary to demonstrate tangible business impact.",
      "bullet_point_suggestions": [
        "Add specific performance metrics to your backend engineering responsibilities (e.g., latency reduction %)."
      ],
      "missing_sections": [
        "Certifications",
        "Achievements"
      ],
      "keyword_suggestions": ["REST API", "CI/CD"],
      "general_suggestions": []
    }
  }
  ```

- **Error Codes:**
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `413 Payload Too Large`: Uploaded file exceeds 10 MB limit.
  - `422 Unprocessable Entity`: Unsupported format (only PDF and DOCX accepted) or empty document text (< 30 words).
  - `500 Internal Server Error`: Parsing or upstream AI extraction failure.

---

## 4. Job Search

### `POST /api/jobs/search`
Queries pre-populated job records in the MongoDB `resumeiq.jobs` collection and matches them against the candidate's skills and preferences.

- **Headers:**
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>` (Required)
  - `Content-Type: application/json`
- **Request Body (`JobSearchRequest`):**
  ```json
  {
    "resume_profile": {
      "skills": ["Python", "SQL", "Docker", "FastAPI"]
    },
    "roles": ["Software Engineer", "Backend Developer"],
    "locations": ["Remote", "USA"],
    "remote": true,
    "max_results": 5
  }
  ```

- **Response (`200 OK` - `List[JobMatch]`):**
  ```json
  [
    {
      "job_id": "6ac774b67c41b4c53118b2fb",
      "title": "Software Engineer / AI Code Trainer (Python, Web, Full Stack)",
      "company": "CodeForAI",
      "location": "USA, UK, India, Australia, Ireland, New Zealand, Philippines, Pakistan, Singapore, Mexico",
      "work_mode": "Remote",
      "employment_type": "contract",
      "source": "Remotive",
      "job_url": "https://remotive.com/remote-jobs/software-development/software-engineer-ai-code-trainer-python-web-full-stack-2091149",
      "application_url": "https://remotive.com/remote-jobs/software-development/software-engineer-ai-code-trainer-python-web-full-stack-2091149",
      "posted_at": "2026-10-05T05:15:43.000Z",
      "salary_min": null,
      "salary_max": null,
      "salary_currency": "USD",
      "description": "<p>Hourly contract rate commensurate with domain expertise...</p>",
      "match_percentage": 23.3,
      "matched_skills": ["Python"],
      "missing_skills": ["Java", "JavaScript", "TypeScript", "C++", "C#", "React", "Node.js", "SQL"],
      "why_this_job": ""
    }
  ]
  ```

- **Error Codes:**
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `422 Unprocessable Entity`: Request body violates `JobSearchRequest` schema.
  - `500 Internal Server Error`: MongoDB connection or query failure.
