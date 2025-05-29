import { PrismaClient } from "../../../../../generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const { upvote, downvote } = body;

  const updatedReply = await prisma.reply.update({
    where: { id },
    data: {
      ...(upvote !== undefined && { upvote }),
      ...(downvote !== undefined && { downvote }),
    },
  });

  return NextResponse.json(updatedReply);
}

export async function GET(req, { params }) {
  const id = parseInt(params.id);

  const reply = await prisma.reply.findMany({
    where: {
      id,
    },
  });

  return NextResponse.json(reply);
}