import type { APIStudent } from "./api";
import { getAllStudentsAPI } from "./api";

// ==================== KEYS ====================
const CACHE_KEY = "students_cache";
const CACHE_TIME_KEY = "students_cache_time";

// ==================== TYPES ====================
interface CachedData {
  students: APIStudent[];
  count: number;
  syncedAt: string;
}

// ==================== SAVE ====================
export const saveToCache = (students: APIStudent[]): void => {
  const data: CachedData = {
    students,
    count: students.length,
    syncedAt: new Date().toISOString(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, data.syncedAt);
};

// ==================== GET ====================
export const getFromCache = (): CachedData | null => {
  const data = localStorage.getItem(CACHE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as CachedData;
  } catch {
    return null;
  }
};

export const getCachedStudents = (): APIStudent[] => {
  const cache = getFromCache();
  return cache?.students || [];
};

export const getSyncTime = (): string | null => {
  return localStorage.getItem(CACHE_TIME_KEY);
};

export const hasCache = (): boolean => {
  return getCachedStudents().length > 0;
};

// ==================== SYNC DATABASE ====================
export const syncDatabase = async (): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> => {
  try {
    const response = await getAllStudentsAPI();

    console.log("🔍 Sync response:", response);

    if (!response.success || !response.students) {
      return {
        success: false,
        error: response.error || "Sync failed",
      };
    }

    const studentsWithPassword = response.students.map((s) => ({
      ...s,
      password: s.password || "",
    }));

    console.log("✅ Students loaded:", studentsWithPassword.length);

    saveToCache(studentsWithPassword);
    return { success: true, count: studentsWithPassword.length };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, error: "Sync mein masla hua" };
  }
};

// ==================== CLEAR ====================
export const clearCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
};