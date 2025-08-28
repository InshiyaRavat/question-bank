import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET handler to fetch site settings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    let where = {};
    if (key) {
      where.key = key;
    }

    if (key) {
      // Return single setting
      const setting = await prisma.siteSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        return new Response(JSON.stringify({ error: "Setting not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse value based on type
      let value = setting.value;
      if (setting.type === "json" && value) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error("Failed to parse JSON setting:", e);
        }
      } else if (setting.type === "boolean") {
        value = value === "true";
      }

      return new Response(
        JSON.stringify({
          setting: { ...setting, value },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Return all settings
      const settings = await prisma.siteSettings.findMany({
        orderBy: { key: "asc" },
      });

      // Parse values based on type
      const parsedSettings = settings.map((setting) => {
        let value = setting.value;
        if (setting.type === "json" && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error("Failed to parse JSON setting:", e);
          }
        } else if (setting.type === "boolean") {
          value = value === "true";
        }
        return { ...setting, value };
      });

      return new Response(JSON.stringify({ settings: parsedSettings }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("GET Site Settings Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch site settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to create or update site settings (Admin only)
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { key, value, type = "string", description } = body;

    if (!key) {
      return new Response(JSON.stringify({ error: "Key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert value to string for storage
    let stringValue = value;
    if (type === "json") {
      stringValue = JSON.stringify(value);
    } else if (type === "boolean") {
      stringValue = value ? "true" : "false";
    } else if (typeof value !== "string") {
      stringValue = String(value);
    }

    // Upsert the setting
    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: {
        value: stringValue,
        type,
        description,
        updatedBy: userId,
      },
      create: {
        key,
        value: stringValue,
        type,
        description,
        updatedBy: userId,
      },
    });

    return new Response(
      JSON.stringify({
        setting,
        message: "Site setting updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("POST Site Settings Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update site setting" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE handler to delete a site setting (Admin only)
export async function DELETE(request) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return new Response(JSON.stringify({ error: "Key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.siteSettings.delete({
      where: { key },
    });

    return new Response(JSON.stringify({ message: "Site setting deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE Site Settings Error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete site setting" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
