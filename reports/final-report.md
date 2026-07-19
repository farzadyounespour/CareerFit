# CareerFit: A Comparative and Explainable Resume-Job Matching Framework for Application Readiness Assessment

## Final Project Report Draft

**Student:** Farzad Younespour  
**Student ID:** 40306504  
**Course:** Project and Report I  
**Supervisor:** Professor Joumana Dargham  
**Term:** Summer 2026  

> Draft status: This document is the working final-report structure. Final screenshots and case-study examples should be refreshed before submission.

---

## Abstract

CareerFit is a web-based prototype for explainable resume-job matching and application-readiness assessment. The system allows job seekers to upload or paste a resume, retrieve job postings from accessible providers or provide a specific description, and generate a transparent readiness report. CareerFit combines normalized skill extraction, requirement-level evidence mapping, TF-IDF cosine similarity, weighted scoring, ATS-oriented checks, and deterministic recommendations. The prototype also provides recurring role insights from retrieved postings, optional local or cloud AI coaching, and an application tracker.

The project evaluates the strengths and limitations of lexical and semantic matching methods using controlled resume-job cases and paraphrased evidence pairs. The labeled skill baseline produces precision, recall, and F1-score values of 1.000 across ten controlled cases. A separate paraphrase experiment shows that normalized keyword overlap and TF-IDF cosine similarity each correctly rank only 2 of 5 related evidence pairs, while CareerFit's hybrid BM25, TF-IDF, skill, and semantic-concept method ranks 5 of 5 pairs correctly with an average margin of 45.80 points.

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
10. Provide practical recommendations and AI-assisted priority coaching.
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
4. A controlled evaluation workflow for keyword overlap, TF-IDF, hybrid semantic evidence, and optional local embeddings.
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
| FR-10 | Automatically add configured AI coaching and report highlights to full reports | Implemented |
| FR-11 | Add a job to the application tracker | Implemented |
| FR-12 | Store application stages, notes, reminders, and drafts | Implemented |
| FR-13 | Show recurring role skills across retrieved postings | Implemented |
| FR-14 | Evaluate matching methods using reproducible scripts | Implemented |
| FR-15 | Suggest related job titles and show posting freshness where provider dates are available | Implemented |
| FR-16 | Exclude unsuitable keywords and compare up to three postings side by side | Implemented |

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

### 5.3 Requirement Traceability

The implementation was organized around a traceable workflow rather than isolated features:

| User Need | Implemented Response | Verification Evidence |
|---|---|---|
| Correct an uploaded resume | Editable text preview, clear action, replacement upload, reusable versions | Resume component tests and upload API tests |
| Avoid repeating profile information | Candidate profile and job-search autofill | Account API tests and browser workflow |
| Decide whether a posting is worth deeper review | Immediate quick comparison after job selection | Matching preview API tests and job-screen tests |
| Understand a score | Requirement categories, evidence mapping, ATS breakdown, and recommendations | Matching tests and report-screen tests |
| Recover from incomplete provider text | Excerpt detection, Adzuna enrichment, warning, and manual paste path | Provider tests and manual case review |
| Keep applications organized | Explicit add-to-tracker action, stages, tasks, dates, notes, and linked resume versions | Tracker API and UI tests |
| Keep AI controllable | Default-enabled local or cloud coaching can be turned off and remains separated from scoring | Coaching service tests |

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
| `ReportScreen` | Detailed report, AI highlights, recommendations, and interview preparation |
| `DashboardScreen` | Progress metrics and alerts |
| `HistoryScreen` | Application tracker and report history |

### 6.4 Data Model

| Entity | Relationship | Purpose |
|---|---|---|
| `User` | Owns private workspace data | Django authentication identity |
| `UserProfile` | One profile per user | Contact information, target role, experience level, workplace preference, and summary |
| `Resume` | Multiple versions per user | Editable extracted text and tailored copies |
| `JobDescription` | Multiple records per user | Imported roles, tracked applications, statuses, notes, dates, and drafts |
| `MatchReport` | Links user, resume, and job | Preserved resume and job snapshots with JSON result |
| `SearchAlert` | Multiple alerts per user | Reusable job-search criteria and frequency |

Report snapshots matter because a user may modify a resume after generating a report. Storing the original analyzed text makes historical results interpretable.

