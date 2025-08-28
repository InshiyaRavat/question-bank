import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { logAdminActivity } from "@/lib/adminLogger";

const prisma = new PrismaClient();

function extractClientInfo(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

// GET handler to fetch current logo
export async function GET(request) {
  try {
    const logoSetting = await prisma.siteSettings.findUnique({
      where: { key: "site_logo" },
    });

    if (!logoSetting) {
      return new Response(
        JSON.stringify({
          logo: null,
          message: "No logo configured",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the logo data
    let logoData = null;
    if (logoSetting.value) {
      try {
        logoData = JSON.parse(logoSetting.value);
      } catch (e) {
        console.error("Failed to parse logo data:", e);
      }
    }

    return new Response(
      JSON.stringify({
        logo: logoData,
        updatedAt: logoSetting.updatedAt,
        updatedBy: logoSetting.updatedBy,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GET Logo Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch logo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to upload/update logo (Admin only)
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
    const { logoData, logoName, logoSize, logoType } = body;
    const { ipAddress, userAgent } = extractClientInfo(request);

    if (!logoData) {
      return new Response(JSON.stringify({ error: "Logo data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate base64 data
    if (!logoData.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image data format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check file size (limit to 2MB base64 encoded)
    if (logoData.length > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Logo file too large. Maximum size is 2MB" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare logo data object
    const logoObject = {
      data: logoData,
      name: logoName || "logo",
      size: logoSize || 0,
      type: logoType || "image/png",
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
    };

    // Save to site settings
    const setting = await prisma.siteSettings.upsert({
      where: { key: "site_logo" },
      update: {
        value: JSON.stringify(logoObject),
        type: "json",
        description: "Site logo stored as base64 data",
        updatedBy: userId,
      },
      create: {
        key: "site_logo",
        value: JSON.stringify(logoObject),
        type: "json",
        description: "Site logo stored as base64 data",
        updatedBy: userId,
      },
    });

    // Log admin activity
    await logAdminActivity(
      userId,
      "admin", // We should get actual admin name from Clerk
      "logo_update",
      "site_settings",
      "site_logo",
      {
        logoName: logoName || "logo",
        logoSize: logoSize || 0,
        logoType: logoType || "image/png",
      },
      ipAddress,
      userAgent
    );

    return new Response(
      JSON.stringify({
        logo: logoObject,
        message: "Logo updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("POST Logo Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update logo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE handler to remove logo (Admin only)
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

    const { ipAddress, userAgent } = extractClientInfo(request);

    // Remove the logo setting
    await prisma.siteSettings.delete({
      where: { key: "site_logo" },
    });

    // Log admin activity
    await logAdminActivity(
      userId,
      "admin", // We should get actual admin name from Clerk
      "logo_delete",
      "site_settings",
      "site_logo",
      {},
      ipAddress,
      userAgent
    );

    return new Response(JSON.stringify({ message: "Logo removed successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE Logo Error:", error);
    return new Response(JSON.stringify({ error: "Failed to remove logo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
