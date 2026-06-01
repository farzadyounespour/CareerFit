# CareerFit: A Comparative and Explainable Resume-Job Matching Framework

## Midterm Project Report

**Student:** Farzad Younespour  
**Student ID:** 40306504  
**Course:** Project and Report I  
**Supervisor:** Professor Joumana Dargham  
**Term:** Summer 2026  

---

## Table of Contents

1. Introduction  
2. Problem Statement  
3. Proposed Solution  
4. Project Objectives  
5. Scope and Limitations  
6. Review of Related Platforms  
7. Proposed Users and Use Cases  
8. Functional and Non-Functional Requirements  
9. Proposed Wireframes and Prototype  
10. Proposed System Architecture  
11. Proposed User Workflow  
12. Proposed Matching Framework  
13. Technology Selection  
14. Implementation Plan  
15. Testing and Evaluation Plan  
16. Risks and Mitigation  
17. Conclusion  
18. References  

---

## 1. Introduction

Applying for jobs can be time-consuming because candidates must read long job descriptions, identify the most important requirements, and decide whether their resume communicates enough relevant evidence. A resume may contain suitable experience but still fail to present it clearly for a specific position. Candidates may also struggle to understand which skills are missing and which parts of their resume should be improved before applying.

CareerFit is proposed as a web-based resume-job matching framework for application-readiness assessment. The system will allow users to upload or paste a resume, search for job postings or provide a specific job description, and receive an explainable comparison report. Instead of presenting only a general percentage, CareerFit will identify matched requirements, partially supported requirements, weak evidence, missing skills, ATS-oriented preparation issues, and practical improvement suggestions.

This midterm report presents the proposed design before the implementation phase begins. It defines the problem, project scope, requirements, wireframes, prototype concept, architecture, workflow, matching methodology, implementation plan, and evaluation strategy.

## 2. Problem Statement

Many job seekers apply without knowing whether their resume is aligned with a posting. Existing resume tools may provide a match score or general advice, but a percentage alone does not answer the most useful questions:

- Which job requirements are supported by the resume?
- Which skills or qualifications appear to be missing?
- Which requirements are essential and which are optional?
- Which resume sections should be improved?
- How was the score calculated?
- Does the tool recognize related meanings when the resume and posting use different words?

The project addresses the following research question:

> How can different resume-job matching techniques be compared and integrated into an explainable framework that maps job requirements to resume evidence, calculates transparent application-readiness scores, and provides practical recommendations?

## 3. Proposed Solution

CareerFit will provide a guided web experience for evaluating and improving job applications. The proposed system will allow the user to:

1. Create an account and maintain a candidate profile.
2. Upload a resume file or paste resume text.
3. Review and edit the extracted resume text.
4. Search for jobs by title, location, and selected filters.
5. Paste a complete job description or import a public job URL.
6. Select a posting and receive a quick comparison.
7. Generate a detailed report with scores, evidence, ATS checks, and recommendations.
8. Save suitable roles in an application tracker.
9. Review common skills across retrieved postings for a target role.
10. Optionally request AI-assisted coaching after the deterministic analysis.

The main design principle is explainability. The system should show why a score was assigned rather than hiding the reasoning behind a single number.

## 4. Project Objectives

The project objectives are:

1. Design and develop a web-based prototype for explainable resume-job matching.
2. Support uploaded and pasted resumes.
3. Support direct job-description input and limited job-title-based retrieval.
4. Extract structured requirements from job descriptions.
5. Extract candidate evidence from resumes.
6. Build a lightweight role-based knowledge summary from retrieved postings.
7. Compare keyword-based, TF-IDF-based, and embedding-based similarity techniques.
8. Map job requirements to resume evidence.
9. Categorize each requirement as matched, partial, weak, or missing.
10. Calculate explainable match and readiness scores.
11. Provide improvement recommendations.
12. Evaluate the methods using controlled test cases and measurable metrics.

## 5. Scope and Limitations

