# CareerFit Final Report Technical Summary

This summary is based on the CareerFit codebase inspection. It is intended to complement the midterm report by focusing on final implementation, findings, values, algorithm details, testing, limitations, and final-report structure.

## 1. Final Implementation Status

### Frontend Pages

| Feature | Status | Relevant files | Explanation / limitation |
|---|---:|---|---|
| Home page | done | `frontend/src/screens/HomeScreen.jsx`, `frontend/src/App.jsx` | Public first screen exists. Protected pages redirect guests to authentication. |
| Profile page | done, backend-connected | `frontend/src/screens/UserProfileScreen.jsx`, `backend/apps/accounts/views.py`, `backend/apps/accounts/models.py` | User can edit profile fields. |
| Resume workspace | done, backend-connected | `frontend/src/screens/ResumeUploadScreen.jsx`, `backend/apps/resumes/views.py`, `backend/apps/resumes/parsers.py` | Upload, paste, edit, save/list/delete resume versions. |
| Job discovery/search | done, backend-connected | `frontend/src/screens/JobMatchScreen.jsx`, `backend/apps/jobs/views.py`, `backend/apps/jobs/services.py`, `frontend/src/services/api.js` | Searches live/sample providers with filters. |
| Job selection/comparison panel | done, backend-connected | `frontend/src/screens/JobMatchScreen.jsx`, `frontend/src/App.jsx`, `backend/apps/matching/views.py` | Selecting a job fills description and calls `/matches/preview/`. |
| Readiness report | done, backend-connected | `frontend/src/screens/ReportScreen.jsx`, `backend/apps/matching/views.py`, `backend/apps/matching/services.py` | Detailed report with score breakdown, requirement evidence, ATS checks, and recommendations. |
| Semantic similarity example/result display | partial/done | `frontend/src/screens/ReportScreen.jsx`, `backend/apps/matching/views.py`, `backend/apps/matching/services.py` | Semantic matches appear in preview/report when detected. No separate standalone semantic-demo page was found. |
| Recommendations section | done | `frontend/src/screens/ReportScreen.jsx`, `backend/apps/matching/services.py`, `backend/apps/matching/llm_services.py` | Rule-based recommendations plus optional AI coaching. |
| Application tracker | done, backend-connected | `frontend/src/screens/HistoryScreen.jsx`, `frontend/src/screens/DashboardScreen.jsx`, `backend/apps/jobs/views.py`, `backend/apps/jobs/models.py` | Saved jobs, statuses, notes, dates, tasks, drafts, CSV import/export. |

### Backend Features

