// /app/api/admin/topics/[id]/route.js

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        // Check authentication
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const topicId = parseInt(params.id);
        if (!topicId || isNaN(topicId)) {
            return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
        }

        // Check if topic exists
        const existingTopic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                questions: {
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

        // Calculate total items that will be deleted for logging
        const questionIds = existingTopic.questions.map(q => q.id);
        const totalComments = existingTopic.questions.reduce((sum, q) => sum + q._count.comments, 0);
        const totalSolvedQuestions = existingTopic.questions.reduce((sum, q) => sum + q._count.solvedQuestions, 0);
        const totalAttemptedQuestions = existingTopic._count.attemptedQuestions;

        // Log admin activity
        try {
            await prisma.adminActivityLog.create({
                data: {
                    adminId: userId,
                    adminName: "Admin", // You might want to get the actual admin name from Clerk
                    action: "topic_deleted",
                    resource: "topic",
                    resourceId: topicId.toString(),
                    details: {
                        topicName: existingTopic.name,
                        subjectId: existingTopic.subjectId,
                        questionsDeleted: existingTopic.questions.length,
                        commentsDeleted: totalComments,
                        solvedQuestionsDeleted: totalSolvedQuestions,
                        attemptedQuestionsDeleted: totalAttemptedQuestions,
                        questionIds: questionIds,
                    },
                    ipAddress: request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                },
            });
        } catch (logError) {
            console.error("Failed to log admin activity:", logError);
            // Continue with deletion even if logging fails
        }

        // Delete the topic (cascade delete will handle related records)
        // Due to the onDelete: Cascade in your schema, this will automatically delete:
        // - All questions in this topic
        // - All comments on those questions
        // - All replies to those comments
        // - All solved questions records
        // - All attempted questions records
        await prisma.topic.delete({
            where: { id: topicId },
        });

        return NextResponse.json({
            success: true,
            message: "Topic deleted successfully",
            deletedCounts: {
                topics: 1,
                questions: existingTopic.questions.length,
                comments: totalComments,
                solvedQuestions: totalSolvedQuestions,
                attemptedQuestions: totalAttemptedQuestions,
            },
        });

    } catch (error) {
        console.error("Error deleting topic:", error);

        // Handle specific Prisma errors
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Topic not found" }, { status: 404 });
        }

        return NextResponse.json(
            { error: "Failed to delete topic. Please try again." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}