import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test if UserStudyMaterialPermission table exists
    const result = await prisma.userStudyMaterialPermission.findMany({
      take: 1
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "UserStudyMaterialPermission table exists",
      count: result.length
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: "UserStudyMaterialPermission table does not exist. Please run: npx prisma generate && npx prisma db push"
    }, { status: 500 });
  }
}
