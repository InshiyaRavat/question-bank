import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Collect selected topicIds from query string (e.g., topicId=1&topicId=2)
  const topicIds = searchParams.getAll("topicId").map(id => parseInt(id));
  console.log(searchParams)
  console.log("Selected Topic IDs:", topicIds);
  try {
    // Step 1: Get all correctly solved questions by the user
    const solvedQuestions = await prisma.solvedQuestion.findMany({
      where: {
        userId,
        isCorrect: true,
      },
      select: {
        questionId: true,
      },
    });

    console.log("Solved Questions:", solvedQuestions);

    const solvedQuestionIds = solvedQuestions.map((sq) => sq.questionId);
    const allquestions = await prisma.question.findMany();
    console.log("All Questions:", allquestions);
    // Step 2: Fetch questions from selected topics that are not already solved correctly
    const questions = await prisma.question.findMany({
      where: {
        topicId: topicIds.length > 0 ? { in: topicIds } : undefined,
        id: {
          notIn: solvedQuestionIds,
        },
      },
    });

    console.log("Filtered Questions:", questions);

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


export async function POST(req) {
  try {
    const body = await req.json();

    const { questionText, options, correctOptionIdx, explanation, topicId } = body;

    if (!questionText || !options || correctOptionIdx === undefined || !topicId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const topicIdInt = parseInt(topicId);

    const [question] = await prisma.$transaction([
      prisma.question.create({
        data: {
          questionText,
          options,
          correctOptionIdx,
          explanation: explanation || null,
          topicId: topicIdInt,
        },
      }),
      prisma.topic.update({
        where: { id: topicIdInt },
        data: {
          noOfQuestions: {
            increment: 1,
          },
        },
      }),
    ]);


    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error adding question:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}