# CareerFit: A Comparative and Explainable Resume-Job Matching Framework for Application Readiness Assessment

## Final Project Report Draft

**Student:** Farzad Younespour  
**Student ID:** 40306504  
**Course:** Project and Report I  
**Supervisor:** Professor Joumana Dargham  
**Term:** Summer 2026  

> Draft status: This document is the working final-report structure. Sections marked `[FINALIZE]` require the completed semantic experiment, final screenshots, or final discussion.

---

## Abstract

CareerFit is a web-based prototype for explainable resume-job matching and application-readiness assessment. The system allows job seekers to upload or paste a resume, retrieve job postings from accessible providers or provide a specific description, and generate a transparent readiness report. CareerFit combines normalized skill extraction, requirement-level evidence mapping, TF-IDF cosine similarity, weighted scoring, ATS-oriented checks, and deterministic recommendations. The prototype also provides recurring role insights from retrieved postings, optional local or cloud AI coaching, and an application tracker.

The project evaluates the strengths and limitations of lexical matching methods using controlled resume-job cases and paraphrased evidence pairs. The labeled skill baseline currently produces precision, recall, and F1-score values of 1.000 across ten controlled cases. A separate paraphrase experiment shows that normalized keyword overlap and TF-IDF cosine similarity each correctly rank 2 of 5 related evidence pairs, illustrating the need to examine semantic embeddings. `[FINALIZE: add Ollama embedding result and final conclusion.]`

The main contribution of CareerFit is an explainable framework that keeps the production score deterministic while exposing the evidence behind it. The project demonstrates how practical resume guidance, job discovery, role-based insights, and measurable NLP evaluation can be integrated into a single academic prototype.

**Keywords:** resume matching, explainable NLP, TF-IDF, semantic embeddings, applicant tracking system, job search, application readiness

---

## Table of Contents

1. Introduction  
2. Problem Statement and Research Question  
3. Objectives, Scope, and Contributions  
4. Related Platforms and Technical Background  
5. Requirements Analysis  
6. System Architecture and Design  
7. Implementation  
8. Explainable Matching Framework  
9. Evaluation Methodology  
10. Results and Discussion  
11. User Interface and HCI Design  
12. Security, Privacy, and Deployment Considerations  
13. Limitations and Future Work  
14. Conclusion  
15. References  
16. Appendices  

---

## 1. Introduction

Online job postings frequently contain long lists of technologies, responsibilities, preferred qualifications, soft skills, and experience expectations. Job seekers must interpret this information quickly and decide whether their resume communicates enough relevant evidence. A generic resume may hide transferable experience, while a tailored resume can make a candidate's real qualifications easier to identify.

Applicant tracking systems add another practical concern. Even when a candidate has suitable experience, unconventional formatting or missing role-specific language may make a resume harder to parse and search. Job seekers therefore benefit from a tool that evaluates both content alignment and document readiness without presenting an opaque score.

CareerFit was designed as an explainable resume-job matching prototype. It provides a guided workflow from resume upload to job search, quick comparison, detailed report generation, improvement planning, and application tracking. It also supports a research-oriented comparison of lexical and semantic text-matching methods.

## 2. Problem Statement and Research Question

Many resume tools provide general advice or a single match percentage. This can be useful as a starting point, but a percentage alone does not explain:

- Which job requirements were recognized.
- Which resume segments provide supporting evidence.
- Which missing requirements are required versus optional.
- Whether the score changed because of a parsing issue or a genuine skill gap.
- Whether lexical matching missed semantically related evidence.

This project addresses the following research question:

> How can keyword-based, TF-IDF-based, and semantic resume-job matching techniques be evaluated and integrated into an explainable framework that maps job requirements to resume evidence, calculates transparent readiness scores, and provides practical recommendations?

## 3. Objectives, Scope, and Contributions

### 3.1 Objectives

CareerFit was developed to:

