import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    
    // Try to get current user first
    const currentUser = await clerk.users.getUser(userId);
    
    // Try to get user list with minimal parameters
    const users = await clerk.users.getUserList();
    
    return NextResponse.json({ 
      success: true,
      currentUser: {
        id: currentUser.id,
        name: currentUser.fullName || currentUser.firstName + (currentUser.lastName ? ` ${currentUser.lastName}` : ''),
        email: currentUser.emailAddresses?.[0]?.emailAddress
      },
      totalUsers: users.data.length,
      users: users.data.map(user => ({
        id: user.id,
        name: user.fullName || user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
        email: user.emailAddresses?.[0]?.emailAddress
      }))
    });

  } catch (error) {
    console.error("Clerk test error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.errors || error
    }, { status: 500 });
  }
}
