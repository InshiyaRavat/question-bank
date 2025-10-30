import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/feature-toggles/[id]
 * Get a specific feature toggle
 */
export async function GET(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const featureToggleId = parseInt(id);

    if (isNaN(featureToggleId)) {
      return NextResponse.json({ error: "Invalid feature toggle ID" }, { status: 400 });
    }

    const featureToggle = await prisma.featureToggle.findUnique({
      where: { id: featureToggleId },
    });

    if (!featureToggle) {
      return NextResponse.json({ error: "Feature toggle not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      featureToggle,
    });
  } catch (error) {
    console.error("Error fetching feature toggle:", error);
    return NextResponse.json({ error: "Failed to fetch feature toggle" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/feature-toggles/[id]
 * Update a feature toggle
 */
export async function PUT(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const featureToggleId = parseInt(id);

    if (isNaN(featureToggleId)) {
      return NextResponse.json({ error: "Invalid feature toggle ID" }, { status: 400 });
    }

    const body = await req.json();
    const { key, name, description, isEnabled, category } = body;

    // Check if key already exists (excluding current toggle)
    if (key) {
      const existing = await prisma.featureToggle.findFirst({
        where: {
          key,
          id: { not: featureToggleId },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "Feature toggle with this key already exists",
          },
          { status: 400 }
        );
      }
    }

    const updateData = {};
    if (key !== undefined) updateData.key = key;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (category !== undefined) updateData.category = category;

    const featureToggle = await prisma.featureToggle.update({
      where: { id: featureToggleId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      featureToggle,
    });
  } catch (error) {
    console.error("Error updating feature toggle:", error);
    return NextResponse.json({ error: "Failed to update feature toggle" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/feature-toggles/[id]
 * Delete a feature toggle
 */
export async function DELETE(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { id } = params;
    const featureToggleId = parseInt(id);

    if (isNaN(featureToggleId)) {
      return NextResponse.json({ error: "Invalid feature toggle ID" }, { status: 400 });
    }

    await prisma.featureToggle.delete({
      where: { id: featureToggleId },
    });

    return NextResponse.json({
      success: true,
      message: "Feature toggle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feature toggle:", error);
    return NextResponse.json({ error: "Failed to delete feature toggle" }, { status: 500 });
  }
}