1. Accept uploaded or pasted resume content.
2. Retrieve a limited number of relevant job postings through accessible APIs.
3. Import public job URLs when structured posting data is available.
4. Extract technical and soft skills from resumes and job descriptions.
5. Identify requirement-style phrases in job descriptions.
6. Map job requirements to resume evidence.
7. Categorize requirements as matched, partial, weak, or missing.
8. Calculate explainable job-match and application-readiness scores.
9. Evaluate ATS-oriented resume structure.
10. Provide practical recommendations and optional AI coaching.
11. Summarize recurring role skills across retrieved postings.
12. Support reusable resume versions and tracked job applications.
13. Compare lexical and semantic text-matching methods using controlled cases.

### 3.2 Scope

CareerFit is an academic prototype. It does not:

- Automatically apply for jobs.
- Guarantee interviews or offers.
- Replace recruiter judgment.
- Train a new machine-learning model.
- Scrape restricted platforms without authorization.
- Present its readiness score as a probability of hiring success.

### 3.3 Contributions

The project makes five main contributions:

1. A working end-to-end web application for resume preparation and job comparison.
2. A deterministic explainable scoring framework with requirement-level evidence.
3. A lightweight role-based knowledge summary built from multiple live postings.
4. A controlled evaluation workflow for keyword overlap, TF-IDF, and optional semantic embeddings.
5. A practical analysis of real data-quality problems, including truncated job excerpts and PDF extraction artifacts.

## 4. Related Platforms and Technical Background

### 4.1 Existing Platforms

Jobscan provides resume scanning, ATS-oriented feedback, a match rate, keyword analysis, formatting flags, and section analysis [1]. Resume Worded provides a targeted-resume workflow that identifies important skills missing from a resume [2]. Huntr combines job tracking and resume tailoring and describes a match process that considers keywords and semantic signals [3].

CareerFit does not attempt to replicate every commercial feature. Its differentiating focus is explainability and academic evaluation. The deterministic score exposes its main inputs, requirement categories show evidence quality, and the evaluation scripts make method limitations measurable.

### 4.2 Job Provider APIs

Adzuna exposes RESTful job-search endpoints that require an application ID and key [4]. Jooble exposes a search API using an API key and returns job snippets in its results [5]. Arbeitnow provides a public job-board endpoint [6].

Provider behavior creates an important engineering concern: search results may contain shortened excerpts rather than complete descriptions. CareerFit detects these excerpts, attempts to enrich compatible Adzuna links with structured page data, and warns users when a complete description should be pasted manually.

### 4.3 Text Similarity

CareerFit uses lexical techniques in its deterministic production score:

- Normalized keyword and skill overlap.
- TF-IDF cosine similarity.
- Weighted requirement-level evidence.

The evaluation module also supports semantic embeddings through Ollama. Ollama's `/api/embed` endpoint returns numeric vectors for text and supports batch input [7]. Cosine similarity can then compare requirement and evidence vectors.

## 5. Requirements Analysis

### 5.1 Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| FR-01 | Register, sign in, sign out, and delete an account | Implemented |
| FR-02 | Upload PDF, DOCX, or TXT resumes | Implemented |
| FR-03 | Edit, clear, and save resume versions | Implemented |
| FR-04 | Search jobs using title, location, and filters | Implemented |
| FR-05 | Combine accessible job providers | Implemented |
| FR-06 | Import a public job URL | Implemented |
| FR-07 | Compare a selected job immediately with the active resume | Implemented |
| FR-08 | Generate a detailed readiness report | Implemented |
| FR-09 | Show ATS preparation checks | Implemented |
| FR-10 | Offer optional AI coaching with user consent | Implemented |
| FR-11 | Add a job to the application tracker | Implemented |
| FR-12 | Store application stages, notes, reminders, and drafts | Implemented |
| FR-13 | Show recurring role skills across retrieved postings | Implemented |
| FR-14 | Evaluate matching methods using reproducible scripts | Implemented |

