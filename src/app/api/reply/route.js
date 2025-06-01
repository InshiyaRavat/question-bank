import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentid');

  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });

  const replies = await prisma.reply.findMany({
    where: { commentId: parseInt(commentId) },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(replies);
}

export async function POST(req) {
  const body = await req.json();
  const { userId, username, commentId, reply } = body;

  const newReply = await prisma.reply.create({
    data: { userId, username, commentId: parseInt(commentId), reply },
  });

  return NextResponse.json(newReply, { status: 201 });
}
