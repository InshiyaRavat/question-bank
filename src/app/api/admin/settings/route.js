import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET - Fetch all settings
export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Default settings if table or rows don't exist
    const defaultSettings = {
      accuracyThreshold: {
        value: "50",
        description:
          "Accuracy threshold for marking topics as 'needs attention' in personalized reports (percentage)",
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      },
    };

    try {
      const settings = await prisma.settings.findMany({ orderBy: { key: "asc" } });
      if (!settings || settings.length === 0) {
        return NextResponse.json({ settings: defaultSettings });
      }

      const settingsObj = {};
      settings.forEach((setting) => {
        settingsObj[setting.key] = {
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt,
          updatedBy: setting.updatedBy,
        };
      });

      // Ensure defaults present
      return NextResponse.json({ settings: { ...defaultSettings, ...settingsObj } });
    } catch (err) {
      // Likely table missing – return defaults instead of 500
      console.warn("Settings table not available, returning defaults.", err.message);
      return NextResponse.json({ settings: defaultSettings });
    }
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST - Update settings
export async function POST(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
    }

    // Ensure Settings table exists (for environments where migration wasn't run)
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Settings" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_by" TEXT
      );`;
    } catch (e) {
      console.warn("Could not ensure Settings table exists:", e.message);
    }

    // Update each setting
    const updatedSettings = {};
    for (const [key, settingData] of Object.entries(settings)) {
      const { value, description } = settingData;
      
      const updatedSetting = await prisma.settings.upsert({
        where: { key },
        update: {
          value: value.toString(),
          description: description || null,
          updatedBy: userId
        },
        create: {
          key,
          value: value.toString(),
          description: description || null,
          updatedBy: userId
        }
      });

      updatedSettings[key] = {
        value: updatedSetting.value,
        description: updatedSetting.description,
        updatedAt: updatedSetting.updatedAt,
        updatedBy: updatedSetting.updatedBy
      };
    }

    return NextResponse.json({ 
      message: "Settings updated successfully",
      settings: updatedSettings 
    });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
