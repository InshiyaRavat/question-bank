import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

const QuestionSchema = z.object({
  subjectName: z.string().describe("Subject name for the question."),
  topicName: z.string().describe("Topic name within the subject."),
  questionText: z.string().describe("The question text."),
  options: z.array(z.string()).min(4).max(5).describe("Answer options A-E. Provide 4-5 options."),
  correctOptionIdx: z.number().int().min(0).max(4).describe("Index of the correct option (0-based)."),
  explanation: z.string().optional().describe("Explanation for the correct answer."),
});

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const modelId = form.get("model") || "gpt-4.1";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Field 'file' is required" }, { status: 400 });
    }

    // Convert PDF to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

    const systemPrompt =
      "You extract multiple-choice questions from the provided PDF. Return clean, structured data only.";

    const userInstruction =
      "Extract all MCQ questions with 4-5 options from the PDF. For each question, set subjectName and topicName if detectable from headings; otherwise leave generic like 'General' and 'Misc'. Ensure correctOptionIdx matches options. Include explanation when available.";

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      output: "array",
      schema: QuestionSchema,
      schemaName: "ExtractedQuestions",
      schemaDescription: "List of extracted MCQ questions from the PDF.",
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userInstruction },
            {
              type: "file",
              data: base64Pdf,
              mediaType: "application/pdf",
              filename: file.name || "input.pdf",
            },
          ],
        },
      ],
      temperature: 0,
    });

    // object is an array of QuestionSchema items
    const questions = Array.isArray(object) ? object : [];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("PDF process error", error);
    return NextResponse.json({ error: error?.message || "Failed to process PDF" }, { status: 500 });
  }
}
