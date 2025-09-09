import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function countWords(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const feedback = String(form.get("feedback") || "").trim();
    const questionIdRaw = form.get("questionId");
    const questionId = questionIdRaw ? parseInt(String(questionIdRaw), 10) : null;
    const file = form.get("screenshot");

    if (!feedback || countWords(feedback) < 10) {
      return NextResponse.json({ success: false, error: "Feedback must be at least 10 words." }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "Screenshot is required." }, { status: 400 });
    }

    // Validate file type and size (<= 5MB, only images)
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const fileType = file.type;
    const fileSize = file.size;
    if (!allowed.includes(fileType)) {
      return NextResponse.json({ success: false, error: "Unsupported file type." }, { status: 400 });
    }
    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 5MB)." }, { status: 400 });
    }

    // Convert to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64}`;

    const record = await prisma.feedback.create({
      data: {
        userId,
        questionId,
        type: "report",
        feedback,
        screenshot: dataUrl,
      },
    });

    return NextResponse.json({ success: true, feedback: record });
  } catch (error) {
    console.error("Feedback report error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}


