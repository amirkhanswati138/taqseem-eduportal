import { useState } from "react";
import { User, Lock, LogIn, GraduationCap } from "lucide-react";
import type { Student } from "../../types";
import { getCachedStudents } from "../../utils/studentCache";
import { saveStudent } from "../../utils/storage";
import taqseemLogo from "../../assets/taqseemlogo.png";

interface StudentLoginPageProps {
  onLoginSuccess: (student: Student) => void;
}

export default function StudentLoginPage({
  onLoginSuccess,
}: StudentLoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const students = getCachedStudents();

      if (students.length === 0) {
        setError(
          "Student list not available. Please contact your admin to sync the list."
        );
        setIsLoading(false);
        return;
      }

      const found = students.find(
        (s) =>
          s.username.toLowerCase().trim() === username.toLowerCase().trim() &&
          s.password === password.trim()
      );

      if (!found) {
        setError("Invalid username or password!");
        setIsLoading(false);
        return;
      }

      const studentData: Student = {
        username: found.username,
        name: found.name,
        rollNo: found.studentId,
        className: found.classBatch,
        course: found.course,
        fatherName: found.fatherName,
        active: true,
      };

      saveStudent(studentData);
      onLoginSuccess(studentData);
    }, 500);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Split Layout */}
      <div className="relative z-10 h-full w-full flex flex-col md:flex-row">
        {/* ==================== LEFT SIDE — LOGO + TEXT ==================== */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
          <div className="flex flex-col items-center text-center max-w-md">
            {/* Big Logo */}
            <img
              src={taqseemLogo}
              alt="Taqseem Logo"
              className="w-full max-w-[280px] md:max-w-[380px] lg:max-w-[450px] h-auto object-contain drop-shadow-2xl animate-float mb-6"
            />

            {/* Brand Text */}
            <h1 className="font-display font-black text-2xl md:text-3xl lg:text-4xl tracking-tight text-gray-800 leading-tight">
              Taqseem Foundation
            </h1>
            <p className="font-display font-bold text-lg md:text-xl lg:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mt-1">
              EduPortal
            </p>

            {/* Small tagline */}
            <p className="text-xs md:text-sm text-gray-500 mt-3">
              Educate • Empower • Transform
            </p>
          </div>
        </div>

        {/* ==================== RIGHT SIDE — LOGIN FORM ==================== */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white p-8">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl shadow-lg mb-3">
                  <GraduationCap
                    className="w-7 h-7 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <h2 className="font-display font-bold text-gray-900 text-xl mb-1">
                  Student Login
                </h2>
                <p className="text-xs text-gray-500">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your.username"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm text-gray-800 placeholder-gray-400 font-medium"
                      autoFocus
                      autoComplete="off"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm text-gray-800 placeholder-gray-400 font-medium"
                      autoComplete="off"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2 animate-scale-in">
                    <span className="text-base">⚠️</span>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              © 2026 Taqseem Foundation • EduPortal
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}