| Backend feature | Status | Relevant files | Explanation / limitation |
|---|---:|---|---|
| User registration/login/profile | done | `backend/apps/accounts/views.py`, `backend/apps/accounts/serializers.py`, `backend/apps/accounts/tests.py` | Token authentication, profile, password reset, email verification, account deletion. |
| Resume upload | done | `backend/apps/resumes/views.py`, `backend/apps/resumes/parsers.py` | PDF, DOCX, TXT. |
| Resume parsing | done | `backend/apps/resumes/parsers.py` | Uses `pypdf`, `python-docx`, text decoding. Parsing quality depends on file structure. |
| Editable resume text | done | `frontend/src/screens/ResumeUploadScreen.jsx`, `frontend/src/App.jsx` | Frontend editable text; saved through resume versions/analyze. |
| Saved resume versions | done | `backend/apps/resumes/views.py`, `backend/apps/resumes/models.py` | Create, list, delete, patch. |
| Manual job description input | done | `frontend/src/screens/JobMatchScreen.jsx`, `frontend/src/App.jsx` | User can paste/edit job description. |
| Job URL import | partial/done | `backend/apps/jobs/services.py`, `backend/apps/jobs/views.py` | Imports public HTML pages with schema.org `JobPosting` or meta/title fallback. Not guaranteed for JavaScript-heavy/private sites. |
| Job search from API/source | done | `backend/apps/jobs/services.py` | Adzuna, Remotive, Arbeitnow, Jooble, sample fallback. |
| Selected job comparison | done | `frontend/src/App.jsx`, `backend/apps/matching/views.py` | Calls preview analysis when job is selected. |
| Requirement extraction | done | `backend/apps/matching/services.py` | Regex/sentence splitting and filtering. Not ML-trained. |
| Resume evidence extraction | done | `backend/apps/matching/services.py` | Splits resume into heading-aware evidence segments. |
| Keyword matching | done | `backend/apps/matching/services.py` | Skill dictionary, aliases, token overlap. |
| TF-IDF matching | done | `backend/apps/matching/services.py`, `backend/apps/matching/evaluation.py` | Custom TF-IDF cosine, not scikit-learn. |
| Semantic similarity / embeddings | partial/done | `backend/apps/matching/services.py`, `backend/apps/matching/evaluation.py` | Rule-based semantic concepts always available; Ollama embeddings optional through settings. |
| Score calculation | done | `backend/apps/matching/services.py` | Requirement score, skill score, match score, readiness score. |
| Readiness score | done | `backend/apps/matching/services.py` | `readiness = 80% match_score + 20% ATS`. |
| ATS score/checks | done | `backend/apps/matching/services.py`, `frontend/src/screens/ResumeUploadScreen.jsx` | Approximate regex checks. |
| Report generation | done | `backend/apps/matching/views.py`, `backend/apps/matching/models.py` | Full analysis saved to `MatchReport`. |
| Application tracker saving/updating | done | `backend/apps/jobs/views.py`, `backend/apps/jobs/models.py` | Save/update jobs and application packet fields. |
| Optional AI coaching | done/optional | `backend/apps/matching/llm_services.py`, `backend/apps/jobs/views.py` | Supports OpenAI or Ollama if configured. Deterministic report works without it. |

## 2. Job Search And Direct Resume-Job Fitting

### Implemented Job Sources

- Adzuna: `ADZUNA_API_BASE_URL`, requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.
- Remotive: no key, controlled by `CAREERFIT_ENABLE_REMOTIVE`.
- Arbeitnow: no key.
- Jooble: optional `JOOBLE_API_KEY`.
- Sample local jobs: built into `backend/apps/jobs/services.py`.

### Search Capabilities

- Job title: implemented and required by `JobSearchSerializer`.
- Location: implemented.
- Country: implemented with `us`, `ca`, and `gb`.
- Source filter: implemented with `all`, `adzuna`, `remotive`, `arbeitnow`, `jooble`, `sample`.
- Workplace: implemented with `any`, `remote`, `hybrid`, `on_site`.
- Skills include filter: implemented.
- Excluded keywords: implemented.
- Experience: implemented with `any`, `internship`, `entry`, `mid`, `senior`.
- Employment: implemented with `any`, `full_time`, `part_time`, `contract`, `permanent`.
- Salary min/max: implemented.
- Date filter: not implemented as a user filter. Posted dates are stored/displayed when provider data supplies them.

### Results And Direct Fitting

- Default `results_per_page` is 8; serializer allows 1 to 20.
- Used fields include title, company, location, description, URL, source, workplace, experience level, employment type, salary, posted date, and partial-description flag.
- User can select one job for analysis.
- User can compare up to three postings side-by-side in frontend state, but the actual resume comparison is for the selected job.
- Selected job is directly compared with the current resume through `/api/matches/preview/`.
- Selected/saved job can be saved to tracker through `/api/jobs/saved/`.
- If live providers fail and source is `all`, code falls back to sample jobs.
- If a specific provider fails, it returns no live results plus provider error.

### Final-Report Paragraph

CareerFit implements job discovery and direct resume-job comparison as one connected workflow. Instead of requiring the user to leave the application, manually copy a posting, and then separately scan a resume, CareerFit lets the user search job postings by title, location, country, source, workplace type, skills, experience level, employment type, and salary. The user can select a posting, automatically load its job description, receive an immediate resume-match preview, and then generate a full explainable readiness report. This is the main project value: job discovery, job selection, resume-job fitting, report generation, and application tracking are connected inside one workflow.

