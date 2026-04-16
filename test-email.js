require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const testEmail = process.env.GMAIL_USER; // It will send an email to yourself as a test!

const mailOptions = {
    from: `"Easy Workflow (Test)" <${process.env.GMAIL_USER}>`,
    to: testEmail,
    subject: `🎉 Your Easy Workflow PRO Access is Here! (TEST)`,
    html: `
        <div style="font-family: Arial, sans-serif; background: #09090b; color: #fff; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
            <h2 style="color: #a855f7;">Hey Creator,</h2>
            <p style="font-size: 16px; color: #e5e5e5;">Thank you so much for purchasing <strong>Easy Workflow PRO</strong>! We have received your payment.</p>
            
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                <p style="font-size: 16px; color: #e5e5e5; margin: 0 0 14px; line-height: 1.6;">Please note that this is <strong style="color:white;">not an automatic process</strong>.</p>
                <p style="font-size: 16px; color: #e5e5e5; margin: 0; line-height: 1.6;">Once your payment has been manually confirmed by our team, you will receive a <strong style="color:#22c55e;">100% discounted Gumroad Link</strong> directly to this email address.</p>
            </div>
            
            <p style="font-size: 15px; color: #9ca3af; font-style: italic;">Please allow a few hours for the confirmation process.</p>
            
            <p style="font-size: 16px; font-weight: bold; color: #fff;">Happy Editing,<br>The Easy Workflow Team</p>
        </div>
    `
};

console.log(`⏳ Attempting to send test email out from ${process.env.GMAIL_USER}...`);

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log("❌ ERROR! Failed to send email. Check your GMAIL_APP_PASSWORD and make sure you do not have spaces in it!");
        console.log("Detailed Error: ", error.message);
    } else {
        console.log("✅ SUCCESS! Test Email sent flawlessly: " + info.response);
        console.log("Check your Gmail inbox right now!");
    }
});
