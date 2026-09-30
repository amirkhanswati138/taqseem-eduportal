import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Edit,
  Trash2,
  X,
  Save,
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import type { APIStudent } from "../../utils/api";
import {
  addStudentAPI,
  updateStudentAPI,
  deleteStudentAPI,
} from "../../utils/api";
import {
  getCachedStudents,
  syncDatabase,
  getSyncTime,
} from "../../utils/studentCache";

interface StudentsManagerProps {
  onBack: () => void;
}

const emptyForm: APIStudent = {
  studentId: "",
  name: "",
  fatherName: "",
  classBatch: "",
  course: "",
  username: "",
  password: "",
};

export default function StudentsManager({ onBack }: StudentsManagerProps) {
  const [students, setStudents] = useState<APIStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [form, setForm] = useState<APIStudent>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const reload = () => {
    setStudents(getCachedStudents());
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage("");
    const result = await syncDatabase();
    if (result.success) {
      setSyncMessage(`✅ ${result.count} students synced successfully!`);
      reload();
      setTimeout(() => setSyncMessage(""), 4000);
    } else {
      setSyncMessage(`❌ ${result.error}`);
    }
    setIsSyncing(false);
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingUsername(null);
    setFormError("");
    setShowForm(true);
  };

  const handleOpenEdit = (student: APIStudent) => {
    setForm(student);
    setEditingUsername(student.username);
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUsername(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (field: keyof APIStudent, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.studentId.trim() ||
      !form.name.trim() ||
      !form.fatherName.trim() ||
      !form.classBatch.trim() ||
      !form.course.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      setFormError("All fields are required!");
      return;
    }

    setIsSaving(true);

    const cleanForm: APIStudent = {
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      fatherName: form.fatherName.trim(),
      classBatch: form.classBatch.trim(),
      course: form.course.trim(),
      username: form.username.trim().toLowerCase(),
      password: form.password.trim(),
    };

    let result;
    if (editingUsername) {
      result = await updateStudentAPI(editingUsername, cleanForm);
    } else {
      result = await addStudentAPI(cleanForm);
    }

    if (!result.success) {
      setFormError(result.error || "Something went wrong");
      setIsSaving(false);
      return;
    }

    await syncDatabase();
    reload();
    setIsSaving(false);
    handleCloseForm();
  };

  const handleDelete = async (username: string) => {
    const result = await deleteStudentAPI(username);
    if (result.success) {
      await syncDatabase();
      reload();
    }
    setDeleteConfirm(null);
  };

  const filtered = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term) ||
      s.classBatch.toLowerCase().includes(term)
    );
  });

  const syncTime = getSyncTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-display font-bold text-gray-900">
              Students Manager
            </span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add Student
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {isSyncing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Sync Database
              </>
            )}
          </button>

          <div className="flex-1" />

          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-indigo-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-2xl text-sm font-medium">
            {syncMessage}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            Total: <strong className="text-gray-900">{students.length}</strong>{" "}
            students
            {searchTerm && ` • Showing ${filtered.length}`}
          </p>
          {syncTime && (
            <p className="text-xs text-gray-400">
              Last sync: {new Date(syncTime).toLocaleString()}
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">
              {students.length === 0
                ? "No students yet"
                : "No students found"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {students.length === 0
                ? "Click 'Add Student' or 'Sync Database' to get started"
                : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase hidden md:table-cell">
                      Father
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase hidden md:table-cell">
                      Class/Batch
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">
                      Course
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">
                      Username
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((student) => (
                    <tr
                      key={student.username}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {student.fatherName}
                      </td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                          {student.classBatch}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {student.course}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {student.username}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student.username)}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                  {editingUsername ? (
                    <Edit className="w-5 h-5 text-white" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900 text-lg">
                    {editingUsername ? "Edit Student" : "Add New Student"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingUsername
                      ? "Update student details"
                      : "Add a new student to the database"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseForm}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Student-ID"
                  value={form.studentId}
                  onChange={(v) => handleFormChange("studentId", v)}
                  placeholder="TF-01"
                />
                <FormField
                  label="Name"
                  value={form.name}
                  onChange={(v) => handleFormChange("name", v)}
                  placeholder="Amir"
                />
                <FormField
                  label="Father/Guardian Name"
                  value={form.fatherName}
                  onChange={(v) => handleFormChange("fatherName", v)}
                  placeholder="Muhammad Khan"
                />
                <FormField
                  label="Class/Batch"
                  value={form.classBatch}
                  onChange={(v) => handleFormChange("classBatch", v)}
                  placeholder="Computer Batch #01"
                />
                <FormField
                  label="Course"
                  value={form.course}
                  onChange={(v) => handleFormChange("course", v)}
                  placeholder="Basic"
                />
                <FormField
                  label="Username"
                  value={form.username}
                  onChange={(v) => handleFormChange("username", v)}
                  placeholder="amir@taqseem"
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Password"
                    value={form.password}
                    onChange={(v) => handleFormChange("password", v)}
                    placeholder="amir123"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingUsername ? "Update" : "Add Student"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Delete Student?
            </h3>
            <p className="text-gray-600 text-sm mb-5">
              This student will be permanently removed from the database. Are
              you sure?
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

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-800"
      />
    </div>
  );
}