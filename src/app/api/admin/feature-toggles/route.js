import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/feature-toggles
 * Get all feature toggles
 */
export async function GET(req) {
  try {
    const userId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where = category ? { category } : {};

    const featureToggles = await prisma.featureToggle.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      featureToggles,
    });
  } catch (error) {
    console.error("Error fetching feature toggles:", error);
    return NextResponse.json({ error: "Failed to fetch feature toggles" }, { status: 500 });
  }
}

/**
 * POST /api/admin/feature-toggles
 * Create a new feature toggle
 */
export async function POST(req) {
  try {
    const userId = await requireAdmin();

    const body = await req.json();
    const { key, name, description, isEnabled = false, category = "general" } = body;

    // Validate required fields
    if (!key || !name) {
      return NextResponse.json(
        {
          error: "Key and name are required",
        },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.featureToggle.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Feature toggle with this key already exists",
        },
        { status: 400 }
      );
    }

    const featureToggle = await prisma.featureToggle.create({
      data: {
        key,
        name,
        description,
        isEnabled,
        category,
      },
    });

    return NextResponse.json({
      success: true,
      featureToggle,
    });
  } catch (error) {
    console.error("Error creating feature toggle:", error);
    return NextResponse.json({ error: "Failed to create feature toggle" }, { status: 500 });
  }
}
