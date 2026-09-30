// ==================== SUPABASE EDGE FUNCTION ====================
// Grade with AI — calls Cloudflare Workers AI
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
const CLOUDFLARE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();

    const {
      questionText,
      questionType,
      correctAnswer,
      studentAnswer,
      maxMarks,
    } = body;

    if (!questionText || !correctAnswer) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "questionText and correctAnswer required",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `You are a FAIR and GENEROUS teacher grading a student's answer. Your goal is to REWARD understanding, not punish brevity.

QUESTION TYPE: ${questionType === "fill" ? "Fill in the blank" : "Short answer"}
QUESTION: ${questionText}
REFERENCE ANSWER: ${correctAnswer}
STUDENT'S ANSWER: ${studentAnswer || "(empty)"}
MAXIMUM MARKS: ${maxMarks}

GRADING PHILOSOPHY:
- Students may write short answers. Short ≠ wrong.
- If the student captured the CORE CONCEPT, give FULL marks — even if their answer is shorter than the reference.
- Example: Reference = "Amir Khan Swati is a developer in Taqseem Foundation". Student wrote "He is a developer". This is CORRECT → FULL marks.
- Do NOT penalize for missing minor details.
- Only penalize if the student MISSED THE MAIN POINT.

GRADING RULES:
1. Ignore spelling mistakes, grammar errors, punctuation, capitalization
2. Accept synonyms and equivalent phrases
3. Accept shorter answers if they capture the core concept
4. Give PARTIAL marks only if incomplete but on right track
5. Give 0 ONLY if totally wrong or missing the main point
6. Confidence: "high" | "medium" | "low"

Respond ONLY with valid JSON (no markdown):
{
  "marks": <number 0 to ${maxMarks}>,
  "confidence": "high" | "medium" | "low",
  "reason": "<1 short line explaining the grade>"
}`;

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_MODEL}`;

    const cfResponse = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a fair and generous grading assistant. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const cfData = await cfResponse.json();

    if (!cfData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: cfData.errors?.[0]?.message || "Cloudflare error",
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Extract AI text
    let aiText = "";
    if (cfData.result?.response) {
      aiText =
        typeof cfData.result.response === "string"
          ? cfData.result.response
          : JSON.stringify(cfData.result.response);
    } else if (cfData.result?.choices?.[0]?.message?.content) {
      aiText = cfData.result.choices[0].message.content;
    }

    // Parse JSON
    let gradeResult;
    try {
      const cleaned = aiText.replace(/```json|```/g, "").trim();
      gradeResult = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI returned invalid JSON: " + aiText.substring(0, 200),
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          marks: Number(gradeResult.marks) || 0,
          confidence: gradeResult.confidence || "medium",
          reason: gradeResult.reason || "Auto-graded",
        },
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Exception: " + (err as Error).message,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});