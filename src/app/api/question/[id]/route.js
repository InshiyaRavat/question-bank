import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Question ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const questionId = parseInt(id);

    // Get admin info from request headers or auth
    const adminId = req.headers.get("x-admin-id") || "unknown";

    // First get the question to access topicId and check if it exists
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
        deletedAt: null, // Only find non-deleted questions
      },
      select: { topicId: true, questionText: true },
    });

    if (!existingQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Run soft delete and topic update in a transaction
    const [softDeletedQuestion] = await prisma.$transaction([
      // Step 1: Soft delete the question
      prisma.question.update({
        where: { id: questionId },
        data: {
          deletedAt: new Date(),
          deletedBy: adminId,
        },
        select: {
          id: true,
          topicId: true,
          questionText: true,
          correctOptionIdx: true,
          options: true,
          explanation: true,
          difficulty: true,
          tags: true,
          deletedAt: true,
          deletedBy: true,
        },
      }),

      // Step 2: Decrement topic.noOfQuestions
      prisma.topic.update({
        where: { id: existingQuestion.topicId },
        data: {
          noOfQuestions: {
            decrement: 1,
          },
        },
      }),
    ]);

    return new Response(
      JSON.stringify({
        ...softDeletedQuestion,
        message: "Question moved to trash successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Soft Delete Question Error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { questionText, correctOptionIdx, options, topicId, explanation, difficulty, tags } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Question ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};

    if (questionText !== undefined) updateData.questionText = questionText;
    if (correctOptionIdx !== undefined) updateData.correctOptionIdx = correctOptionIdx;
    if (options !== undefined) updateData.options = options;
    if (topicId !== undefined) updateData.topicId = topicId;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    const updatedQuestion = await prisma.question.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return new Response(JSON.stringify(updatedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PATCH Error:", err);
    return new Response(JSON.stringify({ error: "Failed to update question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
