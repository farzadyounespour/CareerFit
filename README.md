# CareerFit

CareerFit is an explainable resume-job matching prototype. The first MVP lets a user enter profile details, provide resume text, paste a job description, and receive an application-readiness report with matched, partial, weak, and missing requirements.

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

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173`.

## MVP API

`POST /api/matches/analyze/`

```json
{
  "user_profile": {
    "name": "Student Name",
    "target_role": "Junior Data Analyst"
  },
  "resume_text": "Python, SQL, dashboards, projects...",
  "job_description": "We need Python, SQL, Tableau, communication..."
}
```

