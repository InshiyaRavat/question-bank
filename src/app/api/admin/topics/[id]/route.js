import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        // Check authentication
        const { userId } = auth();
        // if (!userId) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const topicId = parseInt(await params.id);
        if (!topicId || isNaN(topicId)) {
            return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
        }

        // Check if topic exists and is not already deleted
        const existingTopic = await prisma.topic.findUnique({
            where: {
                id: topicId,
                deletedAt: null, // Only find non-deleted topics
            },
            include: {
                questions: {
                    where: { deletedAt: null }, // Only count non-deleted questions
                    include: {
                        _count: {
                            select: {
                                comments: true,
                                solvedQuestions: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        attemptedQuestions: true,
                    },
                },
            },
        });

        if (!existingTopic) {
            return NextResponse.json({ error: "Topic not found" }, { status: 404 });
        }

        // Calculate total items that will be affected for logging
        const questionIds = existingTopic.questions.map((q) => q.id);
        const totalComments = existingTopic.questions.reduce((sum, q) => sum + q._count.comments, 0);
        const totalSolvedQuestions = existingTopic.questions.reduce((sum, q) => sum + q._count.solvedQuestions, 0);
        const totalAttemptedQuestions = existingTopic._count.attemptedQuestions;

        // Perform soft delete in a transaction
        await prisma.$transaction(async (tx) => {
            // Soft delete all questions in this topic
            if (questionIds.length > 0) {
                await tx.question.updateMany({
                    where: {
                        topicId: topicId,
                        deletedAt: null,
                    },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: userId || "admin",
                    },
                });
            }

            // Soft delete the topic
            await tx.topic.update({
                where: { id: topicId },
                data: {
                    deletedAt: new Date(),
                    deletedBy: userId || "admin",
                },
            });
        });

        // Log admin activity
        try {
            await prisma.adminActivityLog.create({
                data: {
                    adminId: userId || "admin",
                    adminName: "Admin", // You might want to get the actual admin name from Clerk
                    action: "topic_soft_deleted",
                    resource: "topic",
                    resourceId: topicId.toString(),
                    details: {
                        topicName: existingTopic.name,
                        subjectId: existingTopic.subjectId,
                        questionsMovedToTrash: existingTopic.questions.length,
                        commentsAffected: totalComments,
                        solvedQuestionsAffected: totalSolvedQuestions,
                        attemptedQuestionsAffected: totalAttemptedQuestions,
                        questionIds: questionIds,
                    },
                    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
                    userAgent: request.headers.get("user-agent") || "unknown",
                },
            });
        } catch (logError) {
            console.error("Failed to log admin activity:", logError);
            // Continue even if logging fails
        }

        return NextResponse.json({
            success: true,
            message: "Topic moved to trash successfully",
            deletedCounts: {
                topics: 1,
                questions: existingTopic.questions.length,
                comments: totalComments,
                solvedQuestions: totalSolvedQuestions,
                attemptedQuestions: totalAttemptedQuestions,
            },
        });
    } catch (error) {
        console.error("Error soft deleting topic:", error);

        // Handle specific Prisma errors
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Topic not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to delete topic. Please try again." }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
