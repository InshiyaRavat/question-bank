import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        // Check authentication
        const { userId } = auth();
        // if (!userId) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const body = await request.json();
        const { name, subjectId } = body;

        // Validation
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Topic name is required" }, { status: 400 });
        }

        if (!subjectId || typeof subjectId !== 'number') {
            return NextResponse.json({ error: "Valid subject ID is required" }, { status: 400 });
        }

        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
            return NextResponse.json(
                { error: "Topic name must be at least 2 characters long" },
                { status: 400 }
            );
        }

        if (trimmedName.length > 100) {
            return NextResponse.json(
                { error: "Topic name must be less than 100 characters" },
                { status: 400 }
            );
        }

        // Check if subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                topics: true,
            },
        });

        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // Check for duplicate topic names within the same subject (case-insensitive)
        const existingTopic = subject.topics.find(
            topic => topic.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingTopic) {
            return NextResponse.json(
                { error: "A topic with this name already exists in this subject" },
                { status: 409 }
            );
        }

        // Create the topic
        const newTopic = await prisma.topic.create({
            data: {
                name: trimmedName,
                subjectId: subjectId,
                noOfQuestions: 0, // Default value
            },
            include: {
                questions: true,
                subject: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Log admin activity
        try {
            await prisma.adminActivityLog.create({
                data: {
                    adminId: userId,
                    adminName: "Admin", // You might want to get the actual admin name from Clerk
                    action: "topic_created",
                    resource: "topic",
                    resourceId: newTopic.id.toString(),
                    details: {
                        topicName: newTopic.name,
                        subjectId: subjectId,
                        subjectName: subject.name,
                    },
                    ipAddress: request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                },
            });
        } catch (logError) {
            console.error("Failed to log admin activity:", logError);
            // Continue even if logging fails
        }

        return NextResponse.json(newTopic, { status: 201 });

    } catch (error) {
        console.error("Error creating topic:", error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A topic with this name already exists" },
                { status: 409 }
            );
        }

        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Invalid subject ID" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create topic. Please try again." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}