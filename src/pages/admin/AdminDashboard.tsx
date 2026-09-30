import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  UserPlus,
  LogOut,
  Database,
  FileText,
  BarChart3,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import {
  getCachedStudents,
  getSyncTime,
  syncDatabase,
} from "../../utils/studentCache";
import taqseemLogo from "../../assets/taqseemlogo.png";

interface AdminDashboardProps {
  onManageStudents: () => void;
  onManageAssessments: () => void;
  onViewResults: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  onManageStudents,
  onManageAssessments,
  onViewResults,
  onLogout,
}: AdminDashboardProps) {
  const [studentCount, setStudentCount] = useState(0);
  const [syncTime, setSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const refreshStats = () => {
    setStudentCount(getCachedStudents().length);
    setSyncTime(getSyncTime());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg("");

    const result = await syncDatabase();

    if (result.success) {
      setSyncMsg(`✅ ${result.count} students synced successfully!`);
      refreshStats();
      setTimeout(() => setSyncMsg(""), 4000);
    } else {
      setSyncMsg(`❌ ${result.error}`);
    }

    setIsSyncing(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* ==================== HEADER — WITH LOGO ==================== */}
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
                EduPortal • Admin
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

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex flex-col gap-5 overflow-hidden">
        {/* ==================== WELCOME CARD — NO LOGO ==================== */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg flex-shrink-0 bg-gradient-to-br from-green-600 to-blue-600">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full blur-2xl" />

          <div className="relative p-6 text-white">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3">
              <Shield className="w-3 h-3" />
              Administrator
            </div>

            <h2 className="font-display text-2xl font-bold mb-1">
              Welcome, Admin! 👋
            </h2>
            <p className="text-white/80 text-xs">
              Manage students, assessments, and results from here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Total Students"
            value={studentCount.toString()}
          />
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Assessments"
            value="—"
          />
          <StatCard
            icon={<Database className="w-4 h-4" />}
            label="Status"
            value="Active"
          />
        </div>

        <div className="flex-shrink-0 bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Student Database Sync
              </p>
              <p className="text-[10px] text-gray-500">
                {syncTime
                  ? `Last sync: ${new Date(syncTime).toLocaleString()}`
                  : "Not synced yet"}
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 text-sm"
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Database
              </>
            )}
          </button>
        </div>

        {syncMsg && (
          <div className="flex-shrink-0 bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-2.5 rounded-2xl text-xs font-medium">
            {syncMsg}
          </div>
        )}

        <div className="flex-shrink-0">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-3">
            Quick Actions
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <ActionCard
              icon={<UserPlus className="w-5 h-5 text-white" />}
              title="Manage Students"
              description="Add, edit, and delete students. Sync with database."
              onClick={onManageStudents}
              cta="Open →"
            />

            <ActionCard
              icon={<BarChart3 className="w-5 h-5 text-white" />}
              title="Manage Assessments"
              description="Create tests, add questions, and assign to students."
              onClick={onManageAssessments}
              cta="Open →"
            />

            <ActionCard
              icon={<ClipboardList className="w-5 h-5 text-white" />}
              title="Results & Grading"
              description="View submissions and grade students' answers."
              onClick={onViewResults}
              cta="Open →"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm mb-2">
        {icon}
      </div>
      <p className="text-[10px] text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="font-display text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  cta,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  cta: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group text-left bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 border border-gray-100 ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md ${
            !disabled && "group-hover:scale-110 transition-transform"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h4
            className={`font-display font-bold text-gray-900 text-sm mb-1 ${
              !disabled && "group-hover:text-green-700 transition-colors"
            }`}
          >
            {title}
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 font-semibold text-xs ${
          disabled ? "text-gray-400" : "text-green-700"
        }`}
      >
        {cta}
      </div>
    </button>
  );
}