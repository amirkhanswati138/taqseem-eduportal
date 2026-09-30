import { supabase } from "./supabaseClient";

// ==================== CONFIG ====================
const EDGE_FUNCTION_URL =
  "https://pwxthzhqgdlvwibchymh.supabase.co/functions/v1/grade-with-ai";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ==================== TYPES ====================
export interface APIStudent {
  studentId: string;
  name: string;
  fatherName: string;
  classBatch: string;
  course: string;
  username: string;
  password: string;
}

export interface APIQuestion {
  questionId: string;
  testId: string;
  questionType: "mcq" | "short" | "fill" | "truefalse";
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correct: string;
  marks: number;
  order: number;
}

export interface APITest {
  testId: string;
  testName: string;
  duration: number;
  active: boolean;
  createdAt: string;
  questions?: APIQuestion[];
}

export interface APIAssignment {
  assignmentId: string;
  testId: string;
  testName?: string;
  duration?: number;
  studentUsername: string;
  assignedAt: string;
  status: "pending" | "in_progress" | "submitted" | "graded";
}

export interface APISubmission {
  submissionId: string;
  assignmentId: string;
  testId: string;
  studentUsername: string;
  questionId: string;
  studentAnswer: string;
  status: "pending" | "graded";
  marksObtained: number | null;
  submittedAt: string;
  gradedAt: string;
  aiReason?: string;
  aiConfidence?: string;
}

interface BaseResponse {
  success: boolean;
  error?: string;
  message?: string;
  count?: number;
  updated?: number;
}

// ==================== PING ====================
export const pingAPI = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from("students").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
};

// ==================== STUDENT API ====================
export const getAllStudentsAPI = async (): Promise<
  BaseResponse & { students?: APIStudent[] }
> => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("student_id", { ascending: true });

    if (error) throw error;

    const students: APIStudent[] = (data || []).map((s) => ({
      studentId: s.student_id || "",
      name: s.name || "",
      fatherName: s.father_name || "",
      classBatch: s.class_batch || "",
      course: s.course || "",
      username: s.username || "",
      password: s.password || "",
    }));

    return { success: true, students, count: students.length };
  } catch (err: any) {
    console.error("getAllStudentsAPI error:", err);
    return { success: false, error: err.message || "Failed to load students" };
  }
};