## 3. Algorithm And Matching Implementation

### A. Text Preprocessing

- Lowercase: implemented in `normalize_text`.
- URL/source metadata removal: implemented in `strip_urls` and `strip_source_metadata`.
- Punctuation handling: partial; regex tokenization and `strip(".,;:-")`.
- Stop word removal: implemented with `STOP_WORDS`.
- Tokenization: implemented with regex in `tokenize`.
- Sentence/requirement splitting: implemented in `split_requirements`; splits on newlines, semicolons, and sentence boundaries.
- Stemming/lemmatization: partial only; simple plural normalization and token aliases. No full stemming/lemmatization library was found.
- Resume section/evidence extraction: implemented in `_resume_evidence_segments`; frontend also parses resume sections for ATS draft UI.
- Skill extraction: implemented in `extract_skills`.
- Requirement extraction: implemented in `split_requirements` and `is_requirement_candidate`.

### B. Keyword Matching

- Implemented in `backend/apps/matching/services.py`.
- Uses `SKILL_KEYWORDS`, `SKILL_ALIASES`, `SEMANTIC_SKILL_ALIASES`, and token overlap.
- Handles aliases such as `js -> javascript`, `rest api/restful -> rest`, `postgres -> postgresql`, `k8s -> kubernetes`, `ml -> machine learning`, `collaboration -> teamwork`, and `powerbi -> power bi`.
- Logic: extract skills from resume and requirements, compare sets, compute skill coverage, and include token overlap in requirement score.

### C. TF-IDF Similarity

- Implemented in `calculate_text_similarity`.
- No scikit-learn. It is a custom two-document TF-IDF cosine similarity.
- Compares a requirement with a resume segment/evidence text.
- Cosine similarity is used.
- No fixed pass threshold for TF-IDF alone; it contributes to segment ranking and hybrid score.

### D. Semantic Similarity

- Implemented in two forms.
- Rule-based semantic concept matching: `SEMANTIC_CONCEPT_GROUPS`, `semantic_concept_score`.
- Optional embedding similarity: Ollama `/api/embed`, model from `OLLAMA_EMBEDDING_MODEL`.
- Compares job requirement to resume evidence segments.
- Cosine similarity is used for embeddings.
- Embedding semantic match threshold: best segment embedding score >= 78.
- Concept semantic match threshold: concept score >= 76 and ranked segment score >= 56.
- Semantic matches can appear in preview/report through `semantic_matches`, `semantic_evidence`, `semantic_explanation`.

### E. Requirement Classification

- `score >= 70`: matched.
- `score >= 40`: partial.
- `score >= 20`: weak.
- `< 20`: missing.
- Implemented in `categorize_requirement`.

### F. Score Calculation

Per requirement:

- Without embedding: `0.20 overlap + 0.45 ranked similarity + 0.35 skill score`.
- With embedding: `0.15 overlap + 0.35 ranked similarity + 0.30 skill score + 0.20 embedding`.
- Final requirement score is the maximum of hybrid score, semantic score, and concept floor.

Requirement evidence score:

- Weighted average of requirement scores.
- Priority weights: high `1.25`, medium `1.0`, low `0.7`.

Skill score:

- Weighted matched job skills / all scored job skills.

Job match score:

- `65% requirement evidence + 35% skill coverage`.

ATS score:

- Passed ATS checks / total checks.

Readiness score:

- `80% job match score + 20% ATS score`.

Overall score:

- A separate field named `overall_score` was not found in code. The report uses match score and readiness score.

### G. Recommendations

- Backend rule-based recommendations come from `build_recommendations` and `build_priority_fixes`.
- They are linked to missing skills, missing requirements, weak/partial requirements, and ATS issues.
- Frontend normalizes and displays them as priority actions.
- Optional AI coaching can add structured recommendations, but it is opt-in and depends on configured OpenAI/Ollama.

