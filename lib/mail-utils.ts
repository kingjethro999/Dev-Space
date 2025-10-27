import { GMAIL_SMTP_USER, GMAIL_APP_PASSWORD } from "./mail"

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface WelcomeEmailData {
  username: string
  firstName: string
  isReturningUser?: boolean
}

export interface NotificationEmailData {
  username: string
  notificationType: string
  message: string
  actionLink?: string
}

// Send email using your Gmail SMTP credentials
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: GMAIL_SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Send welcome email to new users or returning users
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const isReturning = data.isReturningUser
  const greeting = isReturning ? "Welcome back to DevSpace!" : "Welcome to DevSpace!"
  const subject = isReturning ? "Glad to have you back!" : "Welcome to DevSpace - Your Developer Community Awaits!"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${greeting}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { width: 60px; height: 60px; margin: 0 auto 20px; display: block; }
        .logo-container { display: flex; align-items: center; justify-content: center; gap: 15px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .footer-logo { width: 30px; height: 30px; margin: 0 auto 10px; display: block; opacity: 0.7; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .feature-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { margin: 10px 0; padding: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="https://dev-space.vercel.app/dev-space-icon-transparent.png" alt="Dev Space Logo" class="logo">
            <h1 style="margin: 0;">${greeting} 🚀</h1>
          </div>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName}!</h2>
          
          ${isReturning ? `
            <p>It's great to see you back on DevSpace! We've missed having you in our developer community.</p>
            
            <div class="highlight">
              <strong>What's New Since You Left:</strong>
              <ul>
                <li>🎉 New real-time features for instant collaboration</li>
                <li>💬 Enhanced messaging system for better communication</li>
                <li>🔔 Smart notifications to keep you updated</li>
                <li>📱 Improved mobile experience</li>
              </ul>
            </div>
            
            <p>Ready to jump back in? Here's how to get the most out of DevSpace:</p>
          ` : `
            <p>Welcome to DevSpace, the developer community platform where developers connect, collaborate, and grow together!</p>
            
            <p>We're excited to have you join our community of passionate developers. DevSpace is designed to help you:</p>
          `}
          
          <div class="feature-list">
            <h3>🚀 Getting Started Guide</h3>
            
            <div class="feature-item">
              <strong>📁 Share Your Projects</strong><br>
              Showcase your work, get feedback, and inspire other developers. Upload your code, add descriptions, and let the community help you improve.
            </div>
            
            <div class="feature-item">
              <strong>🤝 Find Collaborators</strong><br>
              Connect with developers who share your interests. Build teams for hackathons, open source projects, or startup ideas.
            </div>
            
            <div class="feature-item">
              <strong>💬 Join Discussions</strong><br>
              Ask questions, share knowledge, and learn from experienced developers. Our community is always ready to help!
            </div>
            
            <div class="feature-item">
              <strong>📚 Learn & Grow</strong><br>
              Discover new technologies, best practices, and career opportunities. Follow developers you admire and learn from their journeys.
            </div>
            
            <div class="feature-item">
              <strong>🔔 Stay Connected</strong><br>
              Get real-time notifications for likes, comments, messages, and project updates. Never miss important interactions!
            </div>
          </div>
          
          <div class="highlight">
            <strong>💡 Pro Tips for Success:</strong>
            <ul>
              <li>Complete your profile with a clear bio and skills</li>
              <li>Upload a professional profile picture</li>
              <li>Start by commenting on other developers' projects</li>
              <li>Share your learning journey, not just finished projects</li>
              <li>Be active in discussions and help others</li>
            </ul>
          </div>
          
          <p>${isReturning ? 'Ready to reconnect with the community?' : 'Ready to start your developer journey?'}</p>
          
          <a href="https://dev-space.vercel.app/feed" class="button">
            ${isReturning ? 'Explore What\'s New' : 'Start Exploring DevSpace'}
          </a>
          
          <p>If you have any questions or need help getting started, don't hesitate to reach out to our community or contact support.</p>
          
          <p>Happy coding!<br>
          The DevSpace Team</p>
        </div>
        <div class="footer">
          <img src="https://dev-space.vercel.app/dev-space-icon-transparent.png" alt="Dev Space Logo" class="footer-logo">
          <p>This email was sent to ${data.username}. If you didn't create an account, please ignore this email.</p>
          <p>© 2025 DevSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    ${greeting}
    
    Hi ${data.firstName}!
    
    ${isReturning ? 
      `It's great to see you back on DevSpace! We've missed having you in our developer community.` :
      `Welcome to DevSpace, the developer community platform where developers connect, collaborate, and grow together!`
    }
    
    ${isReturning ? 
      `What's New Since You Left:
      - New real-time features for instant collaboration
      - Enhanced messaging system for better communication
      - Smart notifications to keep you updated
      - Improved mobile experience` :
      `We're excited to have you join our community of passionate developers.`
    }
    
    Getting Started Guide:
    
    📁 Share Your Projects - Showcase your work, get feedback, and inspire other developers
    🤝 Find Collaborators - Connect with developers who share your interests
    💬 Join Discussions - Ask questions, share knowledge, and learn from experienced developers
    📚 Learn & Grow - Discover new technologies, best practices, and career opportunities
    🔔 Stay Connected - Get real-time notifications for important interactions
    
    Pro Tips for Success:
    - Complete your profile with a clear bio and skills
    - Upload a professional profile picture
    - Start by commenting on other developers' projects
    - Share your learning journey, not just finished projects
    - Be active in discussions and help others
    
    ${isReturning ? 'Ready to reconnect with the community?' : 'Ready to start your developer journey?'}
    
    Visit: https://dev-space.vercel.app/feed
    
    Happy coding!
    The DevSpace Team
  `

  return await sendEmail({
    to: data.username,
    subject,
    html,
    text,
  })
}

// Send notification email
export async function sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DevSpace Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { width: 50px; height: 50px; margin: 0 auto 15px; display: block; }
        .logo-container { display: flex; align-items: center; justify-content: center; gap: 15px; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .footer-logo { width: 30px; height: 30px; margin: 0 auto 10px; display: block; opacity: 0.7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="https://dev-space.vercel.app/dev-space-icon-transparent.png" alt="Dev Space Logo" class="logo">
            <h2 style="margin: 0;">DevSpace Notification</h2>
          </div>
        </div>
        <div class="content">
          <h3>Hi ${data.username}!</h3>
          <p>${data.message}</p>
          
          ${data.actionLink ? `
            <a href="${data.actionLink}" class="button">View Details</a>
          ` : ''}
          
          <p>Best regards,<br>
          The DevSpace Team</p>
        </div>
        <div class="footer">
          <img src="https://dev-space.vercel.app/dev-space-icon-transparent.png" alt="Dev Space Logo" class="footer-logo">
          <p>© 2025 DevSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.username,
    subject: `DevSpace: ${data.notificationType}`,
    html,
  })
}

