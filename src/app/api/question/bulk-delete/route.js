import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return new Response(JSON.stringify({ error: "Question IDs array is required and must not be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert string IDs to numbers
    const numericIds = questionIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return new Response(JSON.stringify({ error: "No valid question IDs provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get admin info from request headers or auth
    const adminId = req.headers.get("x-admin-id") || "unknown";

    // First, get all questions to check they exist and get their topic IDs (only non-deleted ones)
    const existingQuestions = await prisma.question.findMany({
      where: {
        id: { in: numericIds },
        deletedAt: null, // Only find non-deleted questions
      },
      select: { id: true, topicId: true, questionText: true },
    });

    if (existingQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions found with the provided IDs" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Count questions per topic to update noOfQuestions correctly
    const topicCounts = {};
    existingQuestions.forEach((question) => {
      topicCounts[question.topicId] = (topicCounts[question.topicId] || 0) + 1;
    });

    // Perform bulk soft delete and topic updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Soft delete all questions
      const softDeletedQuestions = await tx.question.updateMany({
        where: {
          id: { in: existingQuestions.map((q) => q.id) },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedBy: adminId,
        },
      });

      // Step 2: Update topic question counts
      const topicUpdates = Object.entries(topicCounts).map(([topicId, count]) =>
        tx.topic.update({
          where: { id: parseInt(topicId) },
          data: {
            noOfQuestions: {
              decrement: count,
            },
          },
        })
      );

      await Promise.all(topicUpdates);

      return {
        deletedCount: softDeletedQuestions.count,
        deletedQuestions: existingQuestions,
        updatedTopics: Object.keys(topicCounts).length,
      };
    });

    return new Response(
      JSON.stringify({
        message: `Successfully moved ${result.deletedCount} questions to trash`,
        deletedCount: result.deletedCount,
        updatedTopics: result.updatedTopics,
        deletedQuestions: result.deletedQuestions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Bulk Soft Delete Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete questions",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
