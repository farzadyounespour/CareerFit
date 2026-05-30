# CareerFit

CareerFit is an explainable resume-job matching prototype. The MVP lets a user enter profile details, paste or upload resume content, paste a job description, and receive an application-readiness report with matched, partial, weak, and missing requirements.

## Project Structure

```text
CareerFit/
  backend/              Django + Django REST Framework API
    apps/
      accounts/         User profile domain
      resumes/          Resume text/upload domain
      jobs/             Job description/search domain
      matching/         Resume-job matching API and NLP services
      core/             Shared utilities
  frontend/             React + JavaScript + Tailwind CSS app
    src/
      components/       Reusable UI and report components
      screens/          User, resume, job, and report screens
      services/         API client functions
      data/             Sample resume/job inputs
  docs/                 Architecture and roadmap notes
```

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000`.

To enable Adzuna job search, create `backend/.env` and add your Adzuna credentials:

```bash
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
```

If these credentials are not set, CareerFit still works locally by returning sample job postings for the search flow.

If an Adzuna key has been shared publicly, revoke it in the Adzuna dashboard, create a new key, and update `backend/.env`.

To enable optional AI resume coaching, add an OpenAI API key and explicitly enable the feature:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
CAREERFIT_ENABLE_LLM=True
```

AI coaching is opt-in for each scan. The explainable CareerFit score, ATS checks, and deterministic recommendations still work when the OpenAI key is missing, the feature is disabled, or the provider is unavailable.

For deployment, set `DJANGO_DEBUG=False`, use a long random `DJANGO_SECRET_KEY`, and configure your real host and CORS origin. HTTPS redirect, secure cookies, and HSTS are enabled by default when debug mode is off.

Production can use PostgreSQL by setting:

```bash
DATABASE_URL=postgresql://user:password@host:5432/careerfit
FRONTEND_URL=https://your-careerfit-site.example
```

Configure SMTP environment variables from `backend/.env.example` for password reset and verification emails. API tokens expire after seven days by default. The included `Procfile` runs Gunicorn and WhiteNoise serves collected static assets.

Before deployment, run `python manage.py collectstatic --noinput`. Configure automated PostgreSQL backups with your hosting provider and verify restore steps before storing real user resumes.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173`.

The frontend connects to the Django API through Vite's local `/api` proxy. For local development, use:

```bash
VITE_API_BASE_URL=/api
```

## Current Features

- Public home page with a private, login-required workspace for profile, resume, job, report, and saved-data editing.
- PDF, DOCX, TXT, and pasted resume text input with a fully editable preview, clear action, and dismissible upload errors.
- Live Adzuna job search with a sample-data fallback when keys are not configured.
- Job saving, workplace, skill, experience-level, employment-type, salary filtering, and report history.
- Interactive ATS preparation checks for contact details, resume sections, bullet formatting, and resume length.
- Explainable skill matching, TF-IDF cosine similarity, missing-skill analysis, and recommendations.
- Optional OpenAI-powered coaching with explicit user consent and deterministic fallback.
- Expiring sessions, email verification, password reset, account deletion, and saved-data cleanup.

## Evaluation

Run the small labeled baseline evaluation:

```bash
cd backend
source .venv/bin/activate
python -m scripts.evaluate_matching
```

The script prints precision, recall, and F1-score for the included resume/job cases.

Run frontend checks:

```bash
cd frontend
npm run lint
npm run test
npm run build
npm run test:e2e
```

## MVP API

### Search Jobs

`GET /api/jobs/search/?title=Junior%20Data%20Analyst&location=New%20York&country=us`

CareerFit uses Adzuna for job search. Supported country values are `us`, `ca`, and `gb`.

```json
{
  "results": [
    {
      "id": "123",
      "title": "Junior Data Analyst",
      "company": "Example Company",
      "location": "US, New York",
      "description": "Job description text...",
      "url": "https://...",
      "source": "Adzuna"
    }
  ]
}
```

### Analyze Match

`POST /api/matches/analyze/`

```json
{
  "user_profile": {
    "name": "Student Name",
    "target_role": "Junior Data Analyst"
  },
  "resume_text": "Python, SQL, dashboards, projects...",
  "job_description": "We need Python, SQL, Tableau, communication...",
  "use_llm": false
}
```

The response includes score summaries, matched and missing skills, requirement-level evidence, a TF-IDF cosine similarity signal for each reviewed requirement, and the optional AI coaching status.

### Upload Resume

`POST /api/resumes/upload/`

Send a multipart form request with a `file` field. Supported formats are `.pdf`, `.docx`, and `.txt`.

```json
{
  "filename": "resume.pdf",
  "text": "Extracted resume text...",
  "character_count": 1234
}
```
