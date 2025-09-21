import { auth } from "@clerk/nextjs/server";
import nodemailer from 'nodemailer';

// Test endpoint to verify email configuration
export async function GET(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return Response.json({ 
        error: 'Email credentials not configured',
        details: 'Please check EMAIL_USER and EMAIL_PASS in your .env file',
        fromEmail: process.env.EMAIL_USER || 'Not configured'
      }, { status: 400 });
    }

    // Test email configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify configuration
    await transporter.verify();

    return Response.json({
      success: true,
      message: 'Email configuration is valid',
      fromEmail: process.env.EMAIL_USER,
      service: 'Gmail',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email configuration test failed:', error);
    return Response.json({ 
      error: 'Email configuration test failed',
      details: error.message,
      fromEmail: process.env.EMAIL_USER || 'Not configured',
      commonIssues: [
        'Check if EMAIL_USER and EMAIL_PASS are set in .env file',
        'Ensure you are using an App Password for Gmail (not your regular password)',
        'Make sure 2-Factor Authentication is enabled on your Gmail account',
        'Verify the Gmail account has "Less secure app access" enabled or use App Passwords'
      ]
    }, { status: 500 });
  }
}
