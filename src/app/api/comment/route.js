import { PrismaClient } from "../../../../generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const comments = await prisma.comment.findMany({
    include: { replies: true },
    orderBy: { createdAt: 'desc' },
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
