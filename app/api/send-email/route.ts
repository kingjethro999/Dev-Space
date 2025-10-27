import { NextRequest, NextResponse } from 'next/server'
import { GMAIL_SMTP_USER, GMAIL_APP_PASSWORD } from '@/lib/mail'
// import nodemailer from 'nodemailer'
import * as nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { from, to, subject, html, text } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    // Create transporter using your Gmail SMTP credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_SMTP_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })

    // Email options
    const mailOptions = {
      from: `"Dev Space" <${GMAIL_SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Basic text fallback
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
