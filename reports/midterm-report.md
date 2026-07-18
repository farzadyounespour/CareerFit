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

### 7.3 User Persona

The initial prototype will be designed for a representative user persona:

| Attribute | Description |
|---|---|
| Name | Sara, an early-career professional preparing targeted applications |
| Goal | Find suitable roles and improve the resume before applying |
| Current behavior | Searches multiple job boards, keeps several resume copies, and manually compares postings |
| Main difficulty | Long descriptions make it difficult to identify the most important gaps quickly |
| Technical comfort | Comfortable using web applications but does not want to interpret complex NLP metrics |
| Design need | A guided workflow with plain-language feedback, visible evidence, and reversible actions |

This persona is not intended to represent every job seeker. It provides a concrete basis for deciding which actions should be prominent and which technical details should remain secondary.

### 7.4 User Stories

| ID | User Story |
|---|---|
| US-01 | As a job seeker, I want to upload my resume once so that I can reuse it while reviewing multiple roles. |
| US-02 | As a job seeker, I want to correct extracted resume text so that file-parsing errors do not affect my report. |
| US-03 | As a job seeker, I want job-search fields to use my profile information where appropriate so that I can begin quickly. |
| US-04 | As a job seeker, I want to select a posting and receive an immediate summary so that I can decide whether a full report is useful. |
| US-05 | As a job seeker, I want to understand which requirements are supported by my resume so that the score is meaningful. |
| US-06 | As a job seeker, I want improvement examples related to my resume so that I know what to revise. |
| US-07 | As a job seeker, I want to save promising roles and record follow-ups so that applications remain organized. |
| US-08 | As a privacy-conscious user, I want AI coaching to be optional so that the basic analysis can work without sending my resume to an external model. |
| US-09 | As a job seeker, I want to discover related job titles so that I do not miss suitable roles with unfamiliar names. |
| US-10 | As a job seeker, I want to exclude unsuitable keywords and compare promising postings so that I can focus my preparation time. |

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
| FR-15 | The system shall suggest related role titles and show posting-freshness information where provider dates are available. |
| FR-16 | The system shall support excluded-keyword filtering and side-by-side comparison of up to three postings. |

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

### 8.3 Acceptance Criteria

The following acceptance criteria will guide implementation and testing:

| ID | Acceptance Criterion |
|---|---|
| AC-01 | A valid PDF, DOCX, or TXT resume produces an editable text preview. |
| AC-02 | An invalid file produces a clear message and can be removed or replaced. |
| AC-03 | A user without an active resume is prompted to upload one before requesting a comparison. |
| AC-04 | Selecting a job displays a quick comparison with match score, readiness score, matched skills, and missing skills. |
| AC-05 | The detailed report separates matched, partial, weak, and missing requirements. |
| AC-06 | Each supported requirement can display resume evidence or a plain-language explanation. |
| AC-07 | The report distinguishes ATS preparation from content alignment. |
| AC-08 | Job search supports title, location, country, workplace, skills, excluded keywords, experience, employment type, and salary filters. |
| AC-09 | A selected role can be added to the tracker and assigned an application stage. |
| AC-10 | Optional AI coaching requires an explicit user action and does not change the deterministic score. |
| AC-11 | Related-role suggestions can start a new search without requiring the user to re-enter existing filters. |
| AC-12 | Users can compare up to three postings by title, company, location, salary, workplace, and freshness. |

## 9. Proposed Wireframes and Prototype

The initial prototype will follow a horizontal navigation model:

```text
Home | Profile | Resume | Jobs | Report | Tracker
```

The main screens are described below. Editable mockup diagrams are included in the Word version of this report. The diagrams are intended to communicate information hierarchy, primary actions, feedback states, and navigation before frontend implementation begins.

### 9.1 Information Architecture

The website will use a task-oriented structure:

| Navigation Item | Purpose | Main User Question |
|---|---|---|
| Home | Explain the product and provide starting actions | What can CareerFit help me do? |
| Profile | Store candidate preferences used for autofill | What type of work am I targeting? |
| Resume | Upload, review, edit, and save resume versions | Is my resume ready to compare? |
| Jobs | Search, filter, import, and select postings | Which role should I evaluate? |
| Report | Review scores, evidence, ATS checks, and improvements | What should I improve before applying? |
| Tracker | Save roles and manage follow-up actions | What is the status of each application? |

