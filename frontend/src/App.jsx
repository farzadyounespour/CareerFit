import { useEffect, useMemo, useRef, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";
import { sampleJobDescription, sampleResume } from "./data/sampleInputs.js";
import {
  analyzeMatch,
  clearStoredToken,
  confirmEmailVerification,
  confirmPasswordReset,
  createResumeVersion,
  createSearchAlert,
  deleteAccount,
  deleteReport,
  deleteResume,
  deleteSavedJob,
  deleteSearchAlert,
  exportTrackedJobs,
  exportWorkspace,
  fetchCurrentUser,
  fetchReportHistory,
  fetchResumeVersions,
  fetchSavedJobs,
  fetchSearchAlerts,
  generatePacketDrafts,
  getStoredToken,
  loginAccount,
  logoutAccount,
  importJobUrl,
  importTrackedJobs,
  previewMatch,
  registerAccount,
  requestAiCoaching,
  requestEmailVerification,
  requestPasswordReset,
  saveJob,
  searchJobs,
  storeToken,
  updateCurrentUser,
  updateSearchAlert,
  updateTrackedJob,
  uploadResume,
} from "./services/api.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import HistoryScreen from "./screens/HistoryScreen.jsx";
import JobMatchScreen from "./screens/JobMatchScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ResumeUploadScreen from "./screens/ResumeUploadScreen.jsx";
import UserProfileScreen from "./screens/UserProfileScreen.jsx";
import { applyProfileToJobSearch, applyResumeToJobSearch } from "./utils/jobSearchDefaults.js";

const initialProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  target_role: "Junior Data Analyst",
  experience_level: "Student",
  work_preference: "Open to remote or on-site",
  summary: "",
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [pendingScreen, setPendingScreen] = useState(null);
  const [activeScreen, setActiveScreen] = useState("home");
  const [profile, setProfile] = useState(initialProfile);
  const [resumeText, setResumeText] = useState("");
  const [uploadedResumeId, setUploadedResumeId] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchPreview, setMatchPreview] = useState(null);
  const [isPreviewingMatch, setIsPreviewingMatch] = useState(false);
  const [matchPreviewError, setMatchPreviewError] = useState("");
  const matchPreviewCache = useRef(new Map());
  const matchPreviewRequest = useRef(0);
  const appliedResumeSearchDefaults = useRef("");
  const resumeSearchSourceName = useRef("");
  const [jobSearch, setJobSearch] = useState({
    title: "Junior Data Analyst",
    location: "",
    country: "us",
    workplace: "any",
    skills: "",
    experience_level: "any",
    employment_type: "any",
    salary_min: "",
    salary_max: "",
    page: 1,
  });
  const [jobResults, setJobResults] = useState([]);
  const [jobPagination, setJobPagination] = useState({
    page: 1,
    count: 0,
    total_pages: 0,
    has_previous: false,
    has_next: false,
  });
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobSearchError, setJobSearchError] = useState("");
  const [jobSearchNotice, setJobSearchNotice] = useState("");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAiCoaching, setIsLoadingAiCoaching] = useState(false);
  const [aiCoachingError, setAiCoachingError] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadStatus, setResumeUploadStatus] = useState("");
  const [resumeUploadError, setResumeUploadError] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [searchAlerts, setSearchAlerts] = useState([]);
  const [useAiCoaching, setUseAiCoaching] = useState(false);
  const [authLinkParams, setAuthLinkParams] = useState({});
  const [accountNotice, setAccountNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetUid = params.get("reset_uid");
    const resetToken = params.get("reset_token");
    const verifyUid = params.get("verify_uid");
    const verifyToken = params.get("verify_token");
    if (resetUid && resetToken) {
      setAuthLinkParams({ uid: resetUid, token: resetToken });
      setAuthMode("reset-confirm");
    }
    if (verifyUid && verifyToken) {
      confirmEmailVerification({ uid: verifyUid, token: verifyToken })
        .then(({ detail }) => {
          setAccountNotice(detail);
          setCurrentUser((user) => user ? { ...user, email_verified: true } : user);
        })
        .catch((verifyError) => setAccountNotice(verifyError.message));
    }
    if (resetUid || resetToken || verifyUid || verifyToken) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (!getStoredToken()) {
      return;
    }
    fetchCurrentUser()
      .then(({ user }) => {
        setCurrentUser(user);
        setIsSignedIn(true);
        setJobSearch((currentSearch) => applyProfileToJobSearch(currentSearch, user));
        setProfile((currentProfile) => ({
          ...currentProfile,
          name: user.name || currentProfile.name,
          email: user.email || currentProfile.email,
          phone: user.phone || currentProfile.phone,
          location: user.location || currentProfile.location,
          target_role: user.target_role || currentProfile.target_role,
          experience_level: user.experience_level || currentProfile.experience_level,
          work_preference: user.work_preference || currentProfile.work_preference,
          summary: user.summary || currentProfile.summary,
        }));
      })
      .catch(() => clearStoredToken());
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeScreen]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("careerfit_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    setMatchPreview(null);
    setMatchPreviewError("");
    matchPreviewRequest.current += 1;
    setIsPreviewingMatch(false);
  }, [resumeText]);

  const canAnalyze = useMemo(
    () => resumeText.trim().length > 0 && jobDescription.trim().length > 0,
    [resumeText, jobDescription],
  );

  async function handleNavigate(screen) {
    if (screen !== "home" && !isSignedIn) {
      setPendingScreen(screen);
      setAuthMode("login");
      return;
    }
    if (screen === "history" || screen === "dashboard") {
      await loadSavedWorkspace(screen);
      return;
    }
    if (screen === "resume") {
      const result = await fetchResumeVersions();
      setResumeVersions(result.results);
    }
    if (screen === "job") {
      if (resumeText.trim() && appliedResumeSearchDefaults.current !== resumeText) {
        applyFreshResumeSearchDefaults(resumeText);
      } else if (!resumeText.trim()) {
        setJobSearch((currentSearch) => applyProfileToJobSearch(currentSearch, profile));
      }
    }
    setActiveScreen(screen);
  }

  async function handleAnalyze() {
    setError("");
    setAiCoachingError("");

    if (!canAnalyze) {
      setError("Please add both resume text and a job description before generating the report.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeMatch({
        user_profile: profile,
        resume_text: resumeText,
        job_description: jobDescription,
        resume_title: "CareerFit resume",
        resume_id: uploadedResumeId || undefined,
        job_title: selectedJob?.title || jobSearch.title,
        job_company: selectedJob?.company || "",
        job_location: selectedJob?.location || "",
        job_source: selectedJob?.source || "",
        job_url: selectedJob?.url || "",
        use_llm: useAiCoaching,
      });
      setReport(result);
      setHistory((currentHistory) => [
        {
          id: result.report_id,
          target_role: result.summary?.target_role,
          created_at: new Date().toISOString(),
          summary: result.summary || {},
          resume_text: resumeText,
          job_description: jobDescription,
          result,
        },
        ...currentHistory.filter((item) => item.id !== result.report_id),
      ]);
      setActiveScreen("report");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestAiCoaching() {
    setAiCoachingError("");
    if (!canAnalyze) {
      setAiCoachingError("Add both resume text and a job description before requesting specific improvements.");
      return;
    }

    setIsLoadingAiCoaching(true);
    try {
      const result = await requestAiCoaching({
        user_profile: profile,
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setReport((currentReport) => currentReport ? { ...currentReport, ai_coaching: result.ai_coaching } : currentReport);
    } catch (coachingError) {
      setAiCoachingError(coachingError.message);
    } finally {
      setIsLoadingAiCoaching(false);
    }
  }

  async function handleResumeUpload(file) {
    if (!file) {
      return;
    }

    setResumeUploadError("");
    setResumeUploadStatus("");
    setIsUploadingResume(true);

    try {
      const result = await uploadResume(file);
      setResumeText(result.text);
      applyFreshResumeSearchDefaults(result.text, result.filename);
      setUploadedResumeId(result.resume_id || null);
      if (result.resume_id) {
        setResumeVersions((currentVersions) => [
          { id: result.resume_id, title: result.filename, text: result.text },
          ...currentVersions.filter((resume) => resume.id !== result.resume_id),
        ]);
      }
      setResumeUploadStatus(`Loaded ${result.filename} (${result.character_count.toLocaleString()} characters).`);
    } catch (uploadError) {
      setResumeUploadError(uploadError.message);
    } finally {
      setIsUploadingResume(false);
    }
  }

  function applyFreshResumeSearchDefaults(text, sourceName = resumeSearchSourceName.current) {
    setJobSearch((currentSearch) => applyResumeToJobSearch(currentSearch, text, profile, sourceName));
    appliedResumeSearchDefaults.current = text;
    resumeSearchSourceName.current = sourceName;
  }

  function handleContinueToJobs() {
    applyFreshResumeSearchDefaults(resumeText);
    setActiveScreen("job");
  }

  function handleResumeTextChange(text) {
    setResumeText(text);
    appliedResumeSearchDefaults.current = "";
    resumeSearchSourceName.current = "";
  }

  function handleDismissResumeError() {
    setResumeUploadError("");
  }

  async function handleProfileContinue() {
    setProfileSaveError("");
    if (!isSignedIn) {
      setActiveScreen("resume");
      return;
    }

    try {
      const result = await updateCurrentUser(profile);
      setCurrentUser(result.user);
      setJobSearch((currentSearch) => applyProfileToJobSearch(currentSearch, result.user));
      const versions = await fetchResumeVersions();
      setResumeVersions(versions.results);
      setActiveScreen("resume");
    } catch (profileError) {
      setProfileSaveError(profileError.message);
    }
  }

  async function runJobSearch(nextSearch = jobSearch) {
    setJobSearchError("");
    setJobSearchNotice("");
    setJobResults([]);

    if (!nextSearch.title.trim()) {
      setJobSearchError("Enter a job title before searching.");
      return;
    }

    setIsSearchingJobs(true);
    try {
      const result = await searchJobs({
        title: nextSearch.title.trim(),
        location: nextSearch.location.trim(),
        country: nextSearch.country,
        workplace: nextSearch.workplace,
        skills: nextSearch.skills.trim(),
        experience_level: nextSearch.experience_level,
        employment_type: nextSearch.employment_type,
        salary_min: nextSearch.salary_min,
        salary_max: nextSearch.salary_max,
        page: nextSearch.page,
      });
      setJobResults(result.results);
      setJobPagination(result.pagination);
      if (result.using_sample_data) {
        setJobSearchNotice("Live job providers are unavailable. Showing local sample postings.");
      } else if (result.provider_errors?.length) {
        setJobSearchNotice(`Showing live postings from ${result.providers.join(", ")}. Some job providers are temporarily unavailable.`);
      } else {
        setJobSearchNotice(`Showing live postings from ${result.providers.join(", ")}.`);
      }
      if (result.results.length === 0) {
        setJobSearchError("No jobs found. Try a broader title or location.");
      }
    } catch (searchError) {
      setJobSearchError(searchError.message);
    } finally {
      setIsSearchingJobs(false);
    }
  }

  async function handleJobSearch(event) {
    event.preventDefault();
    const firstPageSearch = { ...jobSearch, page: 1 };
    setJobSearch(firstPageSearch);
    await runJobSearch(firstPageSearch);
  }

  async function handleJobPageChange(page) {
    const nextSearch = { ...jobSearch, page };
    setJobSearch(nextSearch);
    await runJobSearch(nextSearch);
  }

  async function handleSelectJob(job) {
    const selectedDescription = [
      job.title,
      job.company ? `Company: ${job.company}` : "",
      job.location ? `Location: ${job.location}` : "",
      job.description,
      job.url ? `Source: ${job.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    setJobDescription(selectedDescription);
    setSelectedJob(job);
    setMatchPreview(null);
    setMatchPreviewError("");
    const requestId = matchPreviewRequest.current + 1;
    matchPreviewRequest.current = requestId;

    if (!resumeText.trim()) {
      setIsPreviewingMatch(false);
      setMatchPreviewError("Upload or select a resume to calculate your match score.");
      return;
    }

    const cacheKey = `${resumeText}\n---job---\n${selectedDescription}`;
    const cachedPreview = matchPreviewCache.current.get(cacheKey);
    if (cachedPreview) {
      setIsPreviewingMatch(false);
      setMatchPreview(cachedPreview);
      return;
    }

    setIsPreviewingMatch(true);
    try {
      const result = await previewMatch({
        user_profile: profile,
        resume_text: resumeText,
        job_description: selectedDescription,
      });
      matchPreviewCache.current.set(cacheKey, result);
      if (matchPreviewRequest.current === requestId) {
        setMatchPreview(result);
      }
    } catch (previewError) {
      if (matchPreviewRequest.current === requestId) {
        setMatchPreviewError(previewError.message);
      }
    } finally {
      if (matchPreviewRequest.current === requestId) {
        setIsPreviewingMatch(false);
      }
    }
  }

  function handleJobDescriptionChange(value) {
    setJobDescription(value);
    setMatchPreview(null);
    setMatchPreviewError("");
    matchPreviewRequest.current += 1;
    setIsPreviewingMatch(false);
  }

  function handleLoadSampleJob() {
    setSelectedJob(null);
    handleJobDescriptionChange(sampleJobDescription);
  }

  async function handleSaveJob(job) {
    if (!isSignedIn) {
      setAuthMode("login");
      return;
    }
    const result = await saveJob(job);
    setSavedJobs((currentJobs) => [result.job, ...currentJobs.filter((item) => item.id !== result.job.id)]);
    setJobSearchNotice("Job saved to your account.");
  }

  async function handleImportJobUrl(url) {
    const result = await importJobUrl(url);
    await handleSelectJob(result.job);
    setJobSearchNotice("Imported the job posting. Review the description, then compare or save it.");
    return result.job;
  }

  async function handleCreateSearchAlert() {
    const alertSearch = { ...jobSearch };
    if (!alertSearch.salary_min) delete alertSearch.salary_min;
    if (!alertSearch.salary_max) delete alertSearch.salary_max;
    const result = await createSearchAlert({
      ...alertSearch,
      name: `${jobSearch.title}${jobSearch.location ? ` in ${jobSearch.location}` : ""}`,
      frequency: "weekly",
    });
    setSearchAlerts((currentAlerts) => [result.alert, ...currentAlerts]);
    setJobSearchNotice("Weekly search alert saved. You can manage it from your dashboard.");
  }

  async function handleDeleteSavedJob(jobId) {
    await deleteSavedJob(jobId);
    setSavedJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
  }

  async function handleUpdateTrackedJob(jobId, values) {
    const result = await updateTrackedJob(jobId, values);
    setSavedJobs((currentJobs) => currentJobs.map((job) => job.id === jobId ? result.job : job));
  }

  async function handleGeneratePacketDrafts(jobId, useAi) {
    const result = await generatePacketDrafts(jobId, useAi);
    setSavedJobs((currentJobs) => currentJobs.map((job) => job.id === jobId ? result.job : job));
    return result;
  }

  async function handleImportTrackedJobs(file) {
    const result = await importTrackedJobs(file);
    const savedJobResult = await fetchSavedJobs();
    setSavedJobs(savedJobResult.results);
    return result;
  }

  async function handleDeleteSearchAlert(alertId) {
    await deleteSearchAlert(alertId);
    setSearchAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));
  }

  async function handleToggleSearchAlert(alert) {
    const result = await updateSearchAlert(alert.id, { is_active: !alert.is_active });
    setSearchAlerts((currentAlerts) => currentAlerts.map((item) => item.id === alert.id ? result.alert : item));
  }

  async function handleUpdateSearchAlert(alert, values) {
    const result = await updateSearchAlert(alert.id, values);
    setSearchAlerts((currentAlerts) => currentAlerts.map((item) => item.id === alert.id ? result.alert : item));
  }

  async function handleCreateResumeVersion(title) {
    const result = await createResumeVersion({ title, text: resumeText });
    setResumeVersions((currentVersions) => [result.resume, ...currentVersions]);
    setUploadedResumeId(result.resume.id);
    setResumeUploadStatus(`Saved ${result.resume.title} as a reusable resume version.`);
  }

  function handleLoadResumeVersion(resume) {
    setResumeText(resume.text);
    applyFreshResumeSearchDefaults(resume.text, resume.title);
    setUploadedResumeId(resume.id);
    setResumeUploadStatus(`Loaded ${resume.title}.`);
  }

  async function handleDeleteReport(reportId) {
    await deleteReport(reportId);
    setHistory((currentHistory) => currentHistory.filter((item) => item.id !== reportId));
  }

  async function handleDeleteUploadedResume() {
    if (uploadedResumeId) {
      await deleteResume(uploadedResumeId);
      setResumeVersions((currentVersions) => currentVersions.filter((resume) => resume.id !== uploadedResumeId));
    }
    setUploadedResumeId(null);
    setResumeText("");
    appliedResumeSearchDefaults.current = "";
    resumeSearchSourceName.current = "";
    setResumeUploadError("");
    setResumeUploadStatus("");
  }

  async function handleDeleteResumeVersion(resumeId) {
    await deleteResume(resumeId);
    setResumeVersions((currentVersions) => currentVersions.filter((resume) => resume.id !== resumeId));
    if (uploadedResumeId === resumeId) {
      setUploadedResumeId(null);
      setResumeUploadStatus("Removed the saved resume version. Your editable preview is still available.");
    }
  }

  async function handleDeleteAccount() {
    await deleteAccount();
    clearStoredToken();
    setCurrentUser(null);
    setIsSignedIn(false);
    setHistory([]);
    setSavedJobs([]);
    setResumeVersions([]);
    setSearchAlerts([]);
    setReport(null);
    setResumeText("");
    appliedResumeSearchDefaults.current = "";
    resumeSearchSourceName.current = "";
    setUploadedResumeId(null);
    setProfile(initialProfile);
    setActiveScreen("home");
  }

  async function handleLoadHistory() {
    if (!isSignedIn) {
      setPendingScreen("history");
      setAuthMode("login");
      return;
    }
    await loadSavedWorkspace();
  }

  async function loadSavedWorkspace(destination = "history") {
    setActiveScreen(destination);
    const [historyResult, savedJobResult, resumeResult, alertResult] = await Promise.all([
      fetchReportHistory(),
      fetchSavedJobs(),
      fetchResumeVersions(),
      fetchSearchAlerts(),
    ]);
    setHistory(historyResult.results);
    setSavedJobs(savedJobResult.results);
    setResumeVersions(resumeResult.results);
    setSearchAlerts(alertResult.results);
  }

  function handleUseSavedJob(job) {
    handleSelectJob(job);
    setJobSearch((currentSearch) => applyProfileToJobSearch(currentSearch, profile));
    setActiveScreen("job");
  }

  function renderScreen() {
    if (activeScreen === "home") {
      return <HomeScreen onNavigate={handleNavigate} onAuthOpen={setAuthMode} />;
    }

    if (activeScreen === "profile") {
      return (
        <UserProfileScreen
          profile={profile}
          onChange={setProfile}
          onNext={handleProfileContinue}
          saveError={profileSaveError}
          isSignedIn={isSignedIn}
          onDeleteAccount={handleDeleteAccount}
          currentUser={currentUser}
          accountNotice={accountNotice}
          onRequestEmailVerification={handleRequestEmailVerification}
          onExportWorkspace={exportWorkspace}
        />
      );
    }

    if (activeScreen === "dashboard") {
      return (
        <DashboardScreen
          history={history}
          savedJobs={savedJobs}
          searchAlerts={searchAlerts}
          onNavigate={handleNavigate}
          onToggleAlert={handleToggleSearchAlert}
          onUpdateAlert={handleUpdateSearchAlert}
          onDeleteAlert={handleDeleteSearchAlert}
        />
      );
    }

    if (activeScreen === "resume") {
      return (
        <ResumeUploadScreen
          resumeText={resumeText}
          onChange={handleResumeTextChange}
          onLoadSample={() => {
            setResumeText(sampleResume);
            applyFreshResumeSearchDefaults(sampleResume, "");
            setUploadedResumeId(null);
          }}
          onUpload={handleResumeUpload}
          isUploading={isUploadingResume}
          uploadStatus={resumeUploadStatus}
          uploadError={resumeUploadError}
          onDismissError={handleDismissResumeError}
          onNext={handleContinueToJobs}
          onDelete={handleDeleteUploadedResume}
          resumeVersions={resumeVersions}
          onSaveVersion={handleCreateResumeVersion}
          onLoadVersion={handleLoadResumeVersion}
          onDeleteVersion={handleDeleteResumeVersion}
        />
      );
    }

    if (activeScreen === "job") {
      return (
        <JobMatchScreen
          jobDescription={jobDescription}
          onChange={handleJobDescriptionChange}
          onLoadSample={handleLoadSampleJob}
          jobSearch={jobSearch}
          onJobSearchChange={setJobSearch}
          jobResults={jobResults}
          onJobSearch={handleJobSearch}
          onSelectJob={handleSelectJob}
          onImportJobUrl={handleImportJobUrl}
          isSearchingJobs={isSearchingJobs}
          jobSearchError={jobSearchError}
          jobSearchNotice={jobSearchNotice}
          onSaveJob={handleSaveJob}
          onCreateSearchAlert={handleCreateSearchAlert}
          onPageChange={handleJobPageChange}
          pagination={jobPagination}
          selectedJob={selectedJob}
          matchPreview={matchPreview}
          isPreviewingMatch={isPreviewingMatch}
          matchPreviewError={matchPreviewError}
          hasResume={resumeText.trim().length > 0}
          onUploadResume={() => handleNavigate("resume")}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
          useAiCoaching={useAiCoaching}
          onAiCoachingChange={setUseAiCoaching}
        />
      );
    }

    if (activeScreen === "history") {
      return (
        <HistoryScreen
          history={history}
          savedJobs={savedJobs}
          onOpenReport={(selectedReport) => {
            setReport(selectedReport.result);
            setResumeText(selectedReport.resume_text);
            setJobDescription(selectedReport.job_description);
            setUploadedResumeId(null);
            setActiveScreen("report");
          }}
          onUseJob={handleUseSavedJob}
          onDeleteJob={handleDeleteSavedJob}
          onDeleteReport={handleDeleteReport}
          onUpdateJob={handleUpdateTrackedJob}
          onGeneratePacketDrafts={handleGeneratePacketDrafts}
          onExportJobs={exportTrackedJobs}
          onImportJobs={handleImportTrackedJobs}
          resumeVersions={resumeVersions}
        />
      );
    }

    return (
      <ReportScreen
        report={report}
        resumeText={resumeText}
        jobDescription={jobDescription}
        onNavigate={setActiveScreen}
        onRequestAiCoaching={handleRequestAiCoaching}
        isLoadingAiCoaching={isLoadingAiCoaching}
        aiCoachingError={aiCoachingError}
        history={history}
      />
    );
  }

  async function handleAuthComplete(mode, form) {
    const result =
      mode === "create"
        ? await registerAccount(form)
        : await loginAccount({ email: form.email, password: form.password });
    storeToken(result.token, form.remember);
    setCurrentUser(result.user);
    setIsSignedIn(true);
    setJobSearch((currentSearch) => applyProfileToJobSearch(currentSearch, result.user));
    setProfile((currentProfile) => ({
      ...currentProfile,
      name: result.user.name || currentProfile.name,
      email: result.user.email || currentProfile.email,
      phone: result.user.phone || currentProfile.phone,
      location: result.user.location || currentProfile.location,
      target_role: result.user.target_role || currentProfile.target_role,
      experience_level: result.user.experience_level || currentProfile.experience_level,
      work_preference: result.user.work_preference || currentProfile.work_preference,
      summary: result.user.summary || currentProfile.summary,
    }));
    setAuthMode(null);
    if (pendingScreen === "history" || pendingScreen === "dashboard") {
      await loadSavedWorkspace(pendingScreen);
    } else {
      setActiveScreen(pendingScreen || "profile");
    }
    setPendingScreen(null);
  }

  async function handleSignOut() {
    try {
      await logoutAccount();
    } finally {
      clearStoredToken();
      setCurrentUser(null);
      setIsSignedIn(false);
      setActiveScreen("home");
    }
  }

  async function handleRequestEmailVerification() {
    const result = await requestEmailVerification();
    setAccountNotice(result.verification_url ? `${result.detail} ${result.verification_url}` : result.detail);
  }

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        isSignedIn={isSignedIn}
        currentUser={currentUser}
        onAuthOpen={setAuthMode}
        onSignOut={handleSignOut}
        onHistory={handleLoadHistory}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((currentMode) => !currentMode)}
      >
        {renderScreen()}
      </AppShell>

      {authMode && (
        <AuthScreen
          initialMode={authMode}
          onContinue={handleAuthComplete}
          onPasswordReset={requestPasswordReset}
          onPasswordResetConfirm={confirmPasswordReset}
          linkParams={authLinkParams}
          onClose={() => {
            setAuthMode(null);
            setPendingScreen(null);
          }}
        />
      )}
    </>
  );
}

function getInitialDarkMode() {
  const savedTheme = localStorage.getItem("careerfit_theme");
  if (savedTheme) {
    return savedTheme === "dark";
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
}
