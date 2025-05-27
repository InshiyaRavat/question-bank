import { PrismaClient } from "../../../../generated/prisma";

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

    // Step 3: Shuffle and limit to 50
    const shuffled = questions
      .sort(() => 0.5 - Math.random())
      .slice(0, 50);

    return new Response(JSON.stringify(shuffled), {
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
