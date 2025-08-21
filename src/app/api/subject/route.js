import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        deletedAt: null, // Only include non-deleted subjects
      },
      include: {
        topics: {
          where: { deletedAt: null }, // Only include non-deleted topics
        },
      },
    });

    return new Response(JSON.stringify(subjects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch subjects" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
