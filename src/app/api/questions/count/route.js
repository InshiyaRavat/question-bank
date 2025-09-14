import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return new Response(JSON.stringify({ error: "Topic ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const count = await prisma.question.count({
      where: {
        topicId: parseInt(topicId),
        deletedAt: null
      }
    });

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error counting questions:", error);
    return new Response(JSON.stringify({ error: "Failed to count questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
