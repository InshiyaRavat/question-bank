import nodemailer from 'nodemailer';

export async function POST(req) {
  console.log("inside post request email ")
  try {
    const body = await req.json();
    const { email , html, subject} = body;

    if (!email) {
      console.error('No email provided in the request body');
      return new Response('Email is required', { status: 400 });
    }

    console.log('Received request to send email to:', email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    console.log('Nodemailer transporter created successfully');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    return new Response('Email sent successfully', { status: 200 });
  } catch (error) {
    console.error('Error in /api/Email:', error.message);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
