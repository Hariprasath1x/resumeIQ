# System Architecture & Technical Design

## 1. Architectural Overview

ResumeIQ-py is a language and architecture migration of the original ResumeIQ platform. The original design relied on a Java 21 / Spring Boot primary backend (port 8080) communicating via HTTP with a separate Python FastAPI AI microservice (port 8000), alongside a React SPA (port 5173), Firebase Authentication, Groq LLM API, and MongoDB.

In **ResumeIQ-py**, the backend responsibilities have been unified into a single, high-performance, asynchronous Python / FastAPI application running on port 8000. The Python backend natively handles document ingestion, deterministic scoring, role matching, AI orchestration, database queries, and token verification, eliminating inter-service HTTP hops and simplifying runtime deployment.

```mermaid
graph TB
    subgraph Client ["Client Tier (Browser)"]
        User["User / Web Browser"]
        SPA["React + Vite Frontend\n(Port 5173)"]
    end

    subgraph Auth ["Authentication Tier"]
        FirebaseAuth["Firebase Authentication\n(OAuth / Email)"]
    end

    subgraph Backend ["Unified Backend Tier (FastAPI - Port 8000)"]
        API["FastAPI HTTP Router\n(/api/resume, /api/jobs, /api/analysis)"]
        TokenDep["Firebase Auth Guard\n(Firebase Admin SDK)"]
        Parsers["Document Parser Engine\n(PyMuPDF, python-docx, TextCleaner)"]
        Scorer["Deterministic Scoring Engine\n(8 Categories / 100 pt Weighting)"]
        RoleMatcher["Role & Skill Matcher\n(10 Roles, 34 Synonyms, 70/30 Weight)"]
        JobMatcher["Job Matcher Engine\n(In-memory Skill Scoring)"]
        MongoRepo["Job Repository\n(Motor Async Client)"]
        GroqService["AI Service Orchestrator\n(Groq SDK - Llama 3)"]
    end

    subgraph External ["External Services & Data"]
        GroqAPI["Groq Cloud API\n(llama3-70b-8192)"]
        MongoDB[("MongoDB Database\n(Database: resumeiq, Collection: jobs)")]
        ExtJobs["External Job Portals\n(Remotive, Himalayas, Direct)"]
    end

    User -->|Interacts| SPA
    SPA -->|1. Sign in / Get ID Token| FirebaseAuth
    SPA -->|2. HTTP Request + Bearer Token| API
    API -->|Verify ID Token| TokenDep
    TokenDep -.->|Validate Signature| FirebaseAuth

    API -->|Parse PDF/DOCX| Parsers
    Parsers -->|Clean Text| Scorer
    Parsers -->|Extract JSON Profile| GroqService
    GroqService -->|Prompt Completion| GroqAPI

    Scorer -->|Profile Scores| API
    GroqService -->|Structured Profile| RoleMatcher
    RoleMatcher -->|Top Roles & Skill Gaps| API
    RoleMatcher -->|Generate Explanations| GroqService

    API -->|Search Criteria| MongoRepo
    MongoRepo -->|Read-only Query| MongoDB
    MongoRepo -->|Job Documents| JobMatcher
    JobMatcher -->|Ranked Matches| API

    SPA -->|3. Click Application Link| ExtJobs
```

---

## 2. Component Breakdown & Responsibilities

