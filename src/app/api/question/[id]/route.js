import { PrismaClient } from "../../../../../generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(_, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Question ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const questionId = parseInt(id);

    // Run delete and topic update in a transaction
    const [deletedQuestion] = await prisma.$transaction([
      // Step 1: Get the question (to access topicId)
      prisma.question.delete({
        where: { id: questionId },
        // Return topicId as well for decrementing
        select: {
          id: true,
          topicId: true,
          questionText: true,
          correctOptionIdx: true,
          options: true,
          explanation: true,
        },
      }),

      // Step 2: Decrement topic.noOfQuestions
      prisma.topic.update({
        where: { id: (await prisma.question.findUnique({ where: { id: questionId } }))?.topicId ?? 0 },
        data: {
          noOfQuestions: {
            decrement: 1,
          },
        },
      }),
    ]);

    return new Response(JSON.stringify(deletedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete Question Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete question" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { questionText, correctOptionIdx, options, topicId } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Question ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        questionText,
        correctOptionIdx,
        options,
        topicId,
      },
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