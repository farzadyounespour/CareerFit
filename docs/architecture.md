# CareerFit Architecture

## MVP Flow

1. User enters profile information.
2. User pastes resume content or uploads a PDF, DOCX, or TXT resume.
3. User searches Adzuna for a job posting or pastes a job description.
4. Frontend sends the combined request to the Django API.
5. Backend extracts text from uploaded resumes when needed.
6. Backend extracts requirement-style phrases and skills from the job description.
7. Backend compares each requirement with resume evidence and TF-IDF cosine similarity.
8. Backend checks ATS-oriented resume structure and contact information.
9. With explicit user consent, the backend may request structured OpenAI coaching suggestions.
10. Frontend displays an explainable report and saves it for signed-in users.

## Main Frontend Screens

- `UserProfileScreen`: basic user and target-role information.
- `ResumeUploadScreen`: pasted resume text and file upload controls.
- `JobMatchScreen`: Adzuna job search, job selection, pasted job description, and sample job loading.
- `ReportScreen`: score, requirement categories, missing skills, and recommendations.
- `HistoryScreen`: saved job postings and prior readiness reports.

## Main Backend Areas

- `accounts`: token-based registration, login, logout, and user profile API.
- `resumes`: resume text, PDF/DOCX/TXT parsing, and upload API.
- `jobs`: job description domain and Adzuna search API integration.
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
