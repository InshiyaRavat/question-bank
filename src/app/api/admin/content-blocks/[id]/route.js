import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/content-blocks/[id]
 * Get a specific content block
 */
export async function GET(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const contentBlockId = parseInt(id);

    if (isNaN(contentBlockId)) {
      return NextResponse.json({ error: "Invalid content block ID" }, { status: 400 });
    }

    const contentBlock = await prisma.contentBlock.findUnique({
      where: { id: contentBlockId },
    });

    if (!contentBlock) {
      return NextResponse.json({ error: "Content block not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contentBlock,
    });
  } catch (error) {
    console.error("Error fetching content block:", error);
    return NextResponse.json({ error: "Failed to fetch content block" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/content-blocks/[id]
 * Update a content block
 */
export async function PUT(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const contentBlockId = parseInt(id);

    if (isNaN(contentBlockId)) {
      return NextResponse.json({ error: "Invalid content block ID" }, { status: 400 });
    }

    const body = await req.json();
    const { key, title, content, type, category, isActive, sortOrder, metadata } = body;

    // Validate type if provided
    if (type && !["text", "html", "json", "image"].includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid content type",
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !["hero", "features", "testimonials", "footer", "general"].includes(category)) {
      return NextResponse.json(
        {
          error: "Invalid content category",
        },
        { status: 400 }
      );
    }

    // Check if key already exists (excluding current block)
    if (key) {
      const existing = await prisma.contentBlock.findFirst({
        where: {
          key,
          id: { not: contentBlockId },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "Content block with this key already exists",
          },
          { status: 400 }
        );
      }
    }

    const updateData = {};
    if (key !== undefined) updateData.key = key;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    const contentBlock = await prisma.contentBlock.update({
      where: { id: contentBlockId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      contentBlock,
    });
  } catch (error) {
    console.error("Error updating content block:", error);
    return NextResponse.json({ error: "Failed to update content block" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/content-blocks/[id]
 * Delete a content block
 */
export async function DELETE(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const contentBlockId = parseInt(id);

    if (isNaN(contentBlockId)) {
      return NextResponse.json({ error: "Invalid content block ID" }, { status: 400 });
    }

    await prisma.contentBlock.delete({
      where: { id: contentBlockId },
    });

    return NextResponse.json({
      success: true,
      message: "Content block deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content block:", error);
    return NextResponse.json({ error: "Failed to delete content block" }, { status: 500 });
  }
}
