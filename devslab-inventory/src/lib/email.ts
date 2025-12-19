import nodemailer from 'nodemailer'

export async function sendTestEmail({
  email,
  name,
  password,
  role,
  branchName
}: any) {
  try {
    // 1. Create a test SMTP account
    const testAccount = await nodemailer.createTestAccount()
    
    // 2. Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    // 3. Send email
    const info = await transporter.sendMail({
      from: '"DEVSLAB Inventory" <noreply@devslab-test.com>',
      to: email,
      subject: "Your DEVSLAB Inventory Account Credentials",
      text: `
Welcome to DEVSLAB Inventory System!

Your account has been created:
Email: ${email}
Password: ${password}
Role: ${role}
${branchName ? `Branch: ${branchName}` : ''}

Login at: http://localhost:3000/login

This is a temporary password. Please change it immediately.
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #2563eb;">Welcome to DEVSLAB Inventory System!</h2>
  <p>Your account has been created with the following details:</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Login Credentials:</h3>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
    <p><strong>Role:</strong> ${role}</p>
    ${branchName ? `<p><strong>Branch:</strong> ${branchName}</p>` : ''}
  </div>
  
  <p><a href="http://localhost:3000/login" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login Now</a></p>
  
  <p style="color: #dc2626; font-weight: bold;">⚠️ This is a temporary password. Please change it immediately after login.</p>
  
  <hr style="margin: 30px 0;">
  <p style="color: #6b7280; font-size: 12px;">This is a test email from DEVSLAB Inventory System.</p>
</div>
      `,
    })

    // 4. Get preview URL (for testing)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log("📧 Test email sent!")
    console.log("👀 Preview URL:", previewUrl)
    
    return {
      success: true,
      previewUrl, // You can show this to admin
      message: `Email sent to ${email}. Preview: ${previewUrl}`
    }
    
  } catch (error: any) {
    console.error("Email error:", error)
    return { success: false, error: error.message }
  }
}