### 9.2 Visual and Interaction Design Direction

CareerFit will use a calm, work-focused visual language. The interface should support repeated use and scanning rather than resemble a marketing-heavy landing page.

| Design Element | Proposed Direction |
|---|---|
| Navigation | Horizontal desktop navigation with a compact responsive alternative on smaller screens |
| Color | Teal for primary actions and positive progress, dark ink for high-contrast headings, slate for secondary text, amber for warnings, and rose for errors |
| Layout | Constrained content width, clear page headings, compact cards for individual records, and full-width sections for major workflows |
| Icons | Familiar icons beside actions such as upload, search, save, delete, and open external posting |
| Feedback | Visible loading, success, warning, empty, disabled, and error states |
| Reversibility | Resume clearing, saved-version deletion, filter clearing, and tracker updates remain explicit |
| Accessibility | Readable contrast, visible labels, keyboard-accessible controls, and text that does not rely only on color |

### 9.3 Home Page Mockup

The home page will introduce the purpose of CareerFit and provide direct actions to check a resume or search for jobs.

The first viewport will contain:

- CareerFit identity and horizontal navigation.
- A direct value statement focused on job seekers.
- Primary action: check resume fit.
- Secondary action: search jobs.
- A short four-step workflow.
- A report preview that makes explainability visible before registration.

### 9.4 Profile Page Mockup

The profile page will capture information that can reduce repeated typing:

- Name and contact details.
- Location.
- Target role.
- Experience level.
- Workplace preference.
- Short professional summary.
- Save confirmation and validation errors.

The target role and location will be used to prefill the job-search form while remaining editable.

### 9.5 Resume Workspace Mockup

The resume page will include:

- File upload area.
- Editable resume text preview.
- ATS preparation checklist.
- Saved resume versions.
- Continue-to-jobs action.

Important states will include:

| State | Proposed Behavior |
|---|---|
| Empty | Explain accepted file types and allow manual pasting. |
| Uploading | Show that text extraction is in progress. |
| Upload error | Show an actionable message with dismiss and retry options. |
| Parsed | Display editable text, word count, ATS checks, clear action, and continue action. |
| Saved version | Allow the version to be loaded or removed. |

### 9.6 Jobs Page Mockup

The jobs page will include:

- Search fields and filters.
- Role-insights summary.
- Related-role suggestions and posting-freshness badges.
- Excluded-keyword filtering.
- Retrieved job cards.
- Optional side-by-side comparison for up to three postings.
- Selected-job comparison panel.
- Quick score, matched skills, missing skills, and report action.

The page will support three entry paths:

1. Search providers using a title and location.
2. Import a public posting URL.
3. Paste a complete job description manually.

The quick-comparison panel will remain visible beside results on larger screens. On smaller screens it will move below the selected posting so that reading order remains natural.

### 9.7 Report Page Mockup

The report page will include:

- Match and readiness score.
- Score breakdown.
- Requirement categories.
- ATS preparation checks.
- Recommendations.
- Optional AI coaching.
- Resume-improvement examples.

The report will follow a progressive-disclosure design. The user first sees an executive summary and the highest-priority next actions. Detailed evidence, ATS checks, resume examples, interview preparation, and optional AI coaching can then be reviewed in separate sections.

### 9.8 Tracker Page Mockup

The tracker page will include:

- Saved applications.
- Status stages.
- Follow-up and interview dates.
- Notes and tasks.
- Linked resume versions.

### 9.9 Prototype Interaction Notes

