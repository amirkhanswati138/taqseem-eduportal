import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Users,
  BookOpen,
  Circle,
  Search,
} from "lucide-react";
import type { APITest, APIQuestion } from "../../utils/api";
import {
  getAllTestsAPI,
  addTestAPI,
  updateTestAPI,
  deleteTestAPI,
  assignTestAPI,
  getTestByIdAPI,
} from "../../utils/api";
import { getCachedStudents } from "../../utils/studentCache";

interface AssessmentManagerProps {
  onBack: () => void;
}

type Screen = "list" | "builder" | "assign";

const emptyQuestion = (order: number): APIQuestion => ({
  questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  testId: "",
  questionType: "mcq",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correct: "A",
  marks: 1,
  order,
});

export default function AssessmentManager({
  onBack,
}: AssessmentManagerProps) {
  const [screen, setScreen] = useState<Screen>("list");
  const [tests, setTests] = useState<APITest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [form, setForm] = useState<APITest>({
    testId: "",
    testName: "",
    duration: 30,
    active: true,
    createdAt: "",
    questions: [],
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [assignTestId, setAssignTestId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadTests = async () => {
    setLoading(true);
    const res = await getAllTestsAPI();
    if (res.success && res.tests) {
      setTests(res.tests);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleCreateNew = () => {
    setEditingTestId(null);
    setForm({
      testId: `test_${Date.now()}`,
      testName: "",
      duration: 30,
      active: true,
      createdAt: "",
      questions: [emptyQuestion(1)],
    });
    setFormError("");
    setScreen("builder");
  };

  const handleEdit = async (testId: string) => {
    setLoading(true);
    const res = await getTestByIdAPI(testId);
    setLoading(false);

    if (!res.success || !res.test) {
      alert("Failed to load test");
      return;
    }

    setEditingTestId(testId);
    setForm({
      ...res.test,
      questions: res.test.questions || [],
    });
    setFormError("");
    setScreen("builder");
  };

  const handleDelete = async (testId: string) => {
    const res = await deleteTestAPI(testId);
    if (res.success) {
      loadTests();
    }
    setDeleteConfirm(null);
  };

  const updateField = <K extends keyof APITest>(
    field: K,
    value: APITest[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (
    index: number,
    field: keyof APIQuestion,
    value: any
  ) => {
    setForm((prev) => {
      const questions = [...(prev.questions || [])];
      questions[index] = { ...questions[index], [field]: value };
      return { ...prev, questions };
    });
  };

  const addQuestion = (type: "mcq" | "short" | "fill" | "truefalse") => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        {
          ...emptyQuestion((prev.questions?.length || 0) + 1),
          questionType: type,
          correct:
            type === "truefalse" ? "TRUE" : type === "mcq" ? "A" : "",
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => {
      const questions = [...(prev.questions || [])];
      questions.splice(index, 1);
      return { ...prev, questions };
    });
  };

  const handleSave = async () => {
    setFormError("");

    if (!form.testName.trim()) {
      setFormError("Test name is required");
      return;
    }

    if (!form.questions || form.questions.length === 0) {
      setFormError("At least one question is required");
      return;
    }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) {
        setFormError(`Question ${i + 1} is empty`);
        return;
      }

      if (q.questionType === "mcq") {
        if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
          setFormError(`Question ${i + 1}: All 4 options required`);
          return;
        }
        if (!["A", "B", "C", "D"].includes(q.correct.toUpperCase())) {
          setFormError(`Question ${i + 1}: Correct must be A, B, C, or D`);
          return;
        }
      } else if (q.questionType === "truefalse") {
        if (!["TRUE", "FALSE"].includes(q.correct.toUpperCase())) {
          setFormError(`Question ${i + 1}: Correct must be True or False`);
          return;
        }
      } else {
        if (!q.correct.trim()) {
          setFormError(`Question ${i + 1}: Correct answer required`);
          return;
        }
      }
    }

    setIsSaving(true);

    const cleanForm: APITest = {
      ...form,
      testName: form.testName.trim(),
      questions: form.questions.map((q, i) => ({
        ...q,
        testId: form.testId,
        order: i + 1,
        marks: q.marks || 1,
      })),
    };

    let res;
    if (editingTestId) {
      res = await updateTestAPI(editingTestId, cleanForm);
    } else {
      res = await addTestAPI(cleanForm);
    }

    setIsSaving(false);

    if (!res.success) {
      setFormError(res.error || "Something went wrong");
      return;
    }

    await loadTests();
    setScreen("list");
  };

  const handleOpenAssign = (testId: string) => {
    setAssignTestId(testId);
    setSelectedStudents([]);
    setAssignMsg("");
    setScreen("assign");
  };

  const toggleStudent = (username: string) => {
    setSelectedStudents((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleAssignSubmit = async () => {
    if (!assignTestId || selectedStudents.length === 0) {
      setAssignMsg("Please select at least one student");
      return;
    }

    setIsAssigning(true);
    const res = await assignTestAPI(assignTestId, selectedStudents);
    setIsAssigning(false);

    if (res.success) {
      setAssignMsg(`✅ Test assigned to ${selectedStudents.length} students!`);
      setTimeout(() => {
        setScreen("list");
        setSelectedStudents([]);
        setAssignMsg("");
      }, 1500);
    } else {
      setAssignMsg(`❌ ${res.error}`);
    }
  };

  const filteredTests = tests.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.testName.toLowerCase().includes(term) ||
      t.testId.toLowerCase().includes(term)
    );
  });

  if (screen === "builder") {
    return (
      <BuilderScreen
        form={form}
        editingTestId={editingTestId}
        formError={formError}
        isSaving={isSaving}
        onUpdateField={updateField}
        onUpdateQuestion={updateQuestion}
        onAddQuestion={addQuestion}
        onRemoveQuestion={removeQuestion}
        onSave={handleSave}
        onCancel={() => setScreen("list")}
      />
    );
  }

  if (screen === "assign" && assignTestId) {
    return (
      <AssignScreen
        testId={assignTestId}
        tests={tests}
        selectedStudents={selectedStudents}
        assignMsg={assignMsg}
        isAssigning={isAssigning}
        onToggleStudent={toggleStudent}
        onAssign={handleAssignSubmit}
        onCancel={() => setScreen("list")}
      />
    );
  }

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
            <FileText className="w-5 h-5 text-green-600" />
            <span className="font-display font-bold text-gray-900">
              Assessment Manager
            </span>
          </div>
          <button
            onClick={loadTests}
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
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New Test
          </button>

          <div className="flex-1" />

          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            Total:{" "}
            <strong className="text-gray-900">{tests.length}</strong>{" "}
            assessments
            {searchTerm && ` • Showing ${filteredTests.length}`}
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Loading tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">
              {tests.length === 0 ? "No tests yet" : "No tests found"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {tests.length === 0
                ? "Click 'Create New Test' to get started"
                : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTests.map((test) => (
              <TestCard
                key={test.testId}
                test={test}
                onEdit={() => handleEdit(test.testId)}
                onDelete={() => setDeleteConfirm(test.testId)}
                onAssign={() => handleOpenAssign(test.testId)}
              />
            ))}
          </div>
        )}
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Delete Test?
            </h3>
            <p className="text-gray-600 text-sm mb-5">
              This test and all its questions will be deleted. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== TEST CARD ====================
function TestCard({
  test,
  onEdit,
  onDelete,
  onAssign,
}: {
  test: APITest;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-gray-900 text-base mb-1 truncate">
              {test.testName}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {test.duration} min
              </span>
              <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                {test.testId}
              </span>
              {test.active ? (
                <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  <Circle className="w-3 h-3" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAssign}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-all border border-blue-100"
            title="Assign to students"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign
          </button>
          <button
            onClick={onEdit}
            className="w-9 h-9 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl flex items-center justify-center transition-all border border-green-100"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-all border border-red-100"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== BUILDER SCREEN ====================
function BuilderScreen({
  form,
  editingTestId,
  formError,
  isSaving,
  onUpdateField,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onSave,
  onCancel,
}: {
  form: APITest;
  editingTestId: string | null;
  formError: string;
  isSaving: boolean;
  onUpdateField: <K extends keyof APITest>(field: K, value: APITest[K]) => void;
  onUpdateQuestion: (
    index: number,
    field: keyof APIQuestion,
    value: any
  ) => void;
  onAddQuestion: (type: "mcq" | "short" | "fill" | "truefalse") => void;
  onRemoveQuestion: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const totalMarks = (form.questions || []).reduce(
    (sum, q) => sum + (q.marks || 1),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-green-600" />
            <span className="font-display font-bold text-gray-900">
              {editingTestId ? "Edit Test" : "Create New Test"}
            </span>
          </div>
          <button
            onClick={onSave}
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
                Save Test
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4">
            Test Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                Test Name
              </label>
              <input
                type="text"
                value={form.testName}
                onChange={(e) => onUpdateField("testName", e.target.value)}
                placeholder="e.g. Math Chapter 1 Quiz"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                Duration (min)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) =>
                  onUpdateField("duration", Number(e.target.value) || 0)
                }
                min={1}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-3">
              <button
                onClick={() => onUpdateField("active", !form.active)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                  form.active
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {form.active ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                {form.active ? "Active" : "Inactive"}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700">
                  {form.questions?.length || 0}
                </span>
                Questions
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700">{totalMarks}</span>
                Total Marks
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900 text-sm">
              Questions
            </h3>
            <span className="text-xs text-gray-500">
              {form.questions?.length || 0} questions
            </span>
          </div>

          <div className="space-y-4">
            {(form.questions || []).map((q, index) => (
              <QuestionEditor
                key={q.questionId}
                question={q}
                index={index}
                onUpdate={(field, value) =>
                  onUpdateQuestion(index, field, value)
                }
                onRemove={() => onRemoveQuestion(index)}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5 pt-5 border-t border-gray-100">
            <button
              onClick={() => onAddQuestion("mcq")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 text-green-700 border-2 border-green-200 rounded-xl font-bold text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              MCQ
            </button>
            <button
              onClick={() => onAddQuestion("short")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 border-2 border-blue-200 rounded-xl font-bold text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Short
            </button>
            <button
              onClick={() => onAddQuestion("fill")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border-2 border-purple-200 rounded-xl font-bold text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Fill Blank
            </button>
            <button
              onClick={() => onAddQuestion("truefalse")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 border-2 border-amber-200 rounded-xl font-bold text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              True/False
            </button>
          </div>
        </div>

        {formError && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
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
                {editingTestId ? "Update Test" : "Save Test"}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

// ==================== QUESTION EDITOR ====================
function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: APIQuestion;
  index: number;
  onUpdate: (field: keyof APIQuestion, value: any) => void;
  onRemove: () => void;
}) {
  const type = question.questionType;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border-2 border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
            Q{index + 1}
          </div>
          <select
            value={question.questionType}
            onChange={(e) => onUpdate("questionType", e.target.value)}
            className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-green-500"
          >
            <option value="mcq">MCQ</option>
            <option value="short">Short Answer</option>
            <option value="fill">Fill in the Blank</option>
            <option value="truefalse">True / False</option>
          </select>
        </div>

        <button
          onClick={onRemove}
          className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all border border-red-100"
          title="Remove question"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={question.question}
        onChange={(e) => onUpdate("question", e.target.value)}
        placeholder={
          type === "fill"
            ? "Type your sentence with blank (e.g. The capital of Pakistan is ______)"
            : "Type your question here..."
        }
        rows={2}
        className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-sm font-medium mb-3 resize-none"
      />

      {type === "mcq" && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const field = `option${letter}` as keyof APIQuestion;
              return (
                <div key={letter} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      question.correct.toUpperCase() === letter
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {letter}
                  </div>
                  <input
                    type="text"
                    value={(question[field] as string) || ""}
                    onChange={(e) => onUpdate(field, e.target.value)}
                    placeholder={`Option ${letter}`}
                    className="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
                  />
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                Correct Option
              </label>
              <div className="flex gap-1">
                {(["A", "B", "C", "D"] as const).map((letter) => (
                  <button
                    key={letter}
                    onClick={() => onUpdate("correct", letter)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      question.correct.toUpperCase() === letter
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-600 border-2 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                Marks
              </label>
              <input
                type="number"
                value={question.marks}
                onChange={(e) =>
                  onUpdate("marks", Number(e.target.value) || 1)
                }
                min={1}
                className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
              />
            </div>
          </div>
        </>
      )}

      {type === "short" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Correct Answer
            </label>
            <input
              type="text"
              value={question.correct}
              onChange={(e) => onUpdate("correct", e.target.value)}
              placeholder="Type the correct answer"
              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Marks
            </label>
            <input
              type="number"
              value={question.marks}
              onChange={(e) =>
                onUpdate("marks", Number(e.target.value) || 1)
              }
              min={1}
              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
            />
          </div>
        </div>
      )}

      {type === "fill" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Blank Answer
            </label>
            <input
              type="text"
              value={question.correct}
              onChange={(e) => onUpdate("correct", e.target.value)}
              placeholder="Word that fills the blank"
              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
            />
            <p className="text-[9px] text-gray-400 mt-1">
              Tip: Use ______ in question to show the blank
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Marks
            </label>
            <input
              type="number"
              value={question.marks}
              onChange={(e) =>
                onUpdate("marks", Number(e.target.value) || 1)
              }
              min={1}
              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
            />
          </div>
        </div>
      )}

      {type === "truefalse" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Correct Answer
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate("correct", "TRUE")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  question.correct.toUpperCase() === "TRUE"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-green-300"
                }`}
              >
                TRUE
              </button>
              <button
                onClick={() => onUpdate("correct", "FALSE")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  question.correct.toUpperCase() === "FALSE"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-green-300"
                }`}
              >
                FALSE
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
              Marks
            </label>
            <input
              type="number"
              value={question.marks}
              onChange={(e) =>
                onUpdate("marks", Number(e.target.value) || 1)
              }
              min={1}
              className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-green-500 outline-none transition-all text-xs font-medium"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ASSIGN SCREEN ====================
function AssignScreen({
  testId,
  tests,
  selectedStudents,
  assignMsg,
  isAssigning,
  onToggleStudent,
  onAssign,
  onCancel,
}: {
  testId: string;
  tests: APITest[];
  selectedStudents: string[];
  assignMsg: string;
  isAssigning: boolean;
  onToggleStudent: (username: string) => void;
  onAssign: () => void;
  onCancel: () => void;
}) {
  const test = tests.find((t) => t.testId === testId);
  const students = getCachedStudents();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            <span className="font-display font-bold text-gray-900">
              Assign Test
            </span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">
                Test
              </p>
              <p className="font-display font-bold text-gray-900">
                {test?.testName || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 border-2 border-green-100 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-700" />
            <span className="font-bold text-green-900 text-sm">
              {selectedStudents.length} students selected
            </span>
          </div>
          {selectedStudents.length > 0 && (
            <button
              onClick={() => selectedStudents.forEach((u) => onToggleStudent(u))}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-5">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {students.length === 0
                  ? "No students. Sync students first."
                  : "No students found"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {filteredStudents.map((s) => {
                const isSelected = selectedStudents.includes(s.username);
                return (
                  <button
                    key={s.username}
                    onClick={() => onToggleStudent(s.username)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left ${
                      isSelected ? "bg-green-50/50" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-green-600 border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {s.studentId} • {s.classBatch}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {assignMsg && (
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-sm font-medium mb-5">
            {assignMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isAssigning}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={isAssigning || selectedStudents.length === 0}
            className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isAssigning ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Assign to {selectedStudents.length} Students
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}