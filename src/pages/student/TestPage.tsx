import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  X,
  BookOpen,
  Target,
  User,
  Hash,
} from "lucide-react";
import type { Student } from "../../types";
import type { APIAssignment, APIQuestion } from "../../utils/api";
import { getTestByIdAPI, submitTestAPI } from "../../utils/api";

interface TestPageProps {
  student: Student;
  assignment: APIAssignment;
  onSubmitSuccess: () => void;
  onLogout: () => void;
}

type AnswerMap = { [questionId: string]: string };

interface APITest {
  testId: string;
  testName: string;
  duration: number;
  active: boolean;
  createdAt: string;
  questions?: APIQuestion[];
}

export default function TestPage({
  student,
  assignment,
  onSubmitSuccess,
}: TestPageProps) {
  const [test, setTest] = useState<APITest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    setLoading(true);
    setError("");

    const res = await getTestByIdAPI(assignment.testId);

    if (!res.success || !res.test) {
      setError(res.error || "Failed to load test");
      setLoading(false);
      return;
    }

    setTest(res.test as APITest);
    setTimeLeft((res.test.duration || 30) * 60);

    const savedKey = `test_answers_${assignment.assignmentId}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {
        setAnswers({});
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!test || loading) return;
    const savedKey = `test_answers_${assignment.assignmentId}`;
    localStorage.setItem(savedKey, JSON.stringify(answers));
  }, [answers, test, loading, assignment.assignmentId]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !test) return;
    setIsSubmitting(true);

    const answersArray = (test.questions || []).map((q) => ({
      questionId: q.questionId,
      studentAnswer: answers[q.questionId] || "",
    }));

    const res = await submitTestAPI({
      assignmentId: assignment.assignmentId,
      testId: assignment.testId,
      username: student.username,
      answers: answersArray,
    });

    if (res.success) {
      const savedKey = `test_answers_${assignment.assignmentId}`;
      localStorage.removeItem(savedKey);
      onSubmitSuccess();
    } else {
      setIsSubmitting(false);
      alert("Submit failed: " + (res.error || "Unknown error"));
    }
  }, [
    answers,
    test,
    student,
    assignment,
    isSubmitting,
    onSubmitSuccess,
  ]);

  useEffect(() => {
    if (loading || !test || timeLeft <= 0) return;

    if (timeLeft === 0) {
      handleSubmit();
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, test, timeLeft, handleSubmit]);

  const handleSelectMCQ = (questionId: string, letter: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleShortAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQ(index);
    setAnimateKey((k) => k + 1);
  };

  const handleNext = () => {
    if (test && currentQ < (test.questions?.length || 0) - 1) {
      goToQuestion(currentQ + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) goToQuestion(currentQ - 1);
  };

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 text-lg mb-2">
            Error
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {error || "Test not found"}
          </p>
          <button
            onClick={onSubmitSuccess}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const questions = test.questions || [];
  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] && answers[k].trim() !== ""
  ).length;
  const isLast = currentQ === questions.length - 1;
  const isFirst = currentQ === 0;
  const isTimeLow = timeLeft < 60;
  const isTimeWarning = timeLeft < 300 && timeLeft >= 60;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <header className="relative z-20 flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-gray-900 text-sm truncate">
                  {test.testName}
                </h1>
                <p className="text-[10px] text-gray-500 flex items-center gap-2 truncate">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {student.name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {student.rollNo}
                  </span>
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm transition-all shadow-sm flex-shrink-0 ${
                isTimeLow
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
                  : isTimeWarning
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                  : "bg-gradient-to-r from-green-600 to-blue-600 text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {currentQ + 1}
            </div>
            <span className="text-xs text-gray-600 font-medium">
              of <strong className="text-gray-900">{questions.length}</strong>{" "}
              questions
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-100">
              <CheckCircle2 className="w-3 h-3" />
              {answeredCount} Answered
            </div>
            <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold border border-gray-200">
              <Circle className="w-3 h-3" />
              {questions.length - answeredCount} Left
            </div>
          </div>
        </div>

        <div
          key={animateKey}
          className="flex-1 bg-white rounded-2xl shadow-lg p-6 md:p-7 border border-gray-100 animate-slide-up overflow-y-auto min-h-0"
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              Q{currentQ + 1}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg md:text-xl font-bold text-gray-900 leading-relaxed pt-1.5">
                {q.question}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold uppercase">
                  {q.questionType === "mcq" && "Multiple Choice"}
                  {q.questionType === "short" && "Short Answer"}
                  {q.questionType === "fill" && "Fill in the Blank"}
                  {q.questionType === "truefalse" && "True / False"}
                </span>
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-semibold">
                  {q.marks} {q.marks === 1 ? "mark" : "marks"}
                </span>
              </div>
            </div>
          </div>

          {q.questionType === "mcq" && (
            <div className="space-y-3">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const optionText =
                  q[`option${letter}` as keyof APIQuestion] || "";
                const isSelected = answers[q.questionId] === letter;

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectMCQ(q.questionId, letter)}
                    className={`group w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      isSelected
                        ? "border-green-600 bg-gradient-to-r from-green-50 to-blue-50 shadow-md scale-[1.01]"
                        : "border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:scale-[1.005]"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-md scale-110"
                          : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                      }`}
                    >
                      {letter}
                    </div>

                    <span
                      className={`text-gray-800 text-base flex-1 ${
                        isSelected ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {optionText}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 animate-scale-in" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {q.questionType === "truefalse" && (
            <div className="space-y-3">
              {(["TRUE", "FALSE"] as const).map((val) => {
                const isSelected =
                  (answers[q.questionId] || "").toUpperCase() === val;

                return (
                  <button
                    key={val}
                    onClick={() => handleSelectMCQ(q.questionId, val)}
                    className={`group w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      isSelected
                        ? "border-green-600 bg-gradient-to-r from-green-50 to-blue-50 shadow-md scale-[1.01]"
                        : "border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:scale-[1.005]"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-md scale-110"
                          : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                      }`}
                    >
                      {val === "TRUE" ? "T" : "F"}
                    </div>

                    <span
                      className={`text-gray-800 text-lg flex-1 font-bold ${
                        isSelected ? "text-green-700" : ""
                      }`}
                    >
                      {val}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 animate-scale-in" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(q.questionType === "short" || q.questionType === "fill") && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                {q.questionType === "fill" ? "Fill in the Blank" : "Your Answer"}
              </label>
              <textarea
                value={answers[q.questionId] || ""}
                onChange={(e) =>
                  handleShortAnswer(q.questionId, e.target.value)
                }
                placeholder={
                  q.questionType === "fill"
                    ? "Type the word/phrase that fills the blank..."
                    : "Type your answer here..."
                }
                rows={q.questionType === "fill" ? 2 : 5}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm text-gray-800 placeholder-gray-400 font-medium resize-none"
                autoFocus
              />
              <p className="text-[10px] text-gray-500 mt-2">
                {q.questionType === "fill"
                  ? "Tip: Type only the word or phrase that goes in the blank."
                  : "Tip: Write your answer clearly and completely."}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 my-4 flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 rounded-2xl font-semibold border-2 border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-green-300 hover:bg-gray-50 transition-all shadow-sm text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {isLast ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-sm"
            >
              <Send className="w-4 h-4" />
              Submit Test
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-shrink-0 bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-2">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-green-600" />
              <p className="text-xs font-bold text-gray-800">
                Question Palette
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-600 rounded" /> Current
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-200 rounded" /> Not Visited
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
            {questions.map((question, index) => {
              const isAnswered =
                answers[question.questionId] &&
                answers[question.questionId].trim() !== "";
              const isCurrent = index === currentQ;

              return (
                <button
                  key={question.questionId}
                  onClick={() => goToQuestion(index)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-md ring-2 ring-green-200 scale-110"
                      : isAnswered
                      ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-sm hover:scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Submit Test?
            </h3>
            <p className="text-gray-600 text-xs mb-5">
              Please review your answers before submitting. You cannot change
              them after submission.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600 mb-1.5" />
                <p className="text-[10px] text-gray-500 font-medium">
                  Answered
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {answeredCount}
                </p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <Circle className="w-5 h-5 text-orange-600 mb-1.5" />
                <p className="text-[10px] text-gray-500 font-medium">
                  Skipped
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {questions.length - answeredCount}
                </p>
              </div>
            </div>

            {answeredCount < questions.length && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mb-5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  <strong>{questions.length - answeredCount}</strong>{" "}
                  questions are still unanswered!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Yes, Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}