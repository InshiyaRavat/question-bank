import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userid");

  if (!userId) {
    return new Response(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const attempted = await prisma.attemptedQuestion.findMany({
      where: { userId },
    });

    return new Response(JSON.stringify(attempted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch attempted questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all topics to initialize 0 attempts for each
    const topics = await prisma.topic.findMany();

    const data = topics.map((topic) => ({
      userId,
      topicId: topic.id,
      questionsAttempted: 0,
    }));

    await prisma.attemptedQuestion.createMany({ data });

    return new Response(JSON.stringify({ message: "Initialized attempted questions" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to create attempted questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { userId, topicId } = body;

  const existing = await prisma.attemptedQuestion.findFirst({
    where: { userId, topicId },
  });

  if (existing) {
    const updated = await prisma.attemptedQuestion.update({
      where: { id: existing.id },
      data: { questionsAttempted: { increment: 1 } },
    });
    return Response.json(updated);
  } else {
    const created = await prisma.attemptedQuestion.create({
      data: { userId, topicId, questionsAttempted: 1 },
    });
    return Response.json(created);
  }
}