## 4. Algorithm Comparison And Research Findings

Implemented:

- Keyword overlap comparison: yes.
- TF-IDF comparison: yes.
- Hybrid BM25/TF-IDF/semantic comparison: yes.
- Ollama embedding comparison: implemented but skipped unless `OLLAMA_EMBEDDING_MODEL` is configured.
- Evaluation cases: yes.
- Manual expected labels: yes, related vs unrelated cases and expected skill sets.
- Precision/recall/F1: yes in `backend/scripts/evaluate_matching.py`.
- Accuracy: yes in `backend/scripts/evaluate_matching_methods.py`.
- Result table file: not found as a saved artifact; results print to console.

Actual output from current code:

- `scripts.evaluate_matching`:
  - precision `1.000`
  - recall `1.000`
  - F1 `1.000`
  - cases `10`
  - score ordering: strong `83`, partial `58`, unrelated `3`
  - ordering correct: `True`

Method comparison output when run with `DJANGO_SETTINGS_MODULE=config.settings`:

| Method | Precision | Recall | F1-score | Strength | Limitation | Finding |
|---|---:|---:|---:|---|---|---|
| Keyword overlap | not calculated in this script | not calculated | not calculated | Simple and explainable | Only 2/5 pair-ranking accuracy; misses paraphrases | Good for exact terms, weak for semantic matches |
| TF-IDF cosine | not calculated in this script | not calculated | not calculated | Better weighted lexical comparison than raw overlap | Also 2/5 pair-ranking accuracy in controlled paraphrase cases | Still misses related wording with few shared tokens |
| Hybrid BM25 + TF-IDF + semantic concepts | not calculated | not calculated | not calculated | 5/5 pair-ranking accuracy | Rule-based concept groups may need expansion | Best current deterministic method in controlled comparison |
| Ollama embeddings | not available | not available | not available | True semantic similarity possible | Skipped unless local embedding model configured | Implemented but optional; not part of default result |

Important limitation: `backend/scripts/evaluate_matching_methods.py` currently fails if run exactly as `python -m scripts.evaluate_matching_methods` because it does not initialize Django settings before calling matcher code that reads settings. It works when `DJANGO_SETTINGS_MODULE=config.settings` is set. This should be mentioned or fixed before presenting it as a polished evaluation command.

## 5. Example Cases For Final Report

### Case 1: Exact Data Analyst Skill Match

Job requirement:

Required skills include Python, SQL, Excel, Tableau or Power BI, communication, and problem solving.

Resume evidence:

Sample resume includes Python, pandas, SQL, Excel, Tableau, Git, data cleaning, communication, problem solving.

Matching method:

Skill dictionary + aliases + requirement score.

System result:

Supported by sample data and matcher; expected strong match for Python, SQL, Excel, Tableau, communication.

Expected interpretation:

CareerFit recognizes direct keyword evidence.

Why this case matters:

Shows basic correctness and explainability.

### Case 2: REST API Semantic/Alias Match

Job requirement:

Build backend APIs or REST endpoints.

Resume evidence:

`Built Django RESTful APIs backed by PostgreSQL and Docker.`

Matching method:

Alias mapping `restful -> rest`, skill extraction, semantic backend concepts.

System result:

Supported by tests such as semantic API/backend vocabulary tests.

Expected interpretation:

Related backend wording can support API requirements.

Why this case matters:

Demonstrates more than raw string matching.

### Case 3: Cross-Functional Collaboration Paraphrase

Job requirement:

Collaborate with cross-functional teams to solve customer problems.

Resume evidence:

`Partnered with product and support groups to resolve user issues.`

Matching method:

Hybrid BM25/TF-IDF/semantic concept evaluation.

System result:

In method evaluation, hybrid ranks related evidence above unrelated evidence; keyword/TF-IDF alone score 0 for this case.