| Component | Module Path | Primary Responsibility |
|---|---|---|
| **API Entrypoint & Routers** | `app/main.py`, `app/api/` | Initializes FastAPI application, registers CORS middleware, and handles HTTP endpoints for resume upload, role discovery, and job search. |
| **Configuration** | `app/config.py` | Type-safe environment loading using Pydantic Settings (`pydantic-settings`). Loads `.env` values for Groq, MongoDB, Firebase, and CORS. |
| **Authentication Guard** | `app/dependencies/firebase_auth.py` | FastAPI `Security(HTTPBearer)` dependency. Verifies Firebase ID tokens via the Firebase Admin SDK. Rejects missing, invalid, or expired tokens with HTTP 401. |
| **Data Schemas & Models** | `app/models/schemas.py` | Strict Pydantic v2 data models for resume profiles, category scores, role matches, skill gaps, improvement suggestions, and job postings. |
| **Document Parsers** | `app/parsers/` | Extracts raw text from uploaded files: PyMuPDF for PDF (`pdf_parser.py`), `python-docx` for Word documents (`docx_parser.py`), and regex normalizer (`cleaner.py`). |
| **Scoring Engine** | `app/services/scoring_service.py` | Deterministic, non-AI calculation across 8 distinct categories totaling 100 points. Generates strengths, weaknesses, and prioritized improvement actions. |
| **Role Matching Engine** | `app/services/role_matching_service.py` | Deterministic matching against a 10-role industry catalogue. Applies 34 skill synonyms and weighted scoring (70% required / 30% preferred). |
| **Job Repository** | `app/repositories/job_repository.py` | Asynchronous Motor client querying MongoDB `resumeiq.jobs`. Maps legacy document structures into typed `Job` models without modifying database records. |
| **Job Matching Engine** | `app/services/job_matching_service.py` | Scores candidate technical skills against filtered MongoDB job opportunities, calculating match percentages and missing skills. |
| **AI Orchestrator** | `app/services/groq_service.py` | Interfaces with Groq API. Extracts structured resume profiles with automated JSON repair, produces concise role explanations, and generates targeted improvement tips. |
| **Analysis Pipeline** | `app/services/analysis_service.py` | Orchestrates the multi-stage resume analysis pipeline from text extraction to combined JSON response delivery. |

---

## 3. Resume Analysis Flow (Sequence Diagram)

When a user uploads a resume file (`.pdf` or `.docx`), the frontend attaches the active Firebase Bearer token and submits a `multipart/form-data` request to `POST /api/resume/analyze`.

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as React Frontend
    participant FB as Firebase Auth
    participant API as FastAPI Router
    participant Auth as Auth Dependency
    participant Parser as Parser & Cleaner
    participant Groq as Groq Service
    participant Scorer as Scoring Engine
    participant Role as Role Matcher

    User->>UI: Selects & uploads resume (PDF / DOCX)
    UI->>FB: Retrieves active Firebase ID Token
    FB-->>UI: Returns Bearer JWT
    UI->>API: POST /api/resume/analyze (File + Bearer Token)
    API->>Auth: verify_firebase_token(creds)
    Auth-->>API: Validated UID (or 401 Unauthorized)
    
    API->>Parser: parse_pdf() or parse_docx()
    Parser->>Parser: clean_resume_text() + is_text_meaningful()
    Parser-->>API: Clean, normalized text
    
    API->>Groq: extract_resume_profile(clean_text)
    Groq-->>API: ResumeProfile (Structured candidate data)
    
    API->>Scorer: calculate_score(profile)
    Scorer-->>API: ScoreResult (8 Categories, strengths, weaknesses)
    
    API->>Role: match_roles(profile, top_n=5)
    Role-->>API: List[RoleMatch]
    
    API->>Role: analyse_skill_gaps(profile, top_role)
    Role-->>API: SkillGap (Target role, high/medium/low gaps)
    
    API->>Groq: generate_role_explanations(profile, role_matches)
    Groq-->>API: Updated RoleMatches with contextual explanations
    
    API->>Groq: generate_improvement_suggestions(profile, weaknesses, missing_sections)
    Groq-->>API: ImprovementSuggestions (Summary, bullets, general tips)
    
    API-->>UI: AnalysisResponse JSON
    UI-->>User: Renders ScoreCard, Breakdown, Role Matches & Suggestions
