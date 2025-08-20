import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET handler to fetch questions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const questions = await prisma.question.findMany({
      where: {
        // Add any filtering conditions here if needed
      },
      include: {
        topic: true // Include related topic data if needed
      }
    });

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET Questions Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to create a new question
export async function POST(request) {
  try {
    const body = await request.json();
    const { questionText, options, correctOptionIdx, topicId, difficulty, tags, explanation } = body;

    // Validate required fields
    if (!questionText || !options || correctOptionIdx === undefined || !topicId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctOptionIdx,
        topicId: parseInt(topicId),
        difficulty: difficulty || "medium",
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
        explanation: explanation || ""
      }
    });

    // Update topic question count
    await prisma.topic.update({
      where: { id: parseInt(topicId) },
      data: {
        noOfQuestions: {
          increment: 1
        }
      }
    });

    return new Response(JSON.stringify(newQuestion), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST Question Error:", error);
    return new Response(JSON.stringify({ error: "Failed to create question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}