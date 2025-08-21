import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req, { params }) {
  console.log("GET request received for topic with params:", params);
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Topic ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const topic = await prisma.topic.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null, // Only include non-deleted topics
      },
      include: {
        subject: {
          where: { deletedAt: null }, // Only include non-deleted subjects
        },
      },
    });

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(topic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch topic" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Topic ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { noOfQuestions } = body;

    if (noOfQuestions === undefined) {
      return new Response(JSON.stringify({ error: "noOfQuestions field is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedTopic = await prisma.topic.update({
      where: { id: parseInt(id) },
      data: {
        noOfQuestions,
      },
    });

    return new Response(JSON.stringify(updatedTopic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update Topic Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update topic" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