Expected interpretation:

Hybrid semantic concept matching handles paraphrased collaboration evidence.

Why this case matters:

Strong final-report finding.

### Case 4: Missing Docker/Kubernetes Requirement

Job requirement:

Deploy containerized applications to cloud infrastructure.

Resume evidence:

If resume lacks Docker/Kubernetes/cloud deployment evidence.

Matching method:

Missing skill/requirement classification.

System result:

Suggested demo case; system should classify as weak/missing depending on resume text.

Expected interpretation:

CareerFit identifies missing deployment evidence and recommends adding truthful proof only if real.

Why this case matters:

Shows gap detection.

### Case 5: ATS Formatting Issue

Job requirement:

Not job-specific; ATS preparation.

Resume evidence:

Resume missing email, phone, bullets, dates, or measurable results.

Matching method:

Regex ATS checks.

System result:

Supported by `analyze_ats_readiness`.

Expected interpretation:

Readiness score includes document-preparation quality, not only skill match.

Why this case matters:

Shows practical value beyond NLP matching.

## 6. Final UI Screenshots Needed

| Screenshot | Page/component | Data to enter | What it proves |
|---|---|---|---|
| Home page | Home | Open app signed out | Public product entry and project positioning |
| Profile page | Profile | Name, target role, location, work preference | User profile implemented |
| Resume workspace | Resume | Upload/paste sample resume | Resume parsing/editable text/versioning |
| Job search | Job discovery | Search `Junior Data Analyst`, location optional | Backend-connected job discovery |
| Job filters | Job discovery filters | Set country/source/workplace/skills/salary | Search/filter implementation |
| Selected job comparison | Select a result | Use sample resume then select job | Direct resume-job preview |
| Readiness report | Report | Generate full report | Match score, readiness score, ATS score |
| Requirement evidence | Report section | Use job with multiple requirements | Explainable evidence mapping |
| Semantic match example | Report or preview | Use paraphrased collaboration/API case | Semantic/concept matching |
| Missing requirements/recommendations | Report | Use resume missing Docker/Kubernetes or ML/NLP | Gap and recommendation logic |
| Application tracker | Tracker/history | Save selected job, update status/date/note | Tracker persistence |
| Dashboard/search alerts | Dashboard | Save weekly alert | Saved alerts and workflow management |
| API output optional | Browser/Postman | `/api/matches/preview/` or `/api/jobs/search/` | Backend response structure |

## 7. Testing And Validation

Existing tests:

- Backend unit/API tests: yes.
- Frontend unit tests: yes.
- Frontend e2e tests: yes.
- Resume upload tested: yes.
- Job search tested: yes.
- Report generation/matching tested: yes.
- Tracker tested: yes.
- Authentication tested: yes.
- Algorithm output tested: yes.
- Manual testing still needed for live provider behavior and screenshots.

| Test area | Test performed | Expected result | Actual result | Status | Notes |
|---|---|---|---|---|---|
| Backend tests | `.venv/bin/python manage.py test` | All pass | 88 tests pass in prior run | done | Covers API/workflow/matching/job/resume/account |
| Skill extraction eval | `python -m scripts.evaluate_matching` | Precision/recall/F1 printed | 1.000/1.000/1.000 | done | Small controlled set |
| Method comparison | `DJANGO_SETTINGS_MODULE=config.settings python -m scripts.evaluate_matching_methods` | Accuracy by method | keyword 0.4, TF-IDF 0.4, hybrid 1.0, embeddings skipped | partial | Script needs environment/settings setup |
| Frontend lint | `npm run lint` | No ESLint errors | passed in prior run | done | CI step |
| Frontend unit | `npm run test` | Tests pass | 9 files, 37 tests passed in prior run | done | UI/service tests |
| Frontend build | `npm run build` | Production build | passed in prior run | done | CI step |
| E2E | `npm run test:e2e` | Navigation/theme tests pass | 3 passed in prior run | partial | Does not fully cover report/tracker workflow |

