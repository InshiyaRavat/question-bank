import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logAdminActivity, ADMIN_ACTIONS, RESOURCE_TYPES, extractClientInfo } from "@/lib/adminLogger";
import { clerkClient } from "@clerk/nextjs/server";
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Helper function to get admin info
async function getAdminInfo() {
  const { userId, sessionClaims } = await auth();
  const adminName =
    sessionClaims?.firstName && sessionClaims?.lastName
      ? `${sessionClaims.firstName} ${sessionClaims.lastName}`.trim()
      : sessionClaims?.username || "Unknown Admin";

  return { adminId: userId, adminName };
}

// Helper function to send email using your existing nodemailer configuration
async function sendEmail(to, subject, message, attachment = null) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS in .env file');
    }

    // Create transporter using your existing Gmail configuration
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // From your .env file
        pass: process.env.EMAIL_PASS, // From your .env file
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sends from the email in your .env file
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">Question Bank System</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Admin Message</p>
          </div>
          <div style="padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
              ${message}
            </div>
            ${attachment ? `
              <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Attachment:</strong> ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
                </p>
                <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                  Note: File attachments are not included in this email. Please contact the administrator for the file.
                </p>
              </div>
            ` : ''}
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              This email was sent from the Question Bank System Admin Panel
            </p>
            <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
              Please do not reply to this email. Contact your administrator if you have questions.
            </p>
          </div>
        </div>
      `,
    };

    // Add attachment if provided
    if (attachment && attachment.data) {
      mailOptions.attachments = [{
        filename: attachment.name,
        content: attachment.data.split(',')[1], // Remove data:application/...;base64, prefix
        encoding: 'base64'
      }];
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    
    return { 
      success: true, 
      messageId: info.messageId || `email_${Date.now()}`,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// GET /api/admin/send-email - Get user details for email preview
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    
    if (userIds.length === 0) {
      return Response.json({ error: 'No user IDs provided' }, { status: 400 });
    }

    const clerk = await clerkClient();
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await clerk.users.getUser(userId);
          return {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses?.[0]?.emailAddress || '',
            username: user.username || ''
          };
        } catch (error) {
          return { id: userId, error: 'User not found' };
        }
      })
    );

    return Response.json({ users });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return Response.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

// POST /api/admin/send-email - Send emails
export async function POST(req) {
  try {
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);
    
    if (!adminId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userIds, subject, message, attachment, filters } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'User IDs are required' }, { status: 400 });
    }

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Limit bulk email operations
    if (userIds.length > 100) {
      return Response.json({ error: 'Cannot send email to more than 100 users at once' }, { status: 400 });
    }

    const clerk = await clerkClient();
    const results = {
      successful: [],
      failed: [],
      totalProcessed: userIds.length
    };

    // Get user details for logging
    const userDetails = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await clerk.users.getUser(userId);
          return {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown'
          };
        } catch (error) {
          return { id: userId, email: '', name: 'Unknown', error: true };
        }
      })
    );

    // Send emails
    for (const userDetail of userDetails) {
      if (userDetail.error) {
        results.failed.push({
          id: userDetail.id,
          name: userDetail.name,
          error: 'User not found'
        });
        continue;
      }

      try {
        console.log(`Attempting to send email to ${userDetail.email}...`);
        const emailResult = await sendEmail(
          userDetail.email,
          subject,
          message,
          attachment
        );

        console.log(`Email result for ${userDetail.email}:`, emailResult);

        if (emailResult.success) {
          results.successful.push({
            id: userDetail.id,
            name: userDetail.name,
            email: userDetail.email,
            messageId: emailResult.messageId
          });
          console.log(`✅ Email sent successfully to ${userDetail.email}`);
        } else {
          results.failed.push({
            id: userDetail.id,
            name: userDetail.name,
            email: userDetail.email,
            error: emailResult.error || 'Email sending failed'
          });
          console.log(`❌ Email failed for ${userDetail.email}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`❌ Exception sending email to ${userDetail.email}:`, error);
        results.failed.push({
          id: userDetail.id,
          name: userDetail.name,
          email: userDetail.email,
          error: error.message
        });
      }
    }

    // Log summary
    console.log(`📧 Email sending completed:`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   📊 Total: ${results.totalProcessed}`);
    
    if (results.failed.length > 0) {
      console.log(`   Failed emails details:`, results.failed);
    }

    // Log the email activity
    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.EMAIL_SENT,
      resource: RESOURCE_TYPES.USER,
      resourceId: null, // Bulk operation
      details: {
        subject,
        messageLength: message.length,
        totalRecipients: results.totalProcessed,
        successfulEmails: results.successful.length,
        failedEmails: results.failed.length,
        filters: filters || null,
        hasAttachment: !!attachment,
        recipients: results.successful.map(r => ({ id: r.id, name: r.name, email: r.email })),
        failedRecipients: results.failed.map(r => ({ id: r.id, name: r.name, email: r.email, error: r.error }))
      },
      ipAddress,
      userAgent
    });

    return Response.json({
      success: true,
      results,
      message: `Successfully sent ${results.successful.length} of ${results.totalProcessed} emails`
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return Response.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