### 6.5 Main API Workflow

```text
Resume upload
  -> POST /api/resumes/upload/
  -> parse and normalize file
  -> return editable text

Job selection
  -> POST /api/matches/preview/
  -> lightweight deterministic comparison
  -> return quick scores and skill summary

Detailed report
  -> POST /api/matches/analyze/
  -> requirement mapping + ATS checks + recommendations
  -> preserve report history

Optional coaching
  -> POST /api/matches/coach/
  -> require explicit user action
  -> call configured Ollama or OpenAI provider
```

### 6.6 Interface Information Architecture

The horizontal navigation follows the user's task sequence:

```text
Home -> Profile -> Resume -> Jobs -> Report -> Tracker
```

Users are not forced to follow a rigid wizard. The navigation keeps previous work accessible while the screen-level actions suggest the most useful next step.

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

The discovery workflow also provides related-role suggestions. Suggestions combine a small transparent role map with distinct titles found in the current result set. Posting timestamps from providers are normalized when available and shown as freshness badges. Users can enter comma-separated excluded keywords and compare up to three result cards side by side before deciding which role deserves a full readiness report.

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

### 7.5 AI and Semantic Assistance

CareerFit uses AI-related functionality in two separated ways. First, the matching service can use a local embedding model as an additional semantic evidence signal when `CAREERFIT_ENABLE_EMBEDDINGS` and `OLLAMA_EMBEDDING_MODEL` are configured. This signal can affect requirement evidence scoring, but it is still combined with transparent BM25, TF-IDF, skill coverage, and concept evidence instead of replacing them.

Second, AI coaching is requested automatically for full-report priority fixes and report highlights when a provider is configured. Resume drafts remain explicitly requested generated-text features. Users can configure:

- A local Ollama model for free local inference.
- An OpenAI API key for cloud inference.

This separation keeps the score auditable while still allowing AI to strengthen semantic evidence and practical coaching.

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
4. Does CareerFit's hybrid BM25/TF-IDF/semantic-concept method improve paraphrased evidence ranking?
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
3. CareerFit's production hybrid BM25/TF-IDF/semantic-concept method.
4. Optional local Ollama embeddings with cosine similarity.

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
| Strong | 83 |
| Partial | 58 |
| Unrelated | 3 |

The ordering behaves as intended. The score is sensitive to meaningful evidence and does not assign high values to unrelated resumes.

### 10.3 Paraphrase Experiment

| Method | Correct Rankings | Accuracy | Average Margin |
|---|---:|---:|---:|
| Normalized keyword overlap | 2/5 | 0.400 | 11.43 |
| TF-IDF cosine similarity | 2/5 | 0.400 | 6.16 |
| Hybrid BM25 + TF-IDF + semantic concepts | 5/5 | 1.000 | 45.80 |
| Ollama semantic embeddings | skipped locally | not calculated | not calculated |

The lexical methods perform well when words overlap but fail on several paraphrased pairs. For example, a requirement using `collaborate with cross-functional teams` may be supported by a resume stating `partnered with product and support groups`, even though exact token overlap is limited.

The strongest evaluation finding is that a transparent hybrid method outperforms both raw keyword overlap and TF-IDF on paraphrased evidence without making the final score a black-box LLM judgment. Local embeddings remain implemented as an additional AI semantic signal, but the current machine did not have a dedicated embedding model installed during this run.

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

CareerFit is designed around a visible, reversible workflow. Users can review and edit resume text, replace incorrect uploads, inspect job descriptions, see provider-excerpt warnings, and retry AI guidance when a configured provider is unavailable.

### 11.1 Design Goals

| Goal | Interface Response |
|---|---|
| Make the next step obvious | Prominent page-level actions such as `Continue to jobs`, `Use this job`, and `Generate full report` |
| Reduce repeated work | Profile autofill, reusable resume versions, saved search alerts, and tracker records |
| Keep analysis understandable | Separate match, readiness, ATS preparation, evidence, and recommendation areas |
| Support recovery | Editable text, clear resume action, replace upload, clear filters, and manual posting input |
| Protect user choice | Explicit tracker save, truthful AI guidance, and deterministic fallback |

### 11.2 Screen-by-Screen Design

