import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function DELETE(req) {
    try {
        const body = await req.json();
        const { questionIds } = body;

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return new Response(
                JSON.stringify({ error: "Question IDs array is required and must not be empty" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Convert string IDs to numbers
        const numericIds = questionIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (numericIds.length === 0) {
            return new Response(
                JSON.stringify({ error: "No valid question IDs provided" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // First, get all questions to check they exist and get their topic IDs
        const existingQuestions = await prisma.question.findMany({
            where: { id: { in: numericIds } },
            select: { id: true, topicId: true, questionText: true },
        });

        if (existingQuestions.length === 0) {
            return new Response(
                JSON.stringify({ error: "No questions found with the provided IDs" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Count questions per topic to update noOfQuestions correctly
        const topicCounts = {};
        existingQuestions.forEach(question => {
            topicCounts[question.topicId] = (topicCounts[question.topicId] || 0) + 1;
        });

        // Perform bulk delete and topic updates in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Step 1: Delete all questions
            const deletedQuestions = await tx.question.deleteMany({
                where: { id: { in: numericIds } },
            });

            // Step 2: Update topic question counts
            const topicUpdates = Object.entries(topicCounts).map(([topicId, count]) =>
                tx.topic.update({
                    where: { id: parseInt(topicId) },
                    data: {
                        noOfQuestions: {
                            decrement: count,
                        },
                    },
                })
            );

            await Promise.all(topicUpdates);

            return {
                deletedCount: deletedQuestions.count,
                deletedQuestions: existingQuestions,
                updatedTopics: Object.keys(topicCounts).length,
            };
        });

        return new Response(
            JSON.stringify({
                message: `Successfully deleted ${result.deletedCount} questions`,
                deletedCount: result.deletedCount,
                updatedTopics: result.updatedTopics,
                deletedQuestions: result.deletedQuestions,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("Bulk Delete Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to delete questions",
                details: error.message
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}