CareerFit will be developed as an academic prototype rather than a commercial recruitment platform.

### 5.1 Included Scope

- Web-based user interface.
- Candidate profile.
- Resume upload and editable text preview.
- Job search through accessible APIs.
- Direct job-description input.
- Job requirement extraction.
- Resume evidence extraction.
- Explainable matching and scoring.
- ATS-oriented preparation checks.
- Recommendations and optional AI coaching.
- Saved jobs and application tracking.
- Controlled matching-method evaluation.

### 5.2 Excluded Scope

- Automatically submitting job applications.
- Guaranteeing employment outcomes.
- Training a new AI model from scratch.
- Scraping restricted websites without authorization.
- Replacing recruiter judgment.
- Supporting every job board or every possible resume format.

The readiness score will represent resume evidence and document preparation, not the probability of receiving an interview or offer.

## 6. Review of Related Platforms

Several existing products demonstrate the value of resume tailoring and ATS-oriented feedback.

Jobscan allows users to compare a resume with a job description and provides a match rate, missing keywords, formatting flags, and section analysis [1]. Resume Worded provides a targeted-resume feature that identifies missing skills and relevance gaps [2]. Huntr combines resume tailoring with a job tracker and describes a matching process that considers keyword and semantic signals [3].

These platforms show that users benefit from tailored feedback. CareerFit will focus on transparent academic design by exposing requirement-level evidence, separating deterministic scoring from optional AI coaching, and comparing multiple matching techniques through measurable experiments.

## 7. Proposed Users and Use Cases

### 7.1 Primary User

The primary user is a job seeker who wants to:

- Evaluate a specific posting.
- Understand whether the resume presents enough evidence.
- Identify missing or weak areas.
- Improve the resume before applying.
- Track application progress.

### 7.2 Main Use Cases

| Use Case | Description |
|---|---|
| Upload resume | User uploads PDF, DOCX, or TXT content and reviews the extracted text. |
| Search jobs | User searches by title and location and optionally applies filters. |
| Import posting | User pastes a public posting URL or a complete job description. |
| Quick comparison | User selects a role and immediately receives a preliminary score and skill summary. |
| Generate report | User receives requirement-level evidence, ATS checks, and recommendations. |
| Review role insights | User sees recurring skills across retrieved postings. |
| Track application | User saves a role and records progress, dates, notes, and tasks. |

## 8. Functional and Non-Functional Requirements

### 8.1 Functional Requirements

| ID | Proposed Requirement |
|---|---|
| FR-01 | The system shall allow account registration, login, logout, and profile editing. |
| FR-02 | The system shall accept PDF, DOCX, TXT, and pasted resume text. |
| FR-03 | The user shall be able to review, edit, clear, and replace resume text. |
| FR-04 | The system shall retrieve a limited number of job postings from accessible sources. |
| FR-05 | The system shall allow direct job-description input and public URL import. |
| FR-06 | The system shall extract skills and requirement-style phrases from postings. |
| FR-07 | The system shall compare requirements with resume evidence. |
| FR-08 | The system shall calculate match and readiness scores. |
| FR-09 | The system shall show matched, partial, weak, and missing requirements. |
| FR-10 | The system shall show ATS-oriented preparation checks. |
| FR-11 | The system shall provide recommendations and optional AI coaching. |
| FR-12 | The system shall summarize common skills across retrieved postings. |
| FR-13 | The user shall be able to add roles to an application tracker. |
| FR-14 | The system shall support reusable resume versions and report history. |

### 8.2 Non-Functional Requirements

| ID | Proposed Requirement |
|---|---|
| NFR-01 | Scores should be explainable and supported by visible evidence. |
| NFR-02 | Core analysis should work without a paid external AI service. |
| NFR-03 | Sensitive credentials should remain outside the Git repository. |
| NFR-04 | The interface should provide clear feedback and recovery actions. |
| NFR-05 | The architecture should separate frontend, backend, and persistence concerns. |
| NFR-06 | The prototype should support automated testing. |
| NFR-07 | The website should remain usable on desktop and mobile screens. |