| Screen | Main Content | Primary Action | Important States |
|---|---|---|---|
| Home | Hero, workflow summary, report preview, connected features | Check resume fit | Public visitor and signed-in navigation |
| Profile | Candidate preferences and contact information | Save profile | Validation and saved confirmation |
| Resume | Upload, text editor, versions, ATS preview | Continue to jobs | Empty, uploading, parsed, invalid file, cleared |
| Jobs | Import URL, search, filters, exclusions, related roles, freshness, comparison table, results, selected-job panel | Use this job | Loading, provider notice, excerpt warning, no resume, quick comparison |
| Report | Scores, AI highlights, evidence, ATS checks, improvements, and interview preparation | Rescan after edits | Deterministic report, AI loading, AI result, and fallback |
| Tracker | Application stages, details, tasks, drafts, dates, resume version | Save changes | Empty tracker, selected role, overdue follow-up |

### 11.3 Progressive Disclosure

The detailed report is intentionally layered:

1. Executive summary and two scores.
2. Highest-priority improvements.
3. Requirement categories and resume evidence.
4. ATS preparation checks.
5. Resume-specific examples.
6. Interview preparation.
7. Automatic AI coaching when configured.

This order helps users act on the report without reading every technical detail first.

### 11.4 Responsive Behavior

The application primarily targets the web desktop experience while preserving mobile usability:

- Horizontal navigation becomes compact on smaller screens.
- Two-column resume and jobs layouts stack vertically.
- The selected-job comparison moves below results on narrow screens.
- Tables and dense tracker areas use scrolling or stacked summaries.
- Important actions remain visible after layout changes.

### 11.5 Accessibility Considerations

- Inputs retain visible labels rather than relying on placeholders alone.
- Status messages use text and icons in addition to color.
- Buttons use familiar icons and descriptive accessible titles where needed.
- Contrast separates primary text, secondary text, warnings, errors, and positive states.
- Keyboard users can reach inputs, buttons, expandable sections, and links.

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

The editable Word appendix contains the original annotated screen mockups. `[FINALIZE: add final application screenshots beside the corresponding mockups and discuss design changes made during implementation.]`

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
- Local embedding evidence requires a dedicated Ollama embedding model and should be calibrated on more reviewed cases before being enabled by default.
- Optional AI coaching may produce imperfect recommendations.

### 13.2 Future Work

1. Expand the manually reviewed resume-job dataset.
2. Add category-level evaluation for matched, partial, weak, and missing requirements.
3. Calibrate thresholds using more domains and candidate levels.
4. Evaluate local embeddings on a larger labeled set and compare them against the current hybrid semantic-concept method.
5. Add confidence indicators when provider descriptions are incomplete.
6. Add more job providers where terms permit integration.
7. Add structured education, certification, and experience-year extraction.
8. Conduct user testing with job seekers.

## 14. Conclusion

CareerFit demonstrates that a resume-job matching tool can be both practical and explainable. The prototype combines editable resume ingestion, multi-provider job discovery, role insights, requirement-level scoring, ATS checks, recommendations, AI-assisted priority coaching, and application tracking. Its strongest technical finding is that the hybrid BM25/TF-IDF/semantic-concept matcher correctly ranks all five paraphrased evidence pairs in the controlled method comparison, while keyword overlap and TF-IDF each rank only two correctly.

The project does not treat a score as a hiring prediction. Instead, it uses transparent evidence to help users make better-informed application decisions and improve how their real experience is communicated.

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
CAREERFIT_ENABLE_EMBEDDINGS=True
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

### Appendix E: Planned Mockup-to-Screenshot Comparison

| Screen | Midterm Mockup Available | Final Screenshot Required | Discussion Needed |
|---|---|---|---|
| Home | Yes | Yes | Explain hero, workflow, and report-preview refinements |
| Profile | Yes | Yes | Explain autofill fields and validation |
| Resume workspace | Yes | Yes | Explain error recovery, editable preview, ATS checks, and saved versions |
| Jobs | Yes | Yes | Explain filters, role insights, quick comparison, and excerpt warnings |
| Report | Yes | Yes | Explain information hierarchy and actionable guidance |
| Tracker | Yes | Yes | Explain status stages, tasks, drafts, and follow-up management |
