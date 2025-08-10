import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
    if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const body = await req.json();
  const { ids } = body;
  console.log("Received IDs:", ids);

  try {
    const questions = await prisma.question.findMany({
      where: { id: { in: ids } }
    });

    const ordered = ids.map(id => questions.find(q => q.id === id));
      return new Response(JSON.stringify(ordered), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
