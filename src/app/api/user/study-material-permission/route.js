import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET - Check if user can download study materials
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user's study material permission
    const permission = await prisma.userStudyMaterialPermission.findUnique({
      where: { userId },
      select: { canDownload: true }
    });

    // Default to false if no permission record exists
    const canDownload = permission?.canDownload || false;

    return NextResponse.json({ canDownload });

  } catch (error) {
    console.error("Study material permission check error:", error);
    return NextResponse.json({ error: "Failed to check permission" }, { status: 500 });
  }
}
