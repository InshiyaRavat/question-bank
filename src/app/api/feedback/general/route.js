import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const feedback = String(body?.feedback || "").trim();

    if (!feedback) {
      return NextResponse.json({ success: false, error: "Feedback is required" }, { status: 400 });
    }

    const record = await prisma.feedback.create({
      data: {
        userId,
        type: "general",
        feedback,
      },
    });

    return NextResponse.json({ success: true, feedback: record });
  } catch (error) {
    console.error("Feedback general error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}