## 9. Proposed Wireframes and Prototype

The initial prototype will follow a horizontal navigation model:

```text
Home | Profile | Resume | Jobs | Report | Tracker
```

The main screens are described below. Editable wireframe diagrams are included in the Word version of this report.

### 9.1 Home Page Wireframe

The home page will introduce the purpose of CareerFit and provide direct actions to check a resume or search for jobs.

### 9.2 Resume Workspace Wireframe

The resume page will include:

- File upload area.
- Editable resume text preview.
- ATS preparation checklist.
- Saved resume versions.
- Continue-to-jobs action.

### 9.3 Jobs Page Wireframe

The jobs page will include:

- Search fields and filters.
- Role-insights summary.
- Retrieved job cards.
- Selected-job comparison panel.
- Quick score, matched skills, missing skills, and report action.

### 9.4 Report Page Wireframe

The report page will include:

- Match and readiness score.
- Score breakdown.
- Requirement categories.
- ATS preparation checks.
- Recommendations.
- Optional AI coaching.
- Resume-improvement examples.

### 9.5 Tracker Page Wireframe

The tracker page will include:

- Saved applications.
- Status stages.
- Follow-up and interview dates.
- Notes and tasks.
- Linked resume versions.

## 10. Proposed System Architecture

CareerFit will use a client-server architecture.

```text
React Frontend
      |
      | REST API
      v
Django REST Framework Backend
      |
      +-- Accounts and Authentication
      +-- Resume Parsing
      +-- Job Search and Role Insights
      +-- Matching and Recommendations
      +-- Application Tracker
      |
      v
SQLite for local development / PostgreSQL for deployment

External Services:
Adzuna API | Arbeitnow API | Optional Jooble API
Optional Ollama or OpenAI coaching
```

### 10.1 Proposed Backend Modules

| Module | Responsibility |
|---|---|
| Accounts | User registration, login, and profile management |
| Resumes | Resume upload, parsing, normalization, and saved versions |
| Jobs | Search aggregation, URL input, role insights, and tracker records |
| Matching | Skill extraction, requirement mapping, scoring, and evaluation |
| Coaching | Optional AI-assisted suggestions |

## 11. Proposed User Workflow

The proposed workflow is:

```text
Create account or sign in
          |
          v
Complete profile
          |
          v
Upload or paste resume
          |
          v
Review editable text and ATS checks
          |
          v
Search jobs or paste a description
          |
          v
Select a posting
          |
          v
View quick comparison
          |
          v
Generate detailed readiness report
          |
          +----> Improve resume and rescan
          |
          +----> Add role to application tracker
```

## 12. Proposed Matching Framework

CareerFit will compare three approaches.

### 12.1 Keyword-Based Matching

Keyword-based matching will provide a simple baseline by identifying exact or normalized overlap between posting requirements and resume text.

### 12.2 TF-IDF Similarity

TF-IDF cosine similarity will compare requirement text with resume evidence. This method gives more importance to informative words and less importance to common terms.

### 12.3 Embedding-Based Semantic Similarity

Embedding-based similarity will compare the meaning of text segments even when wording differs. For example:

```text
Requirement: Collaborate with cross-functional teams.
Resume: Partnered with product and support groups.
```

A lexical method may miss this connection, while a semantic model may recognize the relationship.

### 12.4 Explainable Requirement Mapping

Each extracted requirement will be categorized as:

- Matched.
- Partially matched.
- Weakly supported.
- Missing.

The interface will show supporting resume evidence where available.

## 13. Technology Selection

| Area | Proposed Technology | Reason |
|---|---|---|
| Frontend | React, JavaScript, Tailwind CSS, Vite | Component-based UI and efficient development |
| Backend | Django and Django REST Framework | Structured API development and authentication support |
| Local database | SQLite | Simple local setup |
| Deployment database | PostgreSQL | Production-ready relational persistence |
| Resume parsing | `pypdf`, `python-docx` | PDF and DOCX text extraction |
| Job providers | Adzuna, Arbeitnow, optional Jooble | Accessible job-search sources |
| Optional AI | Ollama or OpenAI | Tailored suggestions after deterministic analysis |
| Testing | Django tests, Vitest, Playwright | Backend, frontend, and workflow verification |