Manual tests before final report:

- Upload one PDF, one DOCX, and one TXT.
- Search live jobs with `all` and with `sample`.
- Select a job and verify preview appears.
- Generate report and capture requirement evidence.
- Save a job, update tracker status, add follow-up date.
- Try URL import with a simple public schema.org job page.
- Run semantic demo case and capture evidence row.
- Confirm AI coaching displays `not configured` or completed depending on local settings.

## 8. Limitations And Risks

CareerFit is implemented as an academic prototype and has several limitations. Job search depends on external providers, API keys, provider uptime, and the amount of description text returned by each source. Some providers return partial descriptions, so the system may need URL import or manual pasted text for accurate scoring. URL import only supports public HTTP/HTTPS pages and works best when job pages expose readable HTML or schema.org `JobPosting`; JavaScript-heavy or protected pages may fail.

Resume parsing supports PDF, DOCX, and TXT, but extracted text quality depends on the original file structure. The ATS checks are approximate regex-based checks rather than a real commercial ATS simulation. Requirement extraction is rule-based, so it can miss unusual phrasing or include imperfect fragments, although boilerplate filtering is implemented.

The matching algorithm is explainable and deterministic, but the skill dictionary and semantic concept groups are manually curated, so coverage is incomplete. Optional embedding similarity requires a local Ollama embedding model and is skipped if not configured. The evaluation dataset is small, controlled, and not representative of all industries. The method-comparison script currently requires Django settings to be supplied externally. Optional AI coaching is implemented but depends on OpenAI or Ollama configuration, rate limits, and model availability. The code includes deployment settings, but the final report should not claim production deployment unless deployment was actually completed.

## 9. Final Report Structure

| Midterm section | Final report action |
|---|---|
| Introduction | Keep but update tense from proposed to implemented. Add one paragraph about final implementation value. |
| Problem Statement | Keep mostly as is. Shorten if needed. |
| Proposed Solution | Rename to `Implemented Solution`. Replace future tense with actual workflow. |
| Project Objectives | Convert to objective-completion table: completed, partial, not implemented. |
| Scope and Limitations | Update with real limitations from code. |
| Review of Related Platforms | Keep but add final comparison: CareerFit combines job discovery + selected-job fitting + explainable evidence. |
| Proposed Users and Use Cases | Keep, but mark implemented use cases. |
| Requirements | Convert FR/NFR list to implementation-status table. |
| Wireframes/Prototype | Replace or supplement with final UI screenshots. |
| Proposed Architecture | Update to final architecture: React/Vite frontend, Django/DRF backend, SQLite/Postgres-ready persistence, provider APIs. |
| User Workflow | Replace with final workflow screenshots: profile -> resume -> job search -> selected job preview -> report -> tracker. |
| Matching Framework | Expand heavily using algorithm section above. Include formulas and thresholds. |
| Technology Selection | Keep and update with final libraries actually used. |
| Implementation Plan | Replace with `Final Implementation Summary`. |
| Testing and Evaluation Plan | Replace with actual tests and evaluation outputs. |
| Risks and Mitigation | Update with real limitations/risks. |
| Conclusion | Write as completed project conclusion: implemented workflow, findings, limitations, future work. |
| References | Keep existing references and add any provider/library references if required by the professor. |

## Strong Final-Report Claim

CareerFit's final implementation demonstrates a connected resume-to-job workflow: users can manage a profile and resume, discover jobs from live or sample sources, select a job, receive an immediate preview, generate an explainable readiness report, and save the role into an application tracker. The matching system combines skill extraction, alias handling, requirement-level evidence ranking, TF-IDF cosine similarity, BM25-style lexical ranking, semantic concept matching, optional Ollama embeddings, ATS checks, and rule-based recommendations. Controlled evaluation shows that exact keyword and TF-IDF methods perform well only when wording overlaps, while the hybrid method better handles paraphrased evidence in the included test cases.
