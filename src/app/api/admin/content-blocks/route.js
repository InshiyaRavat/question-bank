import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/content-blocks
 * Get all content blocks
 */
export async function GET(req) {
  try {
    const userId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where = category ? { category } : {};

    const contentBlocks = await prisma.contentBlock.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });

    return NextResponse.json({
      success: true,
      contentBlocks,
    });
  } catch (error) {
    console.error("Error fetching content blocks:", error);
    return NextResponse.json({ error: "Failed to fetch content blocks" }, { status: 500 });
  }
}

/**
 * POST /api/admin/content-blocks
 * Create a new content block
 */
export async function POST(req) {
  try {
    const userId = await requireAdmin();

    const body = await req.json();
    const { key, title, content, type = "text", category = "general", isActive = true, sortOrder = 0, metadata } = body;

    // Validate required fields
    if (!key || !title || !content) {
      return NextResponse.json(
        {
          error: "Key, title, and content are required",
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!["text", "html", "json", "image"].includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid content type",
        },
        { status: 400 }
      );
    }

    // Validate category
    if (!["hero", "features", "testimonials", "footer", "general"].includes(category)) {
      return NextResponse.json(
        {
          error: "Invalid content category",
        },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.contentBlock.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Content block with this key already exists",
        },
        { status: 400 }
      );
    }

    const contentBlock = await prisma.contentBlock.create({
      data: {
        key,
        title,
        content,
        type,
        category,
        isActive,
        sortOrder,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({
      success: true,
      contentBlock,
    });
  } catch (error) {
    console.error("Error creating content block:", error);
    return NextResponse.json({ error: "Failed to create content block" }, { status: 500 });
  }
}
