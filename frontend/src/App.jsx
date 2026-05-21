import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell.jsx";
import { sampleJobDescription, sampleResume } from "./data/sampleInputs.js";
import { analyzeMatch } from "./services/api.js";
import AuthScreen from "./screens/AuthScreen.jsx";
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
  const [activeScreen, setActiveScreen] = useState("profile");
  const [profile, setProfile] = useState(initialProfile);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

  function renderScreen() {
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
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    return <ReportScreen report={report} />;
  }

  if (!isSignedIn) {
    return <AuthScreen onContinue={() => setIsSignedIn(true)} />;
  }

  return (
    <AppShell activeScreen={activeScreen} onNavigate={setActiveScreen}>
      {renderScreen()}
    </AppShell>
  );
}
