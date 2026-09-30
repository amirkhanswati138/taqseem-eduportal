// ==================== CONFIG ====================
const EDGE_FUNCTION_URL =
  "https://pwxthzhqgdlvwibchymh.supabase.co/functions/v1/grade-with-ai";

const SUPABASE_ANON_KEY =
  "sb_publishable_KGTi1QMAwIA7aHYEah31Dw_d0VuzOTy";

// ==================== TYPES ====================
export interface AIGradeResult {
  questionId: string;
  marks: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

// ==================== SINGLE ANSWER GRADE ====================
async function aiGradeSingle(item: {
  questionId: string;
  questionText: string;
  questionType: "short" | "fill";
  correctAnswer: string;
  studentAnswer: string;
  maxMarks: number;
}): Promise<AIGradeResult> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        questionText: item.questionText,
        questionType: item.questionType,
        correctAnswer: item.correctAnswer,
        studentAnswer: item.studentAnswer,
        maxMarks: item.maxMarks,
      }),
    });

    const data = await response.json();

    if (data.success && data.result) {
      return {
        questionId: item.questionId,
        marks: Math.max(
          0,
          Math.min(item.maxMarks, Number(data.result.marks) || 0)
        ),
        confidence: data.result.confidence || "medium",
        reason: data.result.reason || "Auto-graded",
      };
    } else {
      return {
        questionId: item.questionId,
        marks: 0,
        confidence: "low",
        reason: data.error || "AI failed — manual review needed",
      };
    }
  } catch (error) {
    console.error(`AI grading failed for ${item.questionId}:`, error);
    return {
      questionId: item.questionId,
      marks: 0,
      confidence: "low",
      reason: "AI failed — manual review needed",
    };
  }
}

// ==================== BATCH GRADE ====================
export async function aiGradeBatch(
  items: {
    questionId: string;
    questionText: string;
    questionType: "short" | "fill";
    correctAnswer: string;
    studentAnswer: string;
    maxMarks: number;
  }[],
  onProgress?: (done: number, total: number) => void
): Promise<AIGradeResult[]> {
  const results: AIGradeResult[] = [];
  const total = items.length;
  const concurrency = 3;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item) => aiGradeSingle(item))
    );

    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + concurrency, total), total);
    }

    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}