## 14. Implementation Plan

Coding and validation will begin after the midterm design review.

| Phase | Planned Activities |
|---|---|
| Phase 1 | Finalize requirements, wireframes, architecture, and evaluation strategy |
| Phase 2 | Build account, profile, and resume-input workflow |
| Phase 3 | Implement resume parsing and preprocessing |
| Phase 4 | Integrate job retrieval and direct job-description input |
| Phase 5 | Implement skill extraction and requirement mapping |
| Phase 6 | Implement keyword and TF-IDF matching |
| Phase 7 | Add explainable scores, ATS checks, and recommendations |
| Phase 8 | Build reports, role insights, and tracker workflow |
| Phase 9 | Add optional AI coaching and semantic evaluation |
| Phase 10 | Test, calibrate, document, and prepare the final presentation |

## 15. Testing and Evaluation Plan

### 15.1 Software Testing

The project will include:

- Backend unit tests.
- API tests.
- Frontend component tests.
- Browser workflow tests.
- Manual responsive-interface review.

### 15.2 Matching Evaluation

The evaluation will use controlled resume-job cases with manually defined expected outcomes.

Planned metrics:

```text
precision = true_positive / (true_positive + false_positive)
recall = true_positive / (true_positive + false_negative)
f1 = 2 * precision * recall / (precision + recall)
```

Planned comparisons:

- Keyword overlap.
- TF-IDF cosine similarity.
- Semantic embedding similarity.
- Strong, partial, and weak resume-job scenarios.

### 15.3 Explainability Review

The report will examine whether:

- Each score is supported by visible evidence.
- Missing requirements are understandable.
- Recommendations are actionable.
- Optional AI suggestions remain separated from deterministic scoring.

## 16. Risks and Mitigation

| Risk | Planned Mitigation |
|---|---|
| Job-provider APIs may be unavailable. | Use multiple accessible providers and local samples. |
| Provider descriptions may be incomplete. | Show warnings and allow pasted descriptions. |
| PDF extraction may be unreliable. | Keep extracted text editable and normalize common issues. |
| Lexical methods may miss paraphrases. | Compare semantic embeddings during evaluation. |
| Users may misinterpret scores. | Explain score meaning and display requirement evidence. |
| AI suggestions may be inaccurate. | Keep AI optional and preserve deterministic analysis. |
| Resume data is sensitive. | Store data in the backend and exclude secrets from Git. |

## 17. Conclusion

This midterm report defines the proposed CareerFit system before implementation. The project will combine a practical job-search workflow with an explainable resume-matching framework. The proposed design includes editable resume input, limited multi-provider job retrieval, direct posting input, role-based insights, deterministic scoring, ATS checks, recommendations, optional AI coaching, and application tracking.

The next stage will begin coding the prototype according to the wireframes, architecture, workflow, and evaluation plan presented in this report.

## 18. References

[1] Jobscan, "Free Resume Scanner and ATS Resume Checker," https://www.jobscan.co/resume-checker  
[2] Resume Worded, "Targeted Resume," https://www.resumeworded.com/targeted-resume  
[3] Huntr, "Resume Tailor," https://huntr.co/product/resume-tailor  
[4] Adzuna, "API Overview," https://developer.adzuna.com/overview  
[5] Arbeitnow, "Job Board API," https://www.arbeitnow.com/api/job-board-api  
[6] Jooble Help Center, "REST API Documentation," https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation  
[7] Ollama, "Generate Embeddings," https://docs.ollama.com/api/embed  
[8] Nielsen Norman Group, "10 Usability Heuristics for User Interface Design," https://www.nngroup.com/articles/ten-usability-heuristics/  

