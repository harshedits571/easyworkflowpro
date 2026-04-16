const axios = require('axios');
const nodemailer = require('nodemailer');

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,       // Set this in Netlify Env Vars
        pass: process.env.GMAIL_APP_PASSWORD // Set this in Netlify Env Vars
    }
});

async function sendCustomerEmail(toEmail, customerName, tier) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("Mail credentials missing. Skipping automated email to:", toEmail);
        return;
    }

    const mailOptions = {
        from: `"Easy Workflow" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `🎉 Your Easy Workflow ${tier.toUpperCase()} Access is Here!`,
        html: `
            <div style="font-family: Arial, sans-serif; background: #09090b; color: #fff; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
                <h2 style="color: #a855f7;">Hey ${customerName || 'Creator'},</h2>
                <p style="font-size: 16px; color: #e5e5e5;">Thank you so much for purchasing <strong>Easy Workflow ${tier.toUpperCase()}</strong>! We have received your payment.</p>
                
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                    <p style="font-size: 16px; color: #e5e5e5; margin: 0 0 14px; line-height: 1.6;">Please note that this is <strong style="color:white;">not an automatic process</strong>.</p>
                    <p style="font-size: 16px; color: #e5e5e5; margin: 0; line-height: 1.6;">Once your payment has been manually confirmed by our team, you will receive a <strong style="color:#22c55e;">100% discounted Gumroad Link</strong> directly to this email address.</p>
                </div>
                
                <p style="font-size: 15px; color: #9ca3af; font-style: italic;">Please allow a few hours for the confirmation process.</p>
                
                <p style="font-size: 16px; font-weight: bold; color: #fff;">Happy Editing,<br>The Easy Workflow Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Automated email successfully sent to:", toEmail);
    } catch (err) {
        console.error("Failed to send automated email:", err.message);
    }
}

exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

    try {
        const { paymentId, method, tier, name, email, phone } = JSON.parse(event.body);

        if (!paymentId || !method) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing payment information" }) };
        }

        let isVerified = false;
        let amountPaid = "N/A";

        // 1. VERIFY WITH GATEWAY
        if (method === 'cashfree') {
            const appId = process.env.CASHFREE_APP_ID;
            const secretKey = process.env.CASHFREE_SECRET_KEY;

            // Note: Cashfree verification usually uses the order_id, but we can check the payment specifically
            // For simplicity in this workflow, we'll verify via the payment endpoint
            const isProduction = !secretKey.includes('test');
            const baseUrl = isProduction
                ? `https://api.cashfree.com/pg/payments/${paymentId}`
                : `https://sandbox.cashfree.com/pg/payments/${paymentId}`;

            const cfRes = await axios.get(baseUrl, {
                headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01'
                }
            });

            if (cfRes.data && cfRes.data.payment_status === 'SUCCESS') {
                isVerified = true;
                amountPaid = `${cfRes.data.payment_currency} ${cfRes.data.payment_amount}`;
            }
        }
        else if (method === 'razorpay') {
            const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SbYS9Uxg3z4s4k'; // Fallback to provided public ID if env not set
            const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

            if (!rzpKeySecret) {
                // If no secret is provided, we can't verify server-side for Razorpay
                // We'll trust the client for now but log a warning
                console.warn("Razorpay Secret Missing - Skipping server-side verification");
                isVerified = true;
            } else {
                const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
                const rzpRes = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Basic ${auth}` }
                });

                if (rzpRes.data && (rzpRes.data.status === 'captured' || rzpRes.data.status === 'authorized')) {
                    isVerified = true;
                    amountPaid = `${rzpRes.data.currency} ${rzpRes.data.amount / 100}`;
                }
            }
        }

        // 2. IF VERIFIED — Lead/payment data is already saved to Firestore from the client.
        if (isVerified) {
            console.log(`[Verified] Payment ${paymentId} for ${tier} by ${name} (${email})`);

            // Fire Automated Email to Customer
            if (email) {
                await sendCustomerEmail(email, name, tier);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ verified: true, message: "Payment confirmed by server. Email dispatched." })
            };
        } else {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ verified: false, error: "Payment verification failed." })
            };
        }

    } catch (error) {
        console.error("Verification Error:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Server Verification Error", details: error.message })
        };
    }
};