### 5.2 Non-Functional Requirements

| ID | Requirement | Design Response |
|---|---|---|
| NFR-01 | Explainability | Deterministic score breakdown and requirement evidence |
| NFR-02 | Usability | Guided workflow, immediate feedback, editable previews, clear actions |
| NFR-03 | Privacy | Secrets excluded from Git; resume data stored in the private backend database |
| NFR-04 | Availability | Arbeitnow and sample-data fallback when credentialed providers fail |
| NFR-05 | Maintainability | Separated Django apps and reusable React screens |
| NFR-06 | Testability | Backend, frontend, browser, and evaluation-script coverage |
| NFR-07 | Deployment readiness | PostgreSQL option, Gunicorn, WhiteNoise, environment configuration |

## 6. System Architecture and Design

### 6.1 Architecture Overview

CareerFit follows a client-server architecture:

```text
React Frontend
    |
    | REST API
    v
Django REST Framework Backend
    |
    +-- Accounts and token authentication
    +-- Resume parsing and saved versions
    +-- Multi-provider job search and tracker
    +-- Explainable matching and ATS checks
    +-- Optional Ollama or OpenAI coaching
    |
    v
SQLite locally / PostgreSQL in deployment
```

External integrations:

```text
Django Backend
    +-- Adzuna API
    +-- Arbeitnow API
    +-- Optional Jooble API
    +-- Optional local Ollama API
    +-- Optional OpenAI API
```

**Figure 1 placeholder:** System architecture diagram.  
**Figure 2 placeholder:** Main user workflow.  
**Figure 3 placeholder:** Database entity-relationship diagram.

### 6.2 Backend Organization

| Django App | Responsibility |
|---|---|
| `accounts` | Registration, login, profile, verification, password reset, deletion |
| `resumes` | Upload, parsing, normalization, deletion, reusable versions |
| `jobs` | Search aggregation, URL import, role insights, alerts, tracker |
| `matching` | Skill extraction, scoring, ATS checks, evaluation, optional coaching |
| `core` | Health check and shared authentication behavior |

### 6.3 Frontend Organization

| Screen | Responsibility |
|---|---|
| `HomeScreen` | Public overview and entry points |
| `AuthScreen` | Login and registration |
| `UserProfileScreen` | Candidate profile and target role |
| `ResumeUploadScreen` | Resume workspace and ATS preparation preview |
| `JobMatchScreen` | Search, filters, role insights, quick comparison, tracker actions |
| `ReportScreen` | Detailed report, recommendations, draft template, interview preparation |
| `DashboardScreen` | Progress metrics and alerts |
| `HistoryScreen` | Application tracker and report history |

## 7. Implementation

### 7.1 Resume Parsing

Uploaded resume files are parsed on the backend. PDF files use `pypdf`, DOCX files use `python-docx`, and TXT files are decoded using common encodings. The extracted text remains editable in the frontend.

Testing with a real resume revealed a PDF extraction artifact where text was returned as letter-spaced fragments, such as:

```text
P o s t g r e S Q L
```

CareerFit repairs these fragments while preserving ordinary text. This improvement increased the quality of extracted skills and ATS checks for the affected file.

### 7.2 Multi-Provider Job Search

The search service combines results from Adzuna, Arbeitnow, and optional Jooble. Results are normalized into a common structure and deduplicated. Local samples remain available when providers cannot be reached.

CareerFit treats provider excerpts carefully:

- Truncated Adzuna descriptions are detected and enriched from structured posting pages when possible.
- Jooble results are marked as excerpts because the API returns snippets and some pages block server-side import.
- Users are prompted to paste the complete description when needed.

### 7.3 Role-Based Insights

The search API builds a lightweight role profile from the retrieved postings. It counts extracted skills and returns the most frequent skills with occurrence counts and percentages. The frontend displays these insights directly below the search controls.

