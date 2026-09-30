import { useState, useEffect } from "react";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboard from "./AdminDashboard";
import StudentsManager from "./StudentsManager";
import AssessmentManager from "./AssessmentManager";
import ResultsManager from "./ResultsManager";

type AdminScreen =
  | "login"
  | "dashboard"
  | "students"
  | "assessments"
  | "results";

export default function AdminApp() {
  const [screen, setScreen] = useState<AdminScreen>("login");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_logged_in");
    if (saved === "true") setScreen("dashboard");
  }, []);

  const handleLoginSuccess = () => setScreen("dashboard");

  const handleLogout = () => {
    sessionStorage.removeItem("admin_logged_in");
    setScreen("login");
  };

  const handleManageStudents = () => setScreen("students");
  const handleManageAssessments = () => setScreen("assessments");
  const handleViewResults = () => setScreen("results");
  const handleBackToDashboard = () => setScreen("dashboard");

  if (screen === "login") {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (screen === "students") {
    return <StudentsManager onBack={handleBackToDashboard} />;
  }

  if (screen === "assessments") {
    return <AssessmentManager onBack={handleBackToDashboard} />;
  }

  if (screen === "results") {
    return <ResultsManager onBack={handleBackToDashboard} />;
  }

  return (
    <AdminDashboard
      onManageStudents={handleManageStudents}
      onManageAssessments={handleManageAssessments}
      onViewResults={handleViewResults}
      onLogout={handleLogout}
    />
  );
}