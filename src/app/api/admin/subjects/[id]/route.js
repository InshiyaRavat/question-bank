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

        const subjectId = parseInt(await params.id);
        if (!subjectId || isNaN(subjectId)) {
            return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
        }

        // Check if subject exists and get detailed information for logging (only non-deleted items)
        const existingSubject = await prisma.subject.findUnique({
            where: {
                id: subjectId,
                deletedAt: null, // Only find non-deleted subjects
            },
            include: {
                topics: {
                    where: { deletedAt: null }, // Only include non-deleted topics
                    include: {
                        questions: {
                            where: { deletedAt: null }, // Only include non-deleted questions
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
                },
            },
        });

        if (!existingSubject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // Calculate total items that will be affected for logging
        const topicIds = existingSubject.topics.map((t) => t.id);
        const questionIds = existingSubject.topics.flatMap((t) => t.questions.map((q) => q.id));
        const totalQuestions = questionIds.length;
        const totalComments = existingSubject.topics.reduce(
            (sum, topic) => sum + topic.questions.reduce((qSum, question) => qSum + question._count.comments, 0),
            0
        );
        const totalSolvedQuestions = existingSubject.topics.reduce(
            (sum, topic) => sum + topic.questions.reduce((qSum, question) => qSum + question._count.solvedQuestions, 0),
            0
        );
        const totalAttemptedQuestions = existingSubject.topics.reduce(
            (sum, topic) => sum + topic._count.attemptedQuestions,
            0
        );

        // Perform soft delete in a transaction
        await prisma.$transaction(async (tx) => {
            // Soft delete all questions in all topics of this subject
            if (questionIds.length > 0) {
                await tx.question.updateMany({
                    where: {
                        id: { in: questionIds },
                        deletedAt: null,
                    },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: userId || "admin",
                    },
                });
            }

            // Soft delete all topics in this subject
            if (topicIds.length > 0) {
                await tx.topic.updateMany({
                    where: {
                        id: { in: topicIds },
                        deletedAt: null,
                    },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: userId || "admin",
                    },
                });
            }

            // Soft delete the subject
            await tx.subject.update({
                where: { id: subjectId },
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
                    action: "subject_soft_deleted",
                    resource: "subject",
                    resourceId: subjectId.toString(),
                    details: {
                        subjectName: existingSubject.name,
                        topicsMovedToTrash: existingSubject.topics.length,
                        questionsMovedToTrash: totalQuestions,
                        commentsAffected: totalComments,
                        solvedQuestionsAffected: totalSolvedQuestions,
                        attemptedQuestionsAffected: totalAttemptedQuestions,
                        topicIds: topicIds,
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
            message: "Subject moved to trash successfully",
            deletedCounts: {
                subjects: 1,
                topics: existingSubject.topics.length,
                questions: totalQuestions,
                comments: totalComments,
                solvedQuestions: totalSolvedQuestions,
                attemptedQuestions: totalAttemptedQuestions,
            },
        });
    } catch (error) {
        console.error("Error soft deleting subject:", error);

        // Handle specific Prisma errors
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to delete subject. Please try again." }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