This feature is intentionally lightweight. It is not a permanent labor-market database. Instead, it provides a transparent summary of the currently retrieved sample.

### 7.4 Application Tracker

Users can explicitly add selected jobs to the tracker. Tracked records support:

- Application stage.
- Notes and recruiter details.
- Follow-up and interview dates.
- Salary notes.
- Tasks and STAR stories.
- Linked resume versions.
- Cover-letter and follow-up-email drafts.
- Optional AI-generated application-packet drafts.

### 7.5 Optional AI Coaching

AI coaching is opt-in. Users can configure:

- A local Ollama model for free local inference.
- An OpenAI API key for cloud inference.

The deterministic score, ATS checks, and baseline recommendations work without AI. This separation improves transparency and prevents the core workflow from depending on external credentials.

## 8. Explainable Matching Framework

### 8.1 Preprocessing

The matcher normalizes text, removes low-information stop words, applies token aliases, extracts known skills, and recognizes common variations such as:

- `JS` and `JavaScript`
- `NodeJS` and `Node.js`
- `Postgres` and `PostgreSQL`
- `K8S` and `Kubernetes`
- `RESTful` and `REST`

The matcher also handles alternatives such as:

```text
TypeScript, Node.js, and/or Golang
```

When the resume provides one accepted alternative, the other alternatives are not incorrectly counted as mandatory gaps.

### 8.2 Requirement Evidence

The job description is split into requirement-style segments. Each requirement is scored against resume evidence using:

```text
requirement_score =
  0.50 * normalized_token_overlap
  + 0.25 * best_segment_tfidf_cosine
  + 0.25 * extracted_skill_coverage
```

The best resume segment is used so a relevant bullet point is not diluted by unrelated resume content.

### 8.3 Priority Weighting

Requirement priority is inferred from language:

- High priority: `required`, `must`, `need`, `essential`, `minimum`, `should`
- Low priority: `preferred`, `asset`, `bonus`, `nice to have`, `plus`
- Medium priority: other requirement statements

### 8.4 Final Scores

```text
match_score =
  0.65 * weighted_requirement_evidence
  + 0.35 * weighted_skill_coverage
```

```text
readiness_score =
  0.80 * match_score
  + 0.20 * ats_preparation
```

The match score represents evidence alignment with a posting. The readiness score additionally considers whether the resume is prepared for parsing and recruiter review.

## 9. Evaluation Methodology

### 9.1 Evaluation Questions

The evaluation asks:

1. Can the skill extractor identify expected overlaps in controlled cases?
2. Does the deterministic score rank strong, partial, and unrelated resumes correctly?
3. Where do keyword overlap and TF-IDF fail on paraphrased evidence?
4. Do local semantic embeddings improve ranking on paraphrased pairs?
5. Does the implemented application remain stable across backend, frontend, and browser tests?

### 9.2 Labeled Baseline

The baseline contains ten controlled resume-job cases with manually defined expected skill matches. The script calculates:

```text
precision = true_positive / (true_positive + false_positive)
recall = true_positive / (true_positive + false_negative)
f1 = 2 * precision * recall / (precision + recall)
```

### 9.3 Strong, Partial, and Unrelated Cases

Three resumes are compared against the same data-analyst posting:

- Strong: Python, SQL, Tableau, communication, dashboards, reporting.
- Partial: Python, SQL, and reporting scripts.
- Unrelated: retail and inventory experience.

### 9.4 Paraphrase Experiment

Five requirement-evidence pairs compare a related sentence and an unrelated sentence. Related evidence deliberately uses alternative wording. Methods:

1. Normalized keyword overlap.
2. TF-IDF cosine similarity.
3. Optional local Ollama embeddings with cosine similarity.

The semantic evaluator uses a local embedding model and Ollama's batch `/api/embed` endpoint [7].

### 9.5 Software Testing