export const addStudentAPI = async (
  student: APIStudent
): Promise<BaseResponse> => {
  try {
    const { error } = await supabase.from("students").insert({
      student_id: student.studentId,
      name: student.name,
      father_name: student.fatherName,
      class_batch: student.classBatch,
      course: student.course,
      username: student.username,
      password: student.password,
    });

    if (error) throw error;
    return { success: true, message: "Student added" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add" };
  }
};

export const updateStudentAPI = async (
  originalUsername: string,
  student: APIStudent
): Promise<BaseResponse> => {
  try {
    const { error } = await supabase
      .from("students")
      .update({
        student_id: student.studentId,
        name: student.name,
        father_name: student.fatherName,
        class_batch: student.classBatch,
        course: student.course,
        username: student.username,
        password: student.password,
      })
      .eq("username", originalUsername);

    if (error) throw error;
    return { success: true, message: "Student updated" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update" };
  }
};

export const deleteStudentAPI = async (
  username: string
): Promise<BaseResponse> => {
  try {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("username", username);

    if (error) throw error;
    return { success: true, message: "Student deleted" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete" };
  }
};

// ==================== TEST API ====================
export const getAllTestsAPI = async (): Promise<
  BaseResponse & { tests?: APITest[] }
> => {
  try {
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tests: APITest[] = (data || []).map((t) => ({
      testId: t.test_id || "",
      testName: t.test_name || "",
      duration: t.duration || 30,
      active: t.active === true,
      createdAt: t.created_at || "",
    }));

    return { success: true, tests, count: tests.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load tests" };
  }
};

export const getTestByIdAPI = async (
  testId: string
): Promise<BaseResponse & { test?: APITest }> => {
  try {
    const { data: testData, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("test_id", testId)
      .single();

    if (testError) throw testError;

    const { data: qData, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("test_id", testId)
      .order("order", { ascending: true });

    if (qError) throw qError;

    const questions: APIQuestion[] = (qData || []).map((q) => ({
      questionId: q.question_id || "",
      testId: q.test_id || "",
      questionType: q.question_type || "mcq",
      question: q.question || "",
      optionA: q.option_a || "",
      optionB: q.option_b || "",
      optionC: q.option_c || "",
      optionD: q.option_d || "",
      correct: q.correct || "",
      marks: q.marks || 1,
      order: q.order || 0,
    }));

    return {
      success: true,
      test: {
        testId: testData.test_id,
        testName: testData.test_name,
        duration: testData.duration || 30,
        active: testData.active === true,
        createdAt: testData.created_at || "",
        questions,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Test not found" };
  }
};

export const addTestAPI = async (test: APITest): Promise<BaseResponse> => {
  try {
    const { error: testError } = await supabase.from("tests").insert({
      test_id: test.testId,
      test_name: test.testName,
      duration: test.duration || 30,
      active: test.active === true,
    });

    if (testError) throw testError;

    if (test.questions && test.questions.length > 0) {
      const questionsToInsert = test.questions.map((q, i) => ({
        question_id: q.questionId,
        test_id: test.testId,
        question_type: q.questionType,
        question: q.question,
        option_a: q.optionA || "",
        option_b: q.optionB || "",
        option_c: q.optionC || "",
        option_d: q.optionD || "",
        correct: q.correct,
        marks: q.marks || 1,
        order: q.order !== undefined ? q.order : i + 1,
      }));

      const { error: qError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (qError) throw qError;
    }

    return { success: true, message: "Test added" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add test" };
  }
};

export const updateTestAPI = async (
  originalTestId: string,
  test: APITest
): Promise<BaseResponse> => {
  try {
    const { error: testError } = await supabase
      .from("tests")
      .update({
        test_id: test.testId,
        test_name: test.testName,
        duration: test.duration || 30,
        active: test.active === true,
      })
      .eq("test_id", originalTestId);

    if (testError) throw testError;

    const { error: delError } = await supabase
      .from("questions")
      .delete()
      .eq("test_id", originalTestId);

    if (delError) throw delError;

    if (test.questions && test.questions.length > 0) {
      const questionsToInsert = test.questions.map((q, i) => ({
        question_id: q.questionId,
        test_id: test.testId,
        question_type: q.questionType,
        question: q.question,
        option_a: q.optionA || "",
        option_b: q.optionB || "",
        option_c: q.optionC || "",
        option_d: q.optionD || "",
        correct: q.correct,
        marks: q.marks || 1,
        order: q.order !== undefined ? q.order : i + 1,
      }));

      const { error: qError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (qError) throw qError;
    }

    return { success: true, message: "Test updated" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update test" };
  }
};

export const deleteTestAPI = async (
  testId: string
): Promise<BaseResponse> => {
  try {
    await supabase.from("questions").delete().eq("test_id", testId);

    const { error } = await supabase
      .from("tests")
      .delete()
      .eq("test_id", testId);

    if (error) throw error;
    return { success: true, message: "Test deleted" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete test" };
  }
};

// ==================== ASSIGNMENT API ====================
export const getAllAssignmentsAPI = async (): Promise<
  BaseResponse & { assignments?: APIAssignment[] }
> => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    const assignments: APIAssignment[] = (data || []).map((a) => ({
      assignmentId: a.assignment_id,
      testId: a.test_id,
      studentUsername: a.student_username,
      assignedAt: a.assigned_at || "",
      status: a.status || "pending",
    }));

    return { success: true, assignments, count: assignments.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load" };
  }
};

export const assignTestAPI = async (
  testId: string,
  studentUsernames: string[]
): Promise<BaseResponse> => {
  try {
    const { data: existing } = await supabase
      .from("assignments")
      .select("student_username")
      .eq("test_id", testId);

    const existingUsernames = (existing || []).map((a) =>
      a.student_username.toLowerCase()
    );

    const newAssignments = studentUsernames
      .filter((u) => !existingUsernames.includes(u.toLowerCase()))
      .map((username) => ({
        assignment_id: `as_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 6)}`,
        test_id: testId,
        student_username: username,
        status: "pending",
      }));

    if (newAssignments.length === 0) {
      return { success: true, message: "All already assigned" };
    }

    const { error } = await supabase.from("assignments").insert(newAssignments);

    if (error) throw error;
    return { success: true, message: `${newAssignments.length} assigned` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign" };
  }
};

export const removeAssignmentAPI = async (
  assignmentId: string
): Promise<BaseResponse> => {
  try {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("assignment_id", assignmentId);

    if (error) throw error;
    return { success: true, message: "Assignment removed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove" };
  }
};

// ==================== SUBMISSION API ====================
export const getAllSubmissionsAPI = async (): Promise<
  BaseResponse & { submissions?: APISubmission[] }
> => {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    const submissions: APISubmission[] = (data || []).map((s) => ({
      submissionId: s.submission_id || "",
      assignmentId: s.assignment_id || "",
      testId: s.test_id || "",
      studentUsername: s.student_username || "",
      questionId: s.question_id || "",
      studentAnswer: s.student_answer || "",
      status: s.status || "pending",
      marksObtained:
        s.marks_obtained === null || s.marks_obtained === undefined
          ? null
          : Number(s.marks_obtained),
      submittedAt: s.submitted_at || "",
      gradedAt: s.graded_at || "",
      aiReason: s.ai_reason || "",
      aiConfidence: s.ai_confidence || "",
    }));

    return { success: true, submissions, count: submissions.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load" };
  }
};

export const gradeSubmissionAPI = async (
  updates: { submissionId: string; marksObtained: number }[]
): Promise<BaseResponse> => {
  try {
    for (const u of updates) {
      const { error } = await supabase
        .from("submissions")
        .update({
          marks_obtained: u.marksObtained,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("submission_id", u.submissionId);

      if (error) throw error;
    }

    return {
      success: true,
      message: `${updates.length} graded`,
      updated: updates.length,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to grade" };
  }
};

// ==================== STUDENT-SIDE API ====================
export const getMyAssignmentsAPI = async (
  username: string
): Promise<BaseResponse & { assignments?: APIAssignment[] }> => {
  try {
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("*")
      .ilike("student_username", username);

    if (error) throw error;

    const testIds = (assignments || []).map((a) => a.test_id);
    let tests: any[] = [];
    if (testIds.length > 0) {
      const { data: testData } = await supabase
        .from("tests")
        .select("*")
        .in("test_id", testIds);
      tests = testData || [];
    }

    const result: APIAssignment[] = (assignments || []).map((a) => {
      const test = tests.find((t) => t.test_id === a.test_id);
      return {
        assignmentId: a.assignment_id,
        testId: a.test_id,
        testName: test?.test_name || "",
        duration: test?.duration || 0,
        status: a.status || "pending",
        assignedAt: a.assigned_at || "",
        studentUsername: a.student_username,
      };
    });

    return { success: true, assignments: result, count: result.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load" };
  }
};

export const submitTestAPI = async (data: {
  assignmentId: string;
  testId: string;
  username: string;
  answers: { questionId: string; studentAnswer: string }[];
}): Promise<BaseResponse> => {
  try {
    await supabase
      .from("assignments")
      .update({ status: "submitted" })
      .eq("assignment_id", data.assignmentId);

    const submissionId = `sub_${Date.now()}`;
    const rows = data.answers.map((a) => ({
      submission_id: submissionId,
      assignment_id: data.assignmentId,
      test_id: data.testId,
      student_username: data.username,
      question_id: a.questionId,
      student_answer: a.studentAnswer || "",
      status: "pending",
      submitted_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("submissions").insert(rows);

    if (error) throw error;
    return { success: true, message: "Test submitted" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit" };
  }
};

// ==================== AI GRADING (via Supabase Edge Function) ====================
export const gradeWithAIAPI = async (data: {
  questionText: string;
  questionType: "short" | "fill";
  correctAnswer: string;
  studentAnswer: string;
  maxMarks: number;
}): Promise<BaseResponse & { result?: any }> => {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const saveAIGradesAPI = async (
  grades: {
    assignmentId: string;
    questionId: string;
    marksObtained: number;
    aiReason?: string;
    aiConfidence?: string;
  }[]
): Promise<BaseResponse> => {
  try {
    let updated = 0;

    for (const g of grades) {
      const { error } = await supabase
        .from("submissions")
        .update({
          marks_obtained: g.marksObtained,
          status: "graded",
          graded_at: new Date().toISOString(),
          ai_reason: g.aiReason || "",
          ai_confidence: g.aiConfidence || "",
        })
        .eq("assignment_id", g.assignmentId)
        .eq("question_id", g.questionId);

      if (!error) updated++;
    }

    return { success: true, message: `${updated} saved`, updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save" };
  }
};