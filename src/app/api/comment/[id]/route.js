import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();
        const { adminUserId, adminUsername } = body;

        // Verify admin permissions (you can customize this logic based on your admin system)
        if (!adminUsername || adminUsername !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        const commentId = parseInt(id);

        // Check if comment exists
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { replies: true },
        });

        if (!existingComment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        // Delete all replies first (due to foreign key constraints)
        if (existingComment.replies && existingComment.replies.length > 0) {
            await prisma.reply.deleteMany({
                where: { commentId: commentId },
            });
        }

        // Delete the comment
        await prisma.comment.delete({
            where: { id: commentId },
        });

        return NextResponse.json(
            { message: "Comment and associated replies deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}