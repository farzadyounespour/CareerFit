import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";
import { sampleJobDescription, sampleResume } from "./data/sampleInputs.js";
import { analyzeMatch, searchJobs, uploadResume } from "./services/api.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import JobMatchScreen from "./screens/JobMatchScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ResumeUploadScreen from "./screens/ResumeUploadScreen.jsx";
import UserProfileScreen from "./screens/UserProfileScreen.jsx";

const initialProfile = {
  name: "",
  target_role: "Junior Data Analyst",
  experience_level: "Student",
};

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [activeScreen, setActiveScreen] = useState("home");
  const [profile, setProfile] = useState(initialProfile);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobSearch, setJobSearch] = useState({
    title: "Junior Data Analyst",
    location: "",
    country: "us",
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
  const [error, setError] = useState("");

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
      setResumeUploadStatus(`Loaded ${result.filename} (${result.character_count.toLocaleString()} characters).`);
    } catch (uploadError) {
      setResumeUploadError(uploadError.message);
    } finally {
      setIsUploadingResume(false);
    }
  }

  async function handleJobSearch(event) {
    event.preventDefault();
    setJobSearchError("");
    setJobSearchNotice("");
    setJobResults([]);

    if (!jobSearch.title.trim()) {
      setJobSearchError("Enter a job title before searching.");
      return;
    }

    setIsSearchingJobs(true);
    try {
      const result = await searchJobs({
        title: jobSearch.title.trim(),
        location: jobSearch.location.trim(),
        country: jobSearch.country,
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
          onNext={() => setActiveScreen("resume")}
        />
      );
    }

    if (activeScreen === "resume") {
      return (
        <ResumeUploadScreen
          resumeText={resumeText}
          onChange={setResumeText}
          onLoadSample={() => setResumeText(sampleResume)}
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
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    return <ReportScreen report={report} />;
  }

  function handleAuthComplete() {
    setIsSignedIn(true);
    setAuthMode(null);
  }

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        isSignedIn={isSignedIn}
        onAuthOpen={setAuthMode}
        onSignOut={() => setIsSignedIn(false)}
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
