# CareerFit Architecture

## MVP Flow

1. User enters profile information.
2. User pastes resume content or uploads a PDF, DOCX, or TXT resume.
3. User searches normalized Adzuna, Arbeitnow, and optional Jooble results or pastes a job description.
4. Frontend sends the combined request to the Django API.
5. Backend extracts text from uploaded resumes when needed.
6. Backend extracts requirement-style phrases and skills from the job description.
7. Backend compares each requirement with resume evidence and TF-IDF cosine similarity.
8. Backend checks ATS-oriented resume structure and contact information.
9. With explicit user consent, the backend may request structured coaching suggestions from local Ollama or OpenAI.
10. Frontend displays an explainable report, ATS preparation checks, and interview prompts.
11. Signed-in users save resume versions, search alerts, and application-tracker details.

## Main Frontend Screens

- `UserProfileScreen`: basic user and target-role information.
- `DashboardScreen`: pipeline metrics, upcoming follow-ups, interviews, and saved search alerts.
- `ResumeUploadScreen`: pasted resume text and file upload controls.
- `JobMatchScreen`: Adzuna job search, job selection, pasted job description, and sample job loading.
- `ReportScreen`: score, requirement categories, missing skills, and recommendations.
- `HistoryScreen`: application tracker board and prior readiness reports.

## Main Backend Areas

- `accounts`: token-based registration, login, logout, and user profile API.
- `resumes`: resume text, PDF/DOCX/TXT parsing, upload API, and reusable resume versions.
- `jobs`: job description domain, multi-provider search aggregation, search alerts, and application-tracker details.
- `matching`: explainable matching service, optional structured LLM coaching, and API endpoint.

## Deployment

- SQLite remains the local default; `DATABASE_URL` enables PostgreSQL in production.
- Gunicorn is the production web process and WhiteNoise serves collected static files.
- Account emails use Django's console backend locally and configurable SMTP in production.
- CI runs migrations checks, backend tests, matching evaluation, lint, frontend unit tests, and the production build.

## Planned Upgrades

- Add sentence-transformer embeddings.
- Add optional The Muse job search integration.
- Add human-reviewed case-study validation and score calibration.
