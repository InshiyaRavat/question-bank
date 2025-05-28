import { PrismaClient } from "../../../../generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      include: { subject: true },
    });

    return new Response(JSON.stringify(topics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch topics" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
