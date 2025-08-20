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

        const subjectId = parseInt(params.id);
        if (!subjectId || isNaN(subjectId)) {
            return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
        }

        // Check if subject exists and get detailed information for logging
        const existingSubject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                topics: {
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
                },
            },
        });

        if (!existingSubject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // Calculate total items that will be deleted for logging
        const topicIds = existingSubject.topics.map(t => t.id);
        const questionIds = existingSubject.topics.flatMap(t => t.questions.map(q => q.id));
        const totalQuestions = questionIds.length;
        const totalComments = existingSubject.topics.reduce((sum, topic) =>
            sum + topic.questions.reduce((qSum, question) => qSum + question._count.comments, 0), 0
        );
        const totalSolvedQuestions = existingSubject.topics.reduce((sum, topic) =>
            sum + topic.questions.reduce((qSum, question) => qSum + question._count.solvedQuestions, 0), 0
        );
        const totalAttemptedQuestions = existingSubject.topics.reduce((sum, topic) =>
            sum + topic._count.attemptedQuestions, 0
        );

        // Log admin activity
        try {
            await prisma.adminActivityLog.create({
                data: {
                    adminId: userId,
                    adminName: "Admin", // You might want to get the actual admin name from Clerk
                    action: "subject_deleted",
                    resource: "subject",
                    resourceId: subjectId.toString(),
                    details: {
                        subjectName: existingSubject.name,
                        topicsDeleted: existingSubject.topics.length,
                        questionsDeleted: totalQuestions,
                        commentsDeleted: totalComments,
                        solvedQuestionsDeleted: totalSolvedQuestions,
                        attemptedQuestionsDeleted: totalAttemptedQuestions,
                        topicIds: topicIds,
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

        // Delete the subject (cascade delete will handle all related records)
        // Due to the onDelete: Cascade in your schema, this will automatically delete:
        // - All topics in this subject
        // - All questions in those topics
        // - All comments on those questions
        // - All replies to those comments
        // - All solved questions records
        // - All attempted questions records
        await prisma.subject.delete({
            where: { id: subjectId },
        });

        return NextResponse.json({
            success: true,
            message: "Subject deleted successfully",
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
        console.error("Error deleting subject:", error);

        // Handle specific Prisma errors
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        return NextResponse.json(
            { error: "Failed to delete subject. Please try again." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}