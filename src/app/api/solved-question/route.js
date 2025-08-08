import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  const body = await req.json();
  const { userId, questionId, isCorrect } = body;

  const existing = await prisma.solvedQuestion.findFirst({
    where: { userId, questionId },
  });

  if (existing) {
    return Response.json({ message: "Already recorded" }, { status: 200 });
  }

  const record = await prisma.solvedQuestion.create({
    data: { userId, questionId, isCorrect },
  });

  return Response.json(record);
}
