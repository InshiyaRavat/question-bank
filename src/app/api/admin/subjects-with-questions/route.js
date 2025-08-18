import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        // Check if user is authenticated
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optional filters
        const { searchParams } = new URL(req.url);
        const difficulty = searchParams.get('difficulty'); // easy|medium|hard|all
        const tagsRaw = searchParams.get('tags'); // comma-separated
        const tagList = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

        // Fetch all subjects with their topics and questions
        const subjects = await prisma.subject.findMany({
            include: {
                topics: {
                    include: {
                        questions: {
                            where: {
                                ...(difficulty && difficulty !== 'all' ? { difficulty } : {}),
                                ...(tagList.length ? { tags: { hasSome: tagList } } : {}),
                            },
                            orderBy: {
                                id: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(subjects);
    } catch (error) {
        console.error("Error fetching subjects with questions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Optional: Add POST method to create new subjects
export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Subject name is required" },
                { status: 400 }
            );
        }

        const newSubject = await prisma.subject.create({
            data: {
                name: name.trim()
            }
        });

        return NextResponse.json(newSubject, { status: 201 });
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}