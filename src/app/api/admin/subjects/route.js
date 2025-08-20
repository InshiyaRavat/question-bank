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
        const { name } = body;

        // Validation
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
        }

        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
            return NextResponse.json(
                { error: "Subject name must be at least 2 characters long" },
                { status: 400 }
            );
        }

        if (trimmedName.length > 100) {
            return NextResponse.json(
                { error: "Subject name must be less than 100 characters" },
                { status: 400 }
            );
        }

        // Check for duplicate subject names (case-insensitive)
        const existingSubject = await prisma.subject.findFirst({
            where: {
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        });

        if (existingSubject) {
            return NextResponse.json(
                { error: "A subject with this name already exists" },
                { status: 409 }
            );
        }

        // Create the subject
        const newSubject = await prisma.subject.create({
            data: {
                name: trimmedName,
            },
            include: {
                topics: {
                    include: {
                        questions: true,
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
                    action: "subject_created",
                    resource: "subject",
                    resourceId: newSubject.id.toString(),
                    details: {
                        subjectName: newSubject.name,
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

        return NextResponse.json(newSubject, { status: 201 });

    } catch (error) {
        console.error("Error creating subject:", error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A subject with this name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create subject. Please try again." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}