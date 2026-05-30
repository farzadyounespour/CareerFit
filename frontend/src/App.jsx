import { useEffect, useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";
import { sampleJobDescription, sampleResume } from "./data/sampleInputs.js";
import {
  analyzeMatch,
  fetchCurrentUser,
  fetchReportHistory,
  fetchSavedJobs,
  loginAccount,
  logoutAccount,
  registerAccount,
  saveJob,
  searchJobs,
  updateCurrentUser,
  uploadResume,
} from "./services/api.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import HistoryScreen from "./screens/HistoryScreen.jsx";
import JobMatchScreen from "./screens/JobMatchScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ResumeUploadScreen from "./screens/ResumeUploadScreen.jsx";
import UserProfileScreen from "./screens/UserProfileScreen.jsx";

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
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [activeScreen, setActiveScreen] = useState("home");
  const [profile, setProfile] = useState(initialProfile);
  const [resumeText, setResumeText] = useState("");
  const [uploadedResumeId, setUploadedResumeId] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSearch, setJobSearch] = useState({
    title: "Junior Data Analyst",
    location: "",
    country: "us",
    remote: false,
    page: 1,
  });
  const [jobResults, setJobResults] = useState([]);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobSearchError, setJobSearchError] = useState("");
  const [jobSearchNotice, setJobSearchNotice] = useState("");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadStatus, setResumeUploadStatus] = useState("");
  const [resumeUploadError, setResumeUploadError] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [useAiCoaching, setUseAiCoaching] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("careerfit_token")) {
      return;
    }
    fetchCurrentUser()
      .then(({ user }) => {
        setCurrentUser(user);
        setIsSignedIn(true);
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
      .catch(() => localStorage.removeItem("careerfit_token"));
  }, []);

  const canAnalyze = useMemo(
    () => resumeText.trim().length > 0 && jobDescription.trim().length > 0,
    [resumeText, jobDescription],
  );

  async function handleAnalyze() {
    setError("");

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
      setActiveScreen("report");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsLoading(false);
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
      setUploadedResumeId(result.resume_id || null);
      setResumeUploadStatus(`Loaded ${result.filename} (${result.character_count.toLocaleString()} characters).`);
    } catch (uploadError) {
      setResumeUploadError(uploadError.message);
    } finally {
      setIsUploadingResume(false);
    }
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
        remote: nextSearch.remote,
        page: nextSearch.page,
      });
      setJobResults(result.results);
      if (result.using_sample_data) {
        setJobSearchNotice("Showing sample job postings. Add Adzuna API keys to backend/.env for live job search.");
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

  function handleSelectJob(job) {
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
  }

  async function handleSaveJob(job) {
    if (!isSignedIn) {
      setAuthMode("login");
      return;
    }
    await saveJob(job);
    setJobSearchNotice("Job saved to your account.");
  }

  async function handleLoadHistory() {
    if (!isSignedIn) {
      setAuthMode("login");
      return;
    }
    const [historyResult, savedJobResult] = await Promise.all([
      fetchReportHistory(),
      fetchSavedJobs(),
    ]);
    setHistory(historyResult.results);
    setSavedJobs(savedJobResult.results);
    setActiveScreen("history");
  }

  function handleUseSavedJob(job) {
    handleSelectJob(job);
    setActiveScreen("job");
  }

  function renderScreen() {
    if (activeScreen === "home") {
      return <HomeScreen onNavigate={setActiveScreen} onAuthOpen={setAuthMode} />;
    }

    if (activeScreen === "profile") {
      return (
        <UserProfileScreen
          profile={profile}
          onChange={setProfile}
          onNext={handleProfileContinue}
          saveError={profileSaveError}
        />
      );
    }

    if (activeScreen === "resume") {
      return (
        <ResumeUploadScreen
          resumeText={resumeText}
          onChange={setResumeText}
          onLoadSample={() => {
            setResumeText(sampleResume);
            setUploadedResumeId(null);
          }}
          onUpload={handleResumeUpload}
          isUploading={isUploadingResume}
          uploadStatus={resumeUploadStatus}
          uploadError={resumeUploadError}
          onNext={() => setActiveScreen("job")}
        />
      );
    }

    if (activeScreen === "job") {
      return (
        <JobMatchScreen
          jobDescription={jobDescription}
          onChange={setJobDescription}
          onLoadSample={() => setJobDescription(sampleJobDescription)}
          jobSearch={jobSearch}
          onJobSearchChange={setJobSearch}
          jobResults={jobResults}
          onJobSearch={handleJobSearch}
          onSelectJob={handleSelectJob}
          isSearchingJobs={isSearchingJobs}
          jobSearchError={jobSearchError}
          jobSearchNotice={jobSearchNotice}
          onSaveJob={handleSaveJob}
          onPageChange={handleJobPageChange}
          selectedJob={selectedJob}
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
            setReport(selectedReport);
            setActiveScreen("report");
          }}
          onUseJob={handleUseSavedJob}
        />
      );
    }

    return (
      <ReportScreen
        report={report}
        resumeText={resumeText}
        jobDescription={jobDescription}
        onNavigate={setActiveScreen}
      />
    );
  }

  async function handleAuthComplete(mode, form) {
    const result =
      mode === "create"
        ? await registerAccount(form)
        : await loginAccount({ email: form.email, password: form.password });
    localStorage.setItem("careerfit_token", result.token);
    setCurrentUser(result.user);
    setIsSignedIn(true);
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
  }

  async function handleSignOut() {
    try {
      await logoutAccount();
    } finally {
      localStorage.removeItem("careerfit_token");
      setCurrentUser(null);
      setIsSignedIn(false);
    }
  }

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        isSignedIn={isSignedIn}
        currentUser={currentUser}
        onAuthOpen={setAuthMode}
        onSignOut={handleSignOut}
        onHistory={handleLoadHistory}
      >
        {renderScreen()}
      </AppShell>

      {authMode && (
        <AuthScreen
          initialMode={authMode}
          onContinue={handleAuthComplete}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  );
}