```

---

## 4. Job Discovery Flow (Sequence Diagram)

Job discovery allows candidates to find live opportunities matched against their analyzed profile. The user selects search parameters (target roles, locations, remote preference) in the existing UI, which invokes `POST /api/jobs/search`.

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as React Frontend
    participant API as FastAPI Router
    participant Auth as Auth Dependency
    participant Repo as Job Repository
    participant DB as MongoDB (resumeiq.jobs)
    participant Matcher as Job Matcher Engine

    User->>UI: Selects roles, locations, and "Remote" toggle
    UI->>API: POST /api/jobs/search (JobSearchRequest + Bearer Token)
    API->>Auth: verify_firebase_token(creds)
    Auth-->>API: Validated UID
    
    alt Remote Selected
        API->>Repo: find_remote_jobs()
        Repo->>DB: find({"$or": [{"work_mode": /remote/i}, {"workMode": /remote/i}]})
        DB-->>Repo: Matching MongoDB documents
    else Location & Query Specified
        API->>Repo: search_by_query_and_location(roles, locations)
        Repo->>DB: find({"$and": [{"title/description": /roles/i}, {"location": /location/i}]})
        DB-->>Repo: Matching MongoDB documents
    end
    
    Repo->>Repo: _map_mongo_doc_to_job() (Normalizes camelCase/snake_case)
    Repo-->>API: List[Job] candidate models
    
    API->>Matcher: match_jobs(profile, candidate_jobs, max_results)
    Matcher->>Matcher: Calculate match percentage (70% req / 30% pref)
    Matcher->>Matcher: Sort descending by match_percentage
    Matcher-->>API: List[JobMatch]
    
    API-->>UI: JSON array of JobMatch objects
    UI-->>User: Displays matched jobs with score badges and "Apply" links
    User->>UI: Clicks "Apply"
    UI-->>User: Navigates to external job posting URL
```

---

## 5. Upstream Data Ingestion Architecture (Decoupled)

The runtime application operates exclusively as a **read-only consumer** of the `resumeiq.jobs` collection. Upstream data collection occurs asynchronously through external automated workflows (e.g., n8n webhooks or scraping jobs) that populate MongoDB independently.

```mermaid
graph LR
    subgraph Upstream ["Asynchronous Job Ingestion (Independent)"]
        Sources["Job Boards\n(Remotive, Himalayas, Adzuna)"]
        Ingestion["Ingestion Pipeline / n8n Automation"]
        Sources -->|Fetch & Deduplicate| Ingestion
    end

    subgraph Database ["Persistence Layer"]
        MongoDB[("MongoDB: resumeiq.jobs\n(37+ Pre-populated Documents)")]
    end

    subgraph Runtime ["ResumeIQ Runtime Application"]
        Backend["FastAPI Backend\n(Read-only Motor Client)"]
        Frontend["React UI"]
        Backend -->|Query Jobs| MongoDB
        Frontend -->|Search Requests| Backend
    end

    Ingestion -->|Periodic Seed / Upsert| MongoDB
```

---

## 6. Security Architecture

1. **Client-Side Authentication:** Handled via Firebase Web SDK in the React application (`frontend/src/firebase.js`). Google OAuth popup and email/password providers generate short-lived JWT ID tokens.
2. **Server-Side Token Verification:** Protected backend endpoints require an `Authorization: Bearer <id_token>` header. The `verify_firebase_token` FastAPI dependency passes this token to `firebase_admin.auth.verify_id_token()`, verifying:
   - Token signature against Google's public certificates.
   - Token issuer (`https://securetoken.google.com/<FIREBASE_PROJECT_ID>`).
   - Token expiration timestamp.
3. **Fail-Closed Security Posture:**
   - Missing Authorization header -> **HTTP 401** (`Missing or invalid Authorization header`).
   - Tampered / invalid token -> **HTTP 401** (`Invalid authentication token`).
   - Expired token -> **HTTP 401** (`Invalid authentication token`).
   - No bypasses or fallback mock tokens are permitted in production code paths.
4. **Credential Isolation:** Service account private keys (`secrets/firebase-service-account.json`) and API keys (`.env`) are strictly excluded from version control via `.gitignore`.