The project includes:

- Django unit and API tests.
- React component tests.
- API-client tests.
- Playwright browser workflows.
- Frontend lint.
- Production frontend build.

## 10. Results and Discussion

### 10.1 Labeled Skill Baseline

| Metric | Result |
|---|---:|
| Precision | 1.000 |
| Recall | 1.000 |
| F1-score | 1.000 |
| Cases | 10 |

### 10.2 Score Ordering

| Resume Type | Match Score |
|---|---:|
| Strong | 80 |
| Partial | 47 |
| Unrelated | 0 |

The ordering behaves as intended. The score is sensitive to meaningful evidence and does not assign high values to unrelated resumes.

### 10.3 Paraphrase Experiment

| Method | Correct Rankings | Accuracy | Average Margin |
|---|---:|---:|---:|
| Normalized keyword overlap | 2/5 | 0.400 | 11.43 |
| TF-IDF cosine similarity | 2/5 | 0.400 | 6.16 |
| Ollama semantic embeddings | `[FINALIZE]` | `[FINALIZE]` | `[FINALIZE]` |

The lexical methods perform well when words overlap but fail on several paraphrased pairs. For example, a requirement using `collaborate with cross-functional teams` may be supported by a resume stating `partnered with product and support groups`, even though exact token overlap is limited.

`[FINALIZE: run embeddinggemma evaluation and discuss whether semantic vectors improve ranking accuracy.]`

### 10.4 Real Case Studies

**Case Study A placeholder:** Strong backend-role alignment.  
Use a posting aligned with Java, Go, Kafka, AWS, and event-driven systems.

**Case Study B placeholder:** Partial alignment.  
Use a posting where the resume supports several backend requirements but lacks some explicit skills.

**Case Study C placeholder:** Weak alignment.  
Use a posting with requirements outside the candidate's resume evidence.

For each case, include:

- Posting title and source.
- Match score and readiness score.
- Matched skills.
- Missing skills.
- Requirement evidence examples.
- Interpretation.

### 10.5 Software Verification Results

| Verification Area | Result |
|---|---:|
| Backend tests | 65 passed |
| Frontend unit tests | 28 passed |
| Playwright workflows | 3 passed |
| Frontend lint | Passed |
| Production build | Passed |

## 11. User Interface and HCI Design

CareerFit is designed around a visible, reversible workflow. Users can review and edit resume text, replace incorrect uploads, inspect job descriptions, see provider-excerpt warnings, and decide whether to request optional AI coaching.

The interface reflects common usability principles [8]:

| Principle | CareerFit Example |
|---|---|
| Visibility of system status | Upload progress, comparison loading state, provider notices |
| Match with real-world language | Labels such as `Add to tracker`, `Missing skills`, and `Readiness report` |
| User control and freedom | Editable resume text, clear actions, dismissible errors |
| Consistency | Shared buttons, colors, spacing, and navigation patterns |
| Error prevention | Login-required editing, file validation, protected API endpoints |
| Recognition rather than recall | Visible filters, role insights, saved versions, score breakdown |
| Flexibility and efficiency | Search autofill, URL import, samples, tracker shortcuts |
| Minimalist design | Compact job cards and structured report sections |
| Error recovery | Actionable messages for missing resumes and provider excerpts |
| Help and documentation | Contextual explanations inside complex report areas |

**Figure 4 placeholder:** Home page.  
**Figure 5 placeholder:** Resume upload and editable preview.  
**Figure 6 placeholder:** Job search and role insights.  
**Figure 7 placeholder:** Quick resume comparison.  
**Figure 8 placeholder:** Detailed readiness report.  
**Figure 9 placeholder:** Application tracker.

## 12. Security, Privacy, and Deployment Considerations

CareerFit stores registered users, resume text, tracked jobs, and reports in the backend database. Local development uses SQLite, while deployment can use PostgreSQL. Sensitive `.env` configuration is excluded from Git.

