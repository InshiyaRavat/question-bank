import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { logAdminActivity, ADMIN_ACTIONS, RESOURCE_TYPES, extractClientInfo } from "@/lib/adminLogger";

// Helper function to get admin info
async function getAdminInfo() {
  const { userId, sessionClaims } = await auth();
  const adminName =
    sessionClaims?.firstName && sessionClaims?.lastName
      ? `${sessionClaims.firstName} ${sessionClaims.lastName}`.trim()
      : sessionClaims?.username || "Unknown Admin";

  return { adminId: userId, adminName };
}

// PUT /api/admin/users/profile - Update user profile
export async function PUT(req) {
  try {
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);
    
    if (!adminId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, firstName, lastName, username, email, birthday, newPassword } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const clerk = await clerkClient();

    // Get current user info for logging
    const currentUser = await clerk.users.getUser(userId);
    const currentEmail = currentUser.emailAddresses?.[0]?.emailAddress || '';

    // Prepare update data
    const updateData = {
      firstName: firstName || currentUser.firstName,
      lastName: lastName || currentUser.lastName,
      username: username || currentUser.username,
    };

    // Add birthday to public metadata if provided
    if (birthday) {
      updateData.publicMetadata = {
        ...currentUser.publicMetadata,
        dob: birthday,
      };
    }

    // Update email if provided and different
    if (email && email !== currentEmail) {
      // For email updates, we need to use a different approach
      // This is a simplified version - in production, you might want to
      // send a verification email or use a different method
      updateData.emailAddress = [email];
    }

    // Update password if provided
    if (newPassword) {
      updateData.password = newPassword;
    }

    // Update the user
    const updatedUser = await clerk.users.updateUser(userId, updateData);

    // Log the profile update activity
    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.USER_PROFILE_UPDATED,
      resource: RESOURCE_TYPES.USER,
      resourceId: userId,
      details: {
        targetUserEmail: currentEmail,
        targetUserName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Unknown',
        changes: {
          firstName: firstName !== currentUser.firstName ? { from: currentUser.firstName, to: firstName } : null,
          lastName: lastName !== currentUser.lastName ? { from: currentUser.lastName, to: lastName } : null,
          username: username !== currentUser.username ? { from: currentUser.username, to: username } : null,
          email: email !== currentEmail ? { from: currentEmail, to: email } : null,
          birthday: birthday !== currentUser.publicMetadata?.dob ? { from: currentUser.publicMetadata?.dob, to: birthday } : null,
          passwordChanged: !!newPassword,
        },
      },
      ipAddress,
      userAgent
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.emailAddresses?.[0]?.emailAddress || '',
        birthday: updatedUser.publicMetadata?.dob || null,
        role: updatedUser.publicMetadata?.role || 'student',
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}

// POST /api/admin/users/profile/reset-password - Reset user password
export async function POST(req) {
  try {
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);
    
    if (!adminId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return Response.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const clerk = await clerkClient();

    // Get current user info for logging
    const currentUser = await clerk.users.getUser(userId);

    // Update password
    await clerk.users.updateUser(userId, {
      password: newPassword,
    });

    // Log the password reset activity
    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.USER_PASSWORD_RESET,
      resource: RESOURCE_TYPES.USER,
      resourceId: userId,
      details: {
        targetUserEmail: currentUser.emailAddresses?.[0]?.emailAddress || '',
        targetUserName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Unknown',
        passwordResetBy: 'admin',
      },
      ipAddress,
      userAgent
    });

    return Response.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
