// app/api/subjects/route.ts (or similar)

import { PrismaClient } from "../../../../generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: true,
      },
    });

    return new Response(JSON.stringify(subjects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch subjects" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
