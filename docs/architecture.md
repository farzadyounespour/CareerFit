# CareerFit Architecture

## MVP Flow

1. User enters profile information.
2. User pastes or uploads resume content.
3. User pastes a job description.
4. Frontend sends the combined request to the Django API.
5. Backend extracts requirement-style phrases and skills from the job description.
6. Backend compares each requirement with resume evidence.
7. Frontend displays an explainable report.

## Main Frontend Screens

- `UserProfileScreen`: basic user and target-role information.
- `ResumeUploadScreen`: pasted resume text and future upload controls.
- `JobMatchScreen`: pasted job description and sample job loading.
- `ReportScreen`: score, requirement categories, missing skills, and recommendations.

## Main Backend Areas

- `accounts`: user profile data model placeholder.
- `resumes`: resume text and upload domain placeholder.
- `jobs`: job description and future API search placeholder.
- `matching`: explainable matching service and API endpoint.

## Planned Upgrades

- Add PDF/DOCX parsing.
- Store user sessions, resumes, jobs, and reports in PostgreSQL.
- Add TF-IDF similarity.
- Add sentence-transformer embeddings.
- Add Adzuna and The Muse job search integrations.
- Add evaluation scripts for precision, recall, F1-score, and case-study validation.

