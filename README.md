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

CareerFit searches Arbeitnow automatically without a key. To add Adzuna results, create `backend/.env` and add your Adzuna credentials:

```bash
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
```

You can also add an optional Jooble API key after registering at `https://jooble.org/api/about`:

```bash
JOOBLE_API_KEY=your_jooble_api_key
```

If live providers are unavailable, CareerFit still works locally by returning sample job postings for the search flow.

If an Adzuna key has been shared publicly, revoke it in the Adzuna dashboard, create a new key, and update `backend/.env`.

To enable free optional AI resume coaching locally, install [Ollama](https://ollama.com/download), download a model, and enable the feature:

```bash
ollama pull gemma3:4b
```

Add these values to `backend/.env`:

```bash
CAREERFIT_ENABLE_LLM=True
CAREERFIT_LLM_PROVIDER=ollama
OLLAMA_MODEL=gemma3:4b
```

Ollama runs on the same computer as CareerFit, so this option does not require a paid API key. You can still use OpenAI instead:

```bash
CAREERFIT_LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

AI coaching is opt-in for each scan. The explainable CareerFit score, ATS checks, and deterministic recommendations still work when AI is disabled or the configured provider is unavailable.

To run the optional local semantic-similarity evaluation described below, pull a dedicated embedding model:

```bash
ollama pull embeddinggemma
```

Then add this value to `backend/.env`:

```bash
OLLAMA_EMBEDDING_MODEL=embeddinggemma
```

This model is used only by the research evaluation script. The website's normal score remains deterministic and works without it.

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
- Resume-aware job-search autofill for inferred role, location, and supported country defaults.
- Multi-provider job search with Adzuna, no-key Arbeitnow, optional Jooble, deduplication, and sample-data fallback.
- Lightweight role insights that summarize recurring skills across the retrieved postings and disclose provider excerpts.
- Instant deterministic resume comparison when a user selects a job, with match score, readiness score, and skill gaps before generating a full report.
- Job saving, workplace, skill, excluded-keyword, experience-level, employment-type, salary filtering, and report history.
- Visible active job filters, richer posting summaries, and optional-gap labels during quick comparison.
- Related-role suggestions, posting-freshness badges, and a side-by-side comparison table for up to three search results.
- Application tracker with stages, notes, recruiter details, follow-up dates, interview dates, salary notes, and tailored resume links.
- Tracker attention mode with search, overdue follow-up signals, pipeline counts, and next-action sorting.
- Application packets with linked resume versions, editable cover-letter and follow-up drafts, reminders, personal pitch notes, and reusable STAR stories.
- Optional AI-assisted application-packet drafts through the configured Ollama or OpenAI coach, with offline starter-template fallback.
- Public job-URL import with guarded fetching, saved-role comparison, tracker CSV import/export, and downloadable workspace JSON.
- Interactive report suggestions with accept, edit, and dismiss actions plus readiness-score history across rescans.
- Reusable resume versions and saved daily or weekly job-search alerts.
- Interactive ATS preparation checks for contact details, resume sections, bullet formatting, dates, measurable achievements, paragraph length, and resume length.
- Explainable weighted requirement matching, best-segment TF-IDF evidence, skill coverage, missing-skill analysis, and recommendations.
- Role-specific interview questions, STAR answer prompts, and a progress dashboard.
- Persistent light and dark appearance modes across the public site and private workspace.
- Optional local Ollama or OpenAI-powered coaching with explicit user consent and deterministic fallback.
- Expiring sessions, email verification, password reset, account deletion, and saved-data cleanup.

## Evaluation

Run the small labeled baseline evaluation:

```bash
cd backend
source .venv/bin/activate
python -m scripts.evaluate_matching
```

The script prints precision, recall, and F1-score for the included resume/job cases, then checks that strong, partial, and unrelated resumes rank in the expected order.

Run the controlled matching-method comparison:

```bash
cd backend
source .venv/bin/activate
python -m scripts.evaluate_matching_methods
```

This script compares normalized keyword overlap, TF-IDF cosine similarity, and optional local Ollama semantic embeddings on paraphrased requirement-evidence pairs. If `OLLAMA_EMBEDDING_MODEL` is not configured, the semantic method is reported as skipped while the deterministic baselines still run.

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

CareerFit combines available Adzuna, Arbeitnow, and optional Jooble results. Supported Adzuna country values are `us`, `ca`, and `gb`.

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

The response includes score summaries, an explainable score breakdown, matched and missing skills, weighted requirement-level evidence, a best-segment TF-IDF cosine similarity signal for each reviewed requirement, and the optional AI coaching status.

### Preview Match

`POST /api/matches/preview/`

Returns the deterministic score summary and skill gaps for the current resume and selected job without saving a report or requesting AI coaching.

### Request Specific Improvements

`POST /api/matches/coach/`

Returns optional AI coaching for the current resume and selected job without saving a duplicate report. The endpoint uses the configured Ollama or OpenAI provider and applies the dedicated coaching rate limit.

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
