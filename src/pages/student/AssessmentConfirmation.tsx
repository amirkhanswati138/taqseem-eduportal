import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  ClipboardList,
  HelpCircle,
  Sparkles,
  Award,
} from "lucide-react";
import type { Student } from "../../types";
import type { APIAssignment } from "../../utils/api";
import { getMyAssignmentsAPI, getTestByIdAPI } from "../../utils/api";
import taqseemLogo from "../../assets/taqseemlogo.png";

interface AssessmentConfirmationProps {
  student: Student;
  onStartTest: (assignment: APIAssignment) => void;
  onLogout: () => void;
}

export default function AssessmentConfirmation({
  student,
  onStartTest,
  onLogout,
}: AssessmentConfirmationProps) {
  const [assignments, setAssignments] = useState<APIAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<APIAssignment | null>(null);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ============ LOAD ASSIGNMENTS ============
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    setError("");

    const res = await getMyAssignmentsAPI(student.username);

    if (!res.success) {
      setError(res.error || "Failed to load assessments");
      setLoading(false);
      return;
    }

    // Sirf pending wale dikhao
    const pending = (res.assignments || []).filter(
      (a) => a.status === "pending"
    );

    setAssignments(pending);
    setLoading(false);
  };

  // ============ SELECT ASSIGNMENT ============
  const handleSelectAssignment = async (assignment: APIAssignment) => {
    setSelectedAssignment(assignment);
    setLoadingDetails(true);

    const res = await getTestByIdAPI(assignment.testId);

    if (res.success && res.test) {
      setTestDetails(res.test);
    } else {
      setTestDetails(null);
    }

    setLoadingDetails(false);
  };

  // ============ START TEST ============
  const handleStart = () => {
    if (selectedAssignment) {
      onStartTest(selectedAssignment);
    }
  };

  // ============ BACK ============
  const handleBack = () => {
    setSelectedAssignment(null);
    setTestDetails(null);
  };

  // ============================================================
  //   RENDER
  // ============================================================

  // ---------- LOADING ----------
  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <main className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">
              Loading your assessments...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ---------- ERROR ----------
  if (error) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
        <Header student={student} onLogout={onLogout} />

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-display font-bold text-gray-900 text-lg mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button
              onClick={loadAssignments}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ---------- NO ASSIGNMENTS ----------
  if (assignments.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
        <Header student={student} onLogout={onLogout} />

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Bada logo + brand */}
            <div className="flex flex-col items-center justify-center mb-6">
              <img
                src={taqseemLogo}
                alt="Taqseem Logo"
                className="w-full max-w-[180px] md:max-w-[220px] h-auto object-contain drop-shadow-2xl animate-float mb-3"
              />
              <h1 className="font-display font-black text-xl md:text-2xl tracking-tight text-gray-800 leading-tight text-center">
                Taqseem Foundation
              </h1>
              <p className="font-display font-bold text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                EduPortal
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900 text-lg mb-2">
                No Assessments Assigned
              </h2>
              <p className="text-gray-500 text-sm">
                You don't have any pending assessments at the moment. Please
                contact your teacher or wait for them to assign a test.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------- DETAIL VIEW (Confirmation) ----------
  if (selectedAssignment) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
        <Header student={student} onLogout={onLogout} />

        <main className="relative z-10 flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto py-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-5 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur hover:bg-white text-gray-700 rounded-xl text-xs font-semibold transition-all shadow-md border border-gray-200"
            >
              ← Back to Assessments
            </button>

            {loadingDetails ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">
                  Loading assessment details...
                </p>
              </div>
            ) : (
              <>
                {/* GREETING CARD */}
                <div className="relative rounded-3xl overflow-hidden shadow-lg mb-5 bg-gradient-to-br from-green-600 to-blue-600">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

                  <div className="relative p-7 text-white">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
                      <Sparkles className="w-3 h-3" />
                      Assessment Ready
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                      Hi, {student.name.split(" ")[0]}! 👋
                    </h2>
                    <p className="text-white/90 text-sm leading-relaxed">
                      You have been assigned the following assessment. Please
                      read the details carefully before you begin.
                    </p>
                  </div>
                </div>

                {/* TEST INFO CARD */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                        Assessment
                      </p>
                      <h3 className="font-display font-bold text-gray-900 text-xl leading-tight">
                        {selectedAssignment.testName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {selectedAssignment.testId}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <InfoStat
                      icon={<HelpCircle className="w-4 h-4" />}
                      label="Questions"
                      value={
                        testDetails?.questions?.length.toString() || "—"
                      }
                    />
                    <InfoStat
                      icon={<Clock className="w-4 h-4" />}
                      label="Duration"
                      value={
                        selectedAssignment.duration
                          ? `${selectedAssignment.duration} min`
                          : "—"
                      }
                    />
                    <InfoStat
                      icon={<Target className="w-4 h-4" />}
                      label="Total Marks"
                      value={
                        testDetails?.questions
                          ?.reduce(
                            (sum: number, q: any) => sum + (q.marks || 1),
                            0
                          )
                          .toString() || "—"
                      }
                    />
                  </div>
                </div>

                {/* STUDENT INFO CARD */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-5">
                  <h4 className="font-display font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    Your Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Name" value={student.name} />
                    <InfoRow label="Roll No" value={student.rollNo} />
                    <InfoRow
                      label="Class / Batch"
                      value={student.className}
                    />
                    <InfoRow
                      label="Course"
                      value={student.course || "—"}
                    />
                  </div>
                </div>

                {/* INSTRUCTIONS CARD */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-display font-bold text-amber-900 text-sm">
                      Important Instructions
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Once you click <strong>"Yes, I'm Ready"</strong>, the
                        timer will start and cannot be paused.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Make sure you have a stable internet connection.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Your answers will be saved automatically as you go.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        The test will auto-submit when the time runs out.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CONFIRMATION QUESTION */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-5">
                  <h4 className="font-display font-bold text-gray-900 text-base mb-1 text-center">
                    Are you ready to begin?
                  </h4>
                  <p className="text-xs text-gray-500 text-center mb-5">
                    You will not be able to pause once started.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-sm"
                    >
                      Not Now
                    </button>
                    <button
                      onClick={handleStart}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Yes, I'm Ready
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------- ASSIGNMENTS LIST ----------
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
      <Header student={student} onLogout={onLogout} />

      <main className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto py-4">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-gray-800 mb-2">
              Assessment Confirmation
            </h1>
            <p className="text-sm text-gray-500">
              You have {assignments.length}{" "}
              {assignments.length === 1 ? "assessment" : "assessments"}{" "}
              assigned
            </p>
          </div>

          {/* Greeting */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md">
              {student.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-gray-900 text-sm truncate">
                Hi, {student.name.split(" ")[0]}!
              </p>
              <p className="text-xs text-gray-500 truncate">
                {student.rollNo} • {student.className}
              </p>
            </div>
          </div>

          {/* Assignments List */}
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <button
                key={assignment.assignmentId}
                onClick={() => handleSelectAssignment(assignment)}
                className="group w-full text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-gray-900 text-sm mb-1 truncate group-hover:text-green-700 transition-colors">
                      {assignment.testName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {assignment.duration} min
                      </span>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ==================== HEADER ====================
function Header({
  student,
  onLogout,
}: {
  student: Student;
  onLogout: () => void;
}) {
  return (
    <header className="relative z-10 flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={taqseemLogo}
            alt="Taqseem Logo"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="font-display font-bold text-gray-900 text-sm leading-tight">
              Taqseem Foundation
            </h1>
            <p className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              EduPortal
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

// ==================== INFO STAT ====================
function InfoStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-3 text-center border border-gray-100">
      <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm mx-auto mb-2">
        {icon}
      </div>
      <p className="text-[10px] text-gray-500 font-medium mb-0.5">
        {label}
      </p>
      <p className="font-display font-bold text-gray-900 text-sm">
        {value}
      </p>
    </div>
  );
}

// ==================== INFO ROW ====================
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-gray-800 truncate ml-2">
        {value}
      </span>
    </div>
  );
}