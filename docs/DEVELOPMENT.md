# Development Guide & Environment Setup

This guide walks through configuring, developing, testing, and debugging ResumeIQ-py locally.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation:

| Tool | Recommended Version | Verification Command | Notes |
|---|---|---|---|
| **Python** | `3.12.x` | `python3.12 --version` | **Required.** Python 3.12 has stable wheels for `pymupdf` and `pydantic-core`. Do not use Python 3.14+ (pre-release) or older unsupported versions. |
| **Node.js** | `18.x` or `20.x` | `node -v` | Used for React frontend development and bundling. |
| **npm** | `9.x` or `10.x` | `npm -v` | Node package manager. |
| **MongoDB** | `7.x` or `8.x` | `mongod --version` | Local or remote instance hosting the `resumeiq.jobs` collection. |
| **Git** | `2.x` | `git --version` | Version control. |

You also need:
- A free **Groq Cloud API Key** ([console.groq.com](https://console.groq.com)).
- A **Firebase Project** with Authentication enabled (Google OAuth or Email).

---

## 2. Repository Structure

```text
ResumeIQ-py/
├── README.md                      # Comprehensive project overview
├── .gitignore                     # Repository-wide ignore rules
├── docs/                          # Architecture, API & Development guides
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEVELOPMENT.md
├── frontend/                      # React SPA
│   ├── src/                       # Components, context, styles
│   ├── public/                    # Favicon, SVGs
│   ├── package.json               # Dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── .env                       # Local secrets (never commit)
│   └── .env.example               # Safe template
└── backend/                       # Unified FastAPI backend
    ├── app/
    │   ├── api/                   # HTTP Route controllers
    │   ├── config.py              # Settings via pydantic-settings
    │   ├── dependencies/          # Firebase token validator
    │   ├── models/                # Pydantic v2 schemas
    │   ├── parsers/               # PDF/DOCX parsers & text cleaner
    │   ├── repositories/          # MongoDB Motor repository
    │   ├── services/              # Scoring, matching, AI services
    │   └── main.py                # FastAPI entry point
    ├── tests/                     # pytest test suite
    ├── requirements.txt           # Python dependencies
    ├── .env                       # Local secrets (never commit)
    └── .env.example               # Safe template
```

---

## 3. Step-by-Step Setup

### Step 3.1: Backend Virtual Environment & Dependencies

From the repository root:

```bash
cd backend

# Create virtual environment explicitly using Python 3.12
python3.12 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Verify dependency integrity
python -m pip check
```

> [!TIP]
> Always verify the active interpreter resolves to `backend/.venv/bin/python` by running:
> ```bash
> ./.venv/bin/python -c "import sys; print(sys.executable)"
> ```

### Step 3.2: Backend Environment Configuration

Create `backend/.env` from `backend/.env.example`:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key
GROQ_MODEL=llama3-70b-8192
MONGODB_URI=mongodb://localhost:27017/
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=secrets/firebase-service-account.json
FRONTEND_URL=http://localhost:5173
```

Place your Firebase Service Account JSON file in `backend/secrets/firebase-service-account.json`. (This path is ignored by `.gitignore` and must never be committed).

### Step 3.3: Frontend Setup

Open a second terminal:

```bash
cd frontend

# Install npm dependencies
npm install

# Copy environment example
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:8000
```

---

## 4. Running the Application Locally

### Starting the Backend
Run from `backend/`:

```bash
./.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- Endpoint: `http://127.0.0.1:8000`
- Interactive Docs: `http://127.0.0.1:8000/docs`

### Starting the Frontend
Run from `frontend/`:

```bash
npm run dev
```

- Application UI: `http://localhost:5173`

---

## 5. Testing & Quality Assurance

### Running Backend Tests
Execute the comprehensive test suite with Python 3.12:

```bash
cd backend
PYTHONPATH=. ./.venv/bin/python -m pytest -v
```

All 20 test cases should pass:
- `tests/test_parsers.py`: PDF/DOCX parsing, whitespace normalization, null byte removal, line noise filters.
- `tests/test_role_matching.py`: Role matching, 70/30 weighting, skill normalization, missing skill gap sorting.
- `tests/test_scoring.py`: 8-category formulas, baseline profile, empty profile edge cases.
- `tests/test_jobs.py`: MongoDB document mapping (camelCase & skills arrays), job match calculation.
- `tests/test_auth.py`: Token verification, 401 rejection for missing/invalid/expired tokens, public route bypass.

### Building the Frontend
Validate that production bundling succeeds without TypeScript or bundling errors:

```bash
cd frontend
npm run build
```

---

## 6. Troubleshooting Common Issues

### 1. Port 8000 Already in Use
**Symptom:** `[Errno 48] address already in use` when starting Uvicorn.  
**Resolution:** Check what process is occupying port 8000:
```bash
lsof -i :8000
```
If an orphaned process from a previous session is holding the port, terminate it using its PID:
```bash
kill <PID>
```

### 2. Python Version or Import Conflicts
**Symptom:** Package installation fails with compilation errors (e.g., C headers failing on `pydantic-core`).  
**Resolution:** You are running an unsupported Python version (e.g. Python 3.14 alpha or 3.9). Ensure the virtual environment is recreated with Python 3.12:
```bash
python3.12 -m venv .venv
```

### 3. Firebase Auth Failure on Protected Routes
**Symptom:** Requests return `401 Unauthorized` with `{"detail": "Invalid authentication token"}` or backend logs report `FIREBASE AUTH FAILURE`.  
**Resolution:**
- Confirm `FIREBASE_PROJECT_ID` in `backend/.env` matches `VITE_FIREBASE_PROJECT_ID` in `frontend/.env`.
- Ensure `FIREBASE_CREDENTIALS_PATH` points to a valid service account file at `backend/secrets/firebase-service-account.json`.
- Ensure client system clock is synchronized (skewed clocks cause JWT token expiration failures).

### 4. MongoDB Shows Zero Jobs
**Symptom:** `POST /api/jobs/search` returns an empty array `[]`.  
**Resolution:** Verify MongoDB is running on `mongodb://localhost:27017/` and that the `resumeiq` database contains populated records in `jobs`:
```bash
python -c "import pymongo; client = pymongo.MongoClient('mongodb://localhost:27017/'); print('Count:', client.resumeiq.jobs.count_documents({}))"
```
The application does not invent or seed mock jobs; it requires existing records to discover opportunities.

---

## 7. Git Hygiene & Security Rules

1. **Never Commit Secrets:**
   - `.env`, `.env.local`, `*.env` must never be staged.
   - `secrets/` and `firebase-service-account.json` are strictly ignored.
2. **Never Commit Build Artifacts:**
   - `.venv/` and `node_modules/` must stay uncommitted.
   - `dist/` is generated on demand via `npm run build`.
3. **Preserve Codebase Integrity:**
   - Do not alter scoring weights, role catalogues, or API response schemas.
