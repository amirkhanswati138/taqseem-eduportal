import type { Student } from "../types";

// ==================== STORAGE KEYS ====================
const KEYS = {
  STUDENT: "current_student",
} as const;

// ==================== STUDENT SESSION ====================
// sessionStorage use kar rahe — refresh pe clear ho jayegi
// Isliye har refresh pe login karna parega

export const saveStudent = (student: Student): void => {
  sessionStorage.setItem(KEYS.STUDENT, JSON.stringify(student));
};

export const getStudent = (): Student | null => {
  const data = sessionStorage.getItem(KEYS.STUDENT);
  if (!data) return null;
  try {
    return JSON.parse(data) as Student;
  } catch {
    return null;
  }
};

export const clearStudent = (): void => {
  sessionStorage.removeItem(KEYS.STUDENT);
};