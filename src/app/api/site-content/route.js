import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/site-content
 * Get public site content and settings
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type"); // settings, content-blocks, feature-toggles

    let response = {};

    // Get site settings
    if (!type || type === "settings") {
      const settings = await prisma.siteSettings.findMany({
        where: category ? { category } : {},
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });

      // Convert settings to key-value pairs with proper type conversion
      const settingsMap = {};
      settings.forEach((setting) => {
        let value = setting.value;

        // Convert value based on type
        if (setting.type === "boolean") {
          value = value === "true";
        } else if (setting.type === "number") {
          value = Number(value);
        } else if (setting.type === "json") {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = setting.value; // fallback to string if JSON parsing fails
          }
        }

        settingsMap[setting.key] = value;
      });

      response.settings = settingsMap;
    }

    // Get content blocks
    if (!type || type === "content-blocks") {
      const contentBlocks = await prisma.contentBlock.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
        },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      });

      // Convert content blocks to key-value pairs
      const contentBlocksMap = {};
      contentBlocks.forEach((block) => {
        let content = block.content;

        // Parse metadata if it exists
        let metadata = null;
        if (block.metadata) {
          try {
            metadata = JSON.parse(block.metadata);
          } catch (e) {
            // ignore parsing errors
          }
        }

        contentBlocksMap[block.key] = {
          title: block.title,
          content,
          type: block.type,
          category: block.category,
          sortOrder: block.sortOrder,
          metadata,
        };
      });

      response.contentBlocks = contentBlocksMap;
    }

    // Get feature toggles
    if (!type || type === "feature-toggles") {
      const featureToggles = await prisma.featureToggle.findMany({
        where: category ? { category } : {},
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      // Convert feature toggles to key-value pairs
      const featureTogglesMap = {};
      featureToggles.forEach((toggle) => {
        featureTogglesMap[toggle.key] = {
          name: toggle.name,
          description: toggle.description,
          isEnabled: toggle.isEnabled,
          category: toggle.category,
        };
      });

      response.featureToggles = featureTogglesMap;
    }

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Error fetching site content:", error);
    return NextResponse.json({ error: "Failed to fetch site content" }, { status: 500 });
  }
}
