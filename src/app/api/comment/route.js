import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  const whereClause = questionId ? { questionId: parseInt(questionId) } : {};

  const comments = await prisma.comment.findMany({
    where: whereClause,
    include: { replies: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(comments);
}

export async function POST(req) {
  const body = await req.json();
  const { userId, username, questionId, comment } = body;

  const newComment = await prisma.comment.create({
    data: { userId, username, questionId, comment },
  });

  return NextResponse.json(newComment, { status: 201 });
}
