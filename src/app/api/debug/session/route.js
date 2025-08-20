// Add this temporary debug route to check session structure
// Create: app/api/debug/session/route.js

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId, sessionClaims } = await auth();

        console.log("=== DEBUG SESSION INFO ===");
        console.log("userId:", userId);
        console.log("sessionClaims:", JSON.stringify(sessionClaims, null, 2));
        console.log("sessionClaims.metadata:", sessionClaims?.metadata);
        console.log("sessionClaims.metadata.role:", sessionClaims?.metadata?.role);
        console.log("========================");

        return NextResponse.json({
            userId,
            sessionClaims,
            metadata: sessionClaims?.metadata,
            role: sessionClaims?.metadata?.role,
        });
    } catch (error) {
        console.error("Debug error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}