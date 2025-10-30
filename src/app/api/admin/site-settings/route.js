import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/site-settings
 * Get all site settings grouped by category
 */
export async function GET(req) {
  try {
    const userId = await requireAdmin();

    const settings = await prisma.siteSettings.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      settings: groupedSettings,
      categories: Object.keys(groupedSettings),
    });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

/**
 * POST /api/admin/site-settings
 * Create or update site settings
 */
export async function POST(req) {
  try {
    const userId = await requireAdmin();

    const body = await req.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "Settings array is required" }, { status: 400 });
    }

    const results = [];

    for (const setting of settings) {
      const { key, value, type = "string", category = "general" } = setting;

      if (!key) {
        return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
      }

      // Validate type
      if (!["string", "json", "boolean", "number"].includes(type)) {
        return NextResponse.json({ error: "Invalid setting type" }, { status: 400 });
      }

      // Validate category (added "contact")
      if (!["branding", "content", "seo", "social", "features", "general", "contact"].includes(category)) {
        return NextResponse.json({ error: "Invalid setting category" }, { status: 400 });
      }

      // Convert value based on type
      let processedValue = value;
      if (type === "boolean") {
        // Accept true/false for boolean in multiple common forms
        const truthy = value === true || value === "true" || value === 1 || value === "1";
        processedValue = String(truthy);
      } else if (type === "number") {
        processedValue = String(Number(value));
      } else if (type === "json") {
        processedValue = JSON.stringify(value);
      }

      // Upsert setting
      const result = await prisma.siteSettings.upsert({
        where: { key },
        update: {
          value: processedValue,
          type,
          category,
        },
        create: {
          key,
          value: processedValue,
          type,
          category,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      settings: results,
    });
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/site-settings
 * Delete a site setting
 */
export async function DELETE(req) {
  try {
    const userId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    await prisma.siteSettings.delete({
      where: { key },
    });

    return NextResponse.json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting site setting:", error);
    return NextResponse.json({ error: "Failed to delete site setting" }, { status: 500 });
  }
}