| Interaction | Planned Response |
|---|---|
| User clicks `Continue to jobs` after adding a resume | Navigate to the jobs page with target role and location prefilled from profile or resume context where available. |
| User clicks `Use this job` without a resume | Display a prompt explaining the benefit of uploading a resume and provide a direct resume-page action. |
| User selects a posting with a resume | Run a lightweight comparison and show quick scores immediately. |
| User requests a full report | Generate detailed evidence mapping, ATS checks, and prioritized recommendations. |
| User requests AI coaching | Explain that resume and posting content will be sent to the selected model, then require an explicit confirmation. |
| User adds a role to the tracker | Preserve posting metadata and allow status, notes, tasks, dates, and linked resume version to be updated. |

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

### 10.2 Proposed Data Model

| Entity | Purpose | Main Fields |
|---|---|---|
| User | Authentication identity | Username, password hash, email |
| User Profile | Candidate preferences and autofill information | Name, phone, location, target role, experience level, work preference, summary |
| Resume | Reusable resume version | User, title, extracted and edited text, creation date |
| Job Description | Imported, selected, or tracked role | User, title, company, location, source, URL, text, workplace, employment type, status |
| Match Report | Snapshot of one comparison | User, resume, job, score result, resume snapshot, job snapshot, creation date |
| Search Alert | Reusable job-search preference | Title, location, country, workplace, skills, salary, frequency |

Snapshots will preserve the text used for an analysis even if the user later edits a resume or posting. This makes report history easier to understand.

### 10.3 Proposed API Responsibilities

| API Group | Proposed Responsibilities |
|---|---|
| Accounts | Registration, login, logout, profile, verification, password reset, account deletion |
| Resumes | Upload, parse, list versions, create version, retrieve, and delete |
| Jobs | Search, import URL, save role, update tracker record, export tracker, manage alerts |
| Matching | Preview comparison, generate detailed report, request optional coaching, retrieve history |

### 10.4 Security and Privacy Design

Resume content is sensitive. The proposed implementation will:

- Store API credentials in environment variables rather than source control.
- Require authentication before users edit private workspace records.
- Associate saved resumes, reports, alerts, and tracked jobs with the authenticated user.
- Avoid sending resume text to an AI provider unless the user opts in.
- Reject unsupported files and limit upload size.
- Preserve a path for deleting user data.

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

### 11.1 Alternative and Recovery Flows

| Situation | Proposed Recovery |
|---|---|
| Resume extraction is incomplete | User reviews and edits the extracted text or pastes content manually. |
| Job provider is unavailable | Use another accessible provider, local sample data, URL import, or manual description input. |
| Job result contains only an excerpt | Warn the user and request the complete description for a more reliable report. |
| No resume is loaded | Guide the user back to the resume workspace before comparison. |
| AI provider is not configured | Keep deterministic reporting available and explain that coaching is optional. |
| User is not signed in | Allow public exploration where appropriate and request sign-in before saving private records. |

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

### 12.5 Proposed Score Presentation

Two related scores will be presented:

| Score | Meaning |
|---|---|
| Match score | How strongly the resume text supports the selected posting requirements |
| Readiness score | Match score combined with ATS-oriented resume preparation |

The interface will avoid presenting either score as a prediction of receiving an interview. A short explanation will accompany low, medium, and strong alignment ranges.

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

### 14.1 Planned Deliverables

| Milestone | Deliverable |
|---|---|
| Midterm design review | Problem definition, related-platform review, requirements, mockups, diagrams, workflow, and evaluation plan |
| Prototype foundation | Account, profile, resume workspace, and initial navigation |
| Matching prototype | Job input, extraction, lexical comparison, scores, and explainable requirement mapping |
| Extended workflow | Job-provider integration, role insights, tracker, ATS checks, and optional AI coaching |
| Final review | Automated tests, evaluation results, screenshots, limitations, final report, and presentation |

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

### 15.4 Usability Evaluation

The prototype will be reviewed using task-based scenarios:

| Scenario | Success Condition |
|---|---|
| Upload and inspect a resume | User can correct text and understand whether the document is ready to compare. |
| Search for a target role | User can adjust profile-prefilled fields and apply relevant filters. |
| Select a posting | User receives a quick comparison or a clear resume-upload prompt. |
| Interpret a report | User can identify the highest-priority improvement and locate supporting evidence. |
| Track an application | User can add a role, set its stage, and record a follow-up action. |

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