Security-related measures include:

- Password hashing through Django authentication.
- Token-based API authentication with expiration.
- Login-required workspace editing.
- Rate limits for API usage and AI coaching.
- Account deletion and saved-data cleanup.
- Secure production-cookie and HTTPS settings.
- CORS configuration.
- Guarded URL import that rejects private-network addresses.

Resume content is sensitive personal information. A real deployment should include a privacy notice, retention policy, PostgreSQL backups, access monitoring, and a hosting-provider review.

## 13. Limitations and Future Work

### 13.1 Current Limitations

- The skill vocabulary is curated and cannot cover every domain term.
- Job-provider availability and result completeness vary.
- Role insights summarize only the retrieved result set.
- ATS preparation checks approximate common best practices rather than simulating every commercial ATS.
- The controlled evaluation dataset is intentionally small.
- Semantic embeddings remain evaluation-only until reviewed and calibrated.
- Optional AI coaching may produce imperfect recommendations.

### 13.2 Future Work

1. Expand the manually reviewed resume-job dataset.
2. Add category-level evaluation for matched, partial, weak, and missing requirements.
3. Calibrate thresholds using more domains and candidate levels.
4. Evaluate semantic embeddings on a larger labeled set.
5. Add confidence indicators when provider descriptions are incomplete.
6. Add more job providers where terms permit integration.
7. Add structured education, certification, and experience-year extraction.
8. Conduct user testing with job seekers.

## 14. Conclusion

CareerFit demonstrates that a resume-job matching tool can be both practical and explainable. The prototype combines editable resume ingestion, multi-provider job discovery, role insights, deterministic requirement-level scoring, ATS checks, recommendations, optional AI coaching, and application tracking. Its controlled evaluation scripts make the behavior of lexical methods measurable and create a clear path for evaluating semantic embeddings.

The project does not treat a score as a hiring prediction. Instead, it uses transparent evidence to help users make better-informed application decisions and improve how their real experience is communicated.

`[FINALIZE: add final semantic-evaluation conclusion and any user-study findings.]`

## 15. References

[1] Jobscan, "Free Resume Scanner and ATS Resume Checker," https://www.jobscan.co/resume-checker  
[2] Resume Worded, "Targeted Resume," https://www.resumeworded.com/targeted-resume  
[3] Huntr, "Resume Tailor," https://huntr.co/product/resume-tailor  
[4] Adzuna, "API Overview," https://developer.adzuna.com/overview  
[5] Jooble Help Center, "REST API Documentation," https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation  
[6] Arbeitnow, "Job Board API," https://www.arbeitnow.com/api/job-board-api  
[7] Ollama, "Generate Embeddings," https://docs.ollama.com/api/embed  
[8] Nielsen Norman Group, "10 Usability Heuristics for User Interface Design," https://www.nngroup.com/articles/ten-usability-heuristics/  
[9] Django Software Foundation, "Django Documentation," https://docs.djangoproject.com/  
[10] Django REST Framework, "Authentication," https://www.django-rest-framework.org/api-guide/authentication/  

## 16. Appendices

### Appendix A: Main Setup Commands

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

### Appendix B: Evaluation Commands

```bash
cd backend
source .venv/bin/activate
python -m scripts.evaluate_matching
python -m scripts.evaluate_matching_methods
```

### Appendix C: Semantic Evaluation Setup

```bash
ollama pull embeddinggemma
```

```env
OLLAMA_EMBEDDING_MODEL=embeddinggemma
```

### Appendix D: Figure Checklist

- [ ] System architecture diagram
- [ ] User workflow diagram
- [ ] Database entity-relationship diagram
- [ ] Home page screenshot
- [ ] Resume workspace screenshot
- [ ] Job search and role-insights screenshot
- [ ] Quick comparison screenshot
- [ ] Detailed report screenshot
- [ ] Tracker screenshot

