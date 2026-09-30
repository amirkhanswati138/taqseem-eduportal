import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentApp from "./pages/student/StudentApp";
import AdminApp from "./pages/admin/AdminApp";
import IntroScreen from "./components/IntroScreen";

const INTRO_SEEN_KEY = "intro_seen_v1";

function App() {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    // sessionStorage — har refresh/naye tab pe intro dikhega
    const introSeen = sessionStorage.getItem(INTRO_SEEN_KEY);
    setShowIntro(introSeen !== "true");
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    setShowIntro(false);
  };

  // Intro check abhi ho raha hai
  if (showIntro === null) {
    return null;
  }

  // Intro dikhao
  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  // Routes chalao
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentApp />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;