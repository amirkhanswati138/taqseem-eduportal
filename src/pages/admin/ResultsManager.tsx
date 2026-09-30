import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  X,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  Sparkles,
  Bot,
} from "lucide-react";
import type {
  APIAssignment,
  APISubmission,
  APIQuestion,
  APIStudent,
} from "../../utils/api";
import {
  getAllSubmissionsAPI,
  getAllAssignmentsAPI,
  getTestByIdAPI,
  gradeSubmissionAPI,
  getAllTestsAPI,
  saveAIGradesAPI,
  type APITest,
} from "../../utils/api";
import { getCachedStudents } from "../../utils/studentCache";
import { aiGradeBatch } from "../../utils/aiGrader";

interface ResultsManagerProps {
  onBack: () => void;
}

type Screen = "list" | "grade";

interface SubmissionGroup {
  assignmentId: string;
  studentUsername: string;
  studentName: string;
  studentRollNo: string;
  testId: string;
  testName: string;
  submittedAt: string;
  totalQuestions: number;
  gradedCount: number;
  totalMarks: number;
  obtainedMarks: number;
  status: "pending" | "graded" | "partial";
}

export default function ResultsManager({ onBack }: ResultsManagerProps) {
  const [screen, setScreen] = useState<Screen>("list");
  const [loading, setLoading] = useState(true);

  const [submissions, setSubmissions] = useState<APISubmission[]>([]);
  const [assignments, setAssignments] = useState<APIAssignment[]>([]);
  const [tests, setTests] = useState<APITest[]>([]);
  const [students, setStudents] = useState<APIStudent[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "graded" | "partial"
  >("all");

  const [activeGroup, setActiveGroup] = useState<SubmissionGroup | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<APIQuestion[]>([]);
  const [activeSubmissions, setActiveSubmissions] = useState<APISubmission[]>(
    []
  );
  const [gradeMap, setGradeMap] = useState<{ [questionId: string]: number }>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // AI GRADING STATES
  const [isAIGrading, setIsAIGrading] = useState(false);
  const [aiProgress, setAIProgress] = useState({ done: 0, total: 0 });
  const [aiMsg, setAIMsg] = useState("");

  const loadAll = async () => {
    setLoading(true);

    const [subRes, assignRes, testRes] = await Promise.all([
      getAllSubmissionsAPI(),
      getAllAssignmentsAPI(),
      getAllTestsAPI(),
    ]);

    if (subRes.success && subRes.submissions) {
      setSubmissions(subRes.submissions);
    }
    if (assignRes.success && assignRes.assignments) {
      setAssignments(assignRes.assignments);
    }
    if (testRes.success && testRes.tests) {
      setTests(testRes.tests);
    }

    setStudents(getCachedStudents());
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ============ GROUP SUBMISSIONS ============
  const groupedSubmissions: SubmissionGroup[] = (() => {
    const map = new Map<string, SubmissionGroup>();

    submissions.forEach((sub) => {
      if (!map.has(sub.assignmentId)) {
        const student = students.find(
          (s) =>
            s.username.toLowerCase() === sub.studentUsername.toLowerCase()
        );
        const test = tests.find((t) => t.testId === sub.testId);

        map.set(sub.assignmentId, {
          assignmentId: sub.assignmentId,
          studentUsername: sub.studentUsername,
          studentName: student?.name || sub.studentUsername,
          studentRollNo: student?.studentId || "—",
          testId: sub.testId,
          testName: test?.testName || sub.testId,
          submittedAt: sub.submittedAt,
          totalQuestions: 0,
          gradedCount: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          status: "pending",
        });
      }

      const group = map.get(sub.assignmentId)!;
      group.totalQuestions++;
      if (sub.status === "graded") {
        group.gradedCount++;
        group.obtainedMarks += sub.marksObtained || 0;
      }
    });

    map.forEach((group) => {
      if (group.gradedCount === group.totalQuestions) {
        group.status = "graded";
      } else if (group.gradedCount > 0) {
        group.status = "partial";
      } else {
        group.status = "pending";
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt)
    );
  })();

  const filteredGroups = groupedSubmissions.filter((g) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      g.studentName.toLowerCase().includes(term) ||
      g.studentUsername.toLowerCase().includes(term) ||
      g.studentRollNo.toLowerCase().includes(term) ||
      g.testName.toLowerCase().includes(term);

    const matchStatus = statusFilter === "all" || g.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // ============ OPEN GRADING ============
  const handleOpenGrade = async (group: SubmissionGroup) => {
    setActiveGroup(group);

    const testRes = await getTestByIdAPI(group.testId);
    if (testRes.success && testRes.test) {
      setActiveQuestions(testRes.test.questions || []);
    }

    const subs = submissions.filter(
      (s) => s.assignmentId === group.assignmentId
    );
    setActiveSubmissions(subs);

    const initialGrades: { [questionId: string]: number } = {};
    subs.forEach((s) => {
      initialGrades[s.questionId] =
        s.marksObtained !== null ? s.marksObtained : 0;
    });
    setGradeMap(initialGrades);

    setSaveMsg("");
    setScreen("grade");
  };

  const handleSaveGrades = async () => {
    if (!activeGroup) return;
    setIsSaving(true);
    setSaveMsg("");

    const updates = activeSubmissions.map((s) => ({
      submissionId: s.submissionId,
      marksObtained: gradeMap[s.questionId] || 0,
    }));

    const res = await gradeSubmissionAPI(updates);

    if (res.success) {
      setSaveMsg("✅ Grades saved successfully!");
      await loadAll();
      setTimeout(() => {
        setScreen("list");
        setActiveGroup(null);
        setSaveMsg("");
      }, 1200);
    } else {
      setSaveMsg(`❌ ${res.error || "Failed to save"}`);
    }

    setIsSaving(false);
  };

  const handleBackToList = () => {
    setScreen("list");
    setActiveGroup(null);
    setActiveQuestions([]);
    setActiveSubmissions([]);
    setGradeMap({});
    setSaveMsg("");
  };

  // ============ AI GRADING ============
  const handleAIGrade = async (group: SubmissionGroup) => {
    if (!group) return;

    // Step 1: Test load karo
    const testRes = await getTestByIdAPI(group.testId);
    if (!testRes.success || !testRes.test) {
      setAIMsg("❌ Test load nahi ho saka");
      setTimeout(() => setAIMsg(""), 3000);
      return;
    }

    // Step 2: Is assignment ke saare submissions
    const subs = submissions.filter(
      (s) => s.assignmentId === group.assignmentId
    );

    // Step 3: Sirf pending short/fill questions filter karo
    const questions = testRes.test.questions || [];
    const pendingItems: {
      questionId: string;
      questionText: string;
      questionType: "short" | "fill";
      correctAnswer: string;
      studentAnswer: string;
      maxMarks: number;
    }[] = [];

    questions.forEach((q) => {
      if (q.questionType !== "short" && q.questionType !== "fill") return;

      const sub = subs.find((s) => s.questionId === q.questionId);
      if (!sub) return;
      if (sub.status === "graded") return;

      pendingItems.push({
        questionId: q.questionId,
        questionText: q.question,
        questionType: q.questionType as "short" | "fill",
        correctAnswer: q.correct,
        studentAnswer: sub.studentAnswer || "",
        maxMarks: q.marks || 1,
      });
    });

    if (pendingItems.length === 0) {
      setAIMsg("ℹ️ Koi pending short/fill answers nahi hain");
      setTimeout(() => setAIMsg(""), 3000);
      return;
    }

    // Step 4: AI grade karo
    setIsAIGrading(true);
    setAIProgress({ done: 0, total: pendingItems.length });
    setAIMsg("");

    try {
      const aiResults = await aiGradeBatch(pendingItems, (done, total) => {
        setAIProgress({ done, total });
      });

      // Step 5: Grades save karo via Supabase (direct)
      const grades = aiResults.map((r) => ({
        assignmentId: group.assignmentId,
        questionId: r.questionId,
        marksObtained: r.marks,
        aiReason: r.reason,
        aiConfidence: r.confidence,
      }));

      const saveData = await saveAIGradesAPI(grades);

      if (saveData.success) {
        setAIMsg(
          `✅ AI ne ${pendingItems.length} answers check kar liye! (${
            saveData.updated || pendingItems.length
          } saved)`
        );
        await loadAll();
        setTimeout(() => setAIMsg(""), 4000);
      } else {
        setAIMsg(`❌ Save failed: ${saveData.error}`);
      }
    } catch (err) {
      console.error("AI grading error:", err);
      setAIMsg("❌ AI grading mein masla hua");
    }

    setIsAIGrading(false);
    setAIProgress({ done: 0, total: 0 });
  };

  // ============================================================
  //   RENDER — GRADING SCREEN
  // ============================================================
  if (screen === "grade" && activeGroup) {
    const totalObtained = Object.values(gradeMap).reduce(
      (sum, m) => sum + (m || 0),
      0
    );
    const totalPossible = activeQuestions.reduce(
      (sum, q) => sum + (q.marks || 1),
      0
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-display font-bold text-gray-900">
                Grading
              </span>
            </div>
            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 text-sm"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Grades
                </>
              )}
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {activeGroup.studentName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Student
                  </p>
                  <p className="font-bold text-gray-900 text-sm">
                    {activeGroup.studentName}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {activeGroup.studentRollNo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Test
                  </p>
                  <p className="font-bold text-gray-900 text-sm">
                    {activeGroup.testName}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Submitted:{" "}
                    {new Date(activeGroup.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Total Score
                  </p>
                  <p className="font-display font-bold text-gray-900 text-lg">
                    {totalObtained}{" "}
                    <span className="text-gray-400 text-sm">
                      / {totalPossible}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {saveMsg && (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-sm font-medium mb-5">
              {saveMsg}
            </div>
          )}

          <div className="space-y-4">
            {activeQuestions.map((q, index) => {
              const sub = activeSubmissions.find(
                (s) => s.questionId === q.questionId
              );
              const studentAnswer = sub?.studentAnswer || "";
              const maxMarks = q.marks || 1;
              const awarded = gradeMap[q.questionId] || 0;

              return (
                <div
                  key={q.questionId}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-100"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                      Q{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm leading-relaxed mb-2">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold uppercase">
                          {q.questionType === "mcq" && "MCQ"}
                          {q.questionType === "short" && "Short"}
                          {q.questionType === "fill" && "Fill Blank"}
                          {q.questionType === "truefalse" && "True/False"}
                        </span>
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-semibold">
                          {maxMarks} marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MCQ OPTIONS DISPLAY */}
                  {q.questionType === "mcq" && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(["A", "B", "C", "D"] as const).map((letter) => {
                        const optText =
                          q[`option${letter}` as keyof APIQuestion] || "";
                        const isCorrectAnswer =
                          q.correct.toUpperCase() === letter;
                        const isStudentAnswer =
                          studentAnswer.toUpperCase() === letter;

                        return (
                          <div
                            key={letter}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 ${
                              isCorrectAnswer
                                ? "bg-green-50 border-green-300"
                                : isStudentAnswer
                                ? "bg-red-50 border-red-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isCorrectAnswer
                                  ? "bg-green-600 text-white"
                                  : isStudentAnswer
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="text-xs text-gray-800 font-medium flex-1">
                              {optText}
                            </span>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {isStudentAnswer && !isCorrectAnswer && (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE/FALSE DISPLAY */}
                  {q.questionType === "truefalse" && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(["TRUE", "FALSE"] as const).map((val) => {
                        const isCorrectAnswer =
                          q.correct.toUpperCase() === val;
                        const isStudentAnswer =
                          studentAnswer.toUpperCase() === val;

                        return (
                          <div
                            key={val}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 ${
                              isCorrectAnswer
                                ? "bg-green-50 border-green-300"
                                : isStudentAnswer
                                ? "bg-red-50 border-red-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="text-xs font-bold text-gray-800">
                              {val}
                            </span>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {isStudentAnswer && !isCorrectAnswer && (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SHORT / FILL ANSWER COMPARISON */}
                  {(q.questionType === "short" ||
                    q.questionType === "fill") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-900 uppercase mb-1">
                          Student's Answer
                        </p>
                        <p className="text-sm text-gray-800 font-medium break-words">
                          {studentAnswer || (
                            <span className="text-gray-400 italic">
                              Not answered
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-[10px] font-bold text-green-900 uppercase mb-1">
                          Correct Answer
                        </p>
                        <p className="text-sm text-gray-800 font-medium break-words">
                          {q.correct || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-600 uppercase">
                      Award Marks:
                    </p>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: maxMarks + 1 }, (_, i) => i).map(
                        (m) => (
                          <button
                            key={m}
                            onClick={() =>
                              setGradeMap((prev) => ({
                                ...prev,
                                [q.questionId]: m,
                              }))
                            }
                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                              awarded === m
                                ? "bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-md scale-110"
                                : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                            }`}
                          >
                            {m}
                          </button>
                        )
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">
                      {awarded} / {maxMarks}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleBackToList}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Grades
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  //   RENDER — LIST SCREEN
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <span className="font-display font-bold text-gray-900">
              Results & Submissions
            </span>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* AI PROGRESS MODAL */}
        {isAIGrading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                AI Checking Answers...
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Please wait, AI sab answers check kar raha hai
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      aiProgress.total > 0
                        ? (aiProgress.done / aiProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 font-semibold">
                {aiProgress.done} / {aiProgress.total} checked
              </p>
            </div>
          </div>
        )}

        {/* AI MESSAGE */}
        {aiMsg && (
          <div className="mb-4 px-4 py-3 bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-2xl text-sm font-medium">
            {aiMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student, roll no, or test..."
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "pending" | "graded" | "partial"
                )
              }
              className="pl-11 pr-8 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partially Graded</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SmallStat
            icon={<ClipboardList className="w-4 h-4" />}
            label="Total"
            value={groupedSubmissions.length.toString()}
          />
          <SmallStat
            icon={<Clock className="w-4 h-4" />}
            label="Pending"
            value={groupedSubmissions
              .filter((g) => g.status === "pending")
              .length.toString()}
          />
          <SmallStat
            icon={<AlertCircle className="w-4 h-4" />}
            label="Partial"
            value={groupedSubmissions
              .filter((g) => g.status === "partial")
              .length.toString()}
          />
          <SmallStat
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Graded"
            value={groupedSubmissions
              .filter((g) => g.status === "graded")
              .length.toString()}
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading submissions...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">
              {groupedSubmissions.length === 0
                ? "No submissions yet"
                : "No submissions match your filter"}
            </p>
            <p className="text-gray-400 text-sm">
              {groupedSubmissions.length === 0
                ? "Students' submissions will appear here once they take a test."
                : "Try changing the search or filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <div
                key={group.assignmentId}
                onClick={() => handleOpenGrade(group)}
                className="group w-full text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                    {group.studentName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold text-gray-900 text-sm truncate">
                        {group.studentName}
                      </h3>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {group.studentRollNo}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      <BookOpen className="w-3 h-3 inline mr-1" />
                      {group.testName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Submitted:{" "}
                      {new Date(group.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={group.status} />
                    <span className="text-[10px] text-gray-500">
                      {group.gradedCount}/{group.totalQuestions} graded
                    </span>

                    {/* AI CHECK BUTTON */}
                    {(group.status === "pending" ||
                      group.status === "partial") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAIGrade(group);
                        }}
                        disabled={isAIGrading}
                        className="mt-1 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-[10px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Check
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ==================== SMALL STAT ====================
function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
          {icon}
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase">
          {label}
        </span>
      </div>
      <p className="font-display text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ==================== STATUS BADGE ====================
function StatusBadge({
  status,
}: {
  status: "pending" | "graded" | "partial";
}) {
  if (status === "graded") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
        <CheckCircle2 className="w-3 h-3" />
        Graded
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
        <AlertCircle className="w-3 h-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}