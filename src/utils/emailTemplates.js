export const welcomeEmail = (toEmail, name) => {
  const firstName = name ? name.split(" ")[0] : "there";

  return {
    from: `"Image Processing App" <${process.env.SENDER_EMAIL || 'no-reply@yourapp.com'}>`,
    to: toEmail,
    subject: `Welcome to ImageApp, ${firstName}! ✨`,
    text: `Hi ${firstName},\n\nWelcome to ImageApp! We're thrilled to have you on board. Your free account is officially active.\n\nStart optimizing your images here: ${process.env.APP_URL || 'http://localhost:3000'}\n\nCheers,\nThe ImageApp Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ImageApp</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; padding-top: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .content h2 { color: #111827; font-size: 20px; margin-top: 0; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background-color: #4f46e5; color: #ffffff !important; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2); }
          .footer { padding: 24px 32px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; background-color: #fafafa; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>📸 ImageApp</h1>
            </div>
            <div class="content">
              <h2>Hey ${firstName},</h2>
              <p>Welcome on board! We're incredibly excited to help you optimize, compress, and transform your media seamlessly.</p>
              <p>Your free account has been successfully created and your starter workspace is ready to go.</p>
              
              <div class="btn-container">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="btn" target="_blank">Go to Your Dashboard</a>
              </div>
              
              <p>If you have any questions or hit any snags, feel free to reply directly to this email—we're here to help.</p>
              <p>Cheers,<br><strong>The ImageApp Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ImageApp. All rights reserved.</p>
              <p>If you didn't sign up for this account, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export const subscriptionEmail = (toEmail, name) => {
  const firstName = name ? name.split(" ")[0] : "there";

  return {
    from: `"Image Processing App" <${process.env.SENDER_EMAIL || 'no-reply@yourapp.com'}>`,
    to: toEmail,
    subject: `Your ImageApp Premium subscription is active! 🚀`,
    text: `Hi ${firstName},\n\nThank you for choosing ImageApp Premium! Your subscription is now active.\n\nYou now have full access to advanced image optimizations, background removal tools, and priority processing.\n\nManage your subscription status here: ${process.env.APP_URL || 'http://localhost:3000'}/dashboard\n\nCheers,\nThe ImageApp Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Activated</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; padding-top: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .content h2 { color: #111827; font-size: 20px; margin-top: 0; }
          .receipt-box { background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb; }
          .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .receipt-row.total { border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 16px; color: #111827; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background-color: #059669; color: #ffffff !important; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
          .footer { padding: 24px 32px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; background-color: #fafafa; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>⚡ Subscription Active</h1>
            </div>
            <div class="content">
              <h2>Thank you for upgrading, ${firstName}!</h2>
              <p>Your subscription transaction has cleared successfully. Your account limits have been instantly lifted, and your advanced media workspace tools are unlocked.</p>
              
              <p><strong>What you get right now:</strong></p>
              <ul style="padding-left: 20px; margin: 0;">
                <li>Unlimited batch image compression</li>
                <li>Ultra-high resolution processing</li>
                <li>Priority server-side rendering queue execution</li>
              </ul>

              <div class="btn-container">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="btn" target="_blank">Launch Workspace</a>
              </div>
              
              <p>If you need to change your auto-renewal preferences, adjust payment details, or download past invoices, you can do so at any time directly through your billing portal settings page.</p>
              <p>Cheers,<br><strong>The ImageApp Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ImageApp. All rights reserved.</p>
              <p>Security Note: Always ensure you log into your account via official domains.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};