import { useState, useEffect } from "react";
import type { Student } from "../../types";
import type { APIAssignment } from "../../utils/api";
import StudentLoginPage from "./StudentLoginPage";
import AssessmentConfirmation from "./AssessmentConfirmation";
import TestPage from "./TestPage";
import { getStudent, clearStudent } from "../../utils/storage";

type StudentScreen = "login" | "confirmation" | "test";

export default function StudentApp() {
  const [student, setStudent] = useState<Student | null>(null);
  const [screen, setScreen] = useState<StudentScreen>("login");
  const [activeAssignment, setActiveAssignment] =
    useState<APIAssignment | null>(null);

  useEffect(() => {
    const saved = getStudent();
    if (saved) {
      setStudent(saved);
      setScreen("confirmation");
    }
  }, []);

  const handleLoginSuccess = (studentData: Student) => {
    setStudent(studentData);
    setScreen("confirmation");
  };

  const handleStartTest = (assignment: APIAssignment) => {
    setActiveAssignment(assignment);
    setScreen("test");
  };

  const handleTestSubmitSuccess = () => {
    setActiveAssignment(null);
    setScreen("confirmation");
  };

  const handleLogout = () => {
    clearStudent();
    setStudent(null);
    setActiveAssignment(null);
    setScreen("login");
  };

  if (screen === "login" || !student) {
    return <StudentLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (screen === "confirmation") {
    return (
      <AssessmentConfirmation
        student={student}
        onStartTest={handleStartTest}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "test" && activeAssignment) {
    return (
      <TestPage
        student={student}
        assignment={activeAssignment}
        onSubmitSuccess={handleTestSubmitSuccess}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}