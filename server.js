const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load variables from .env file for local testing

const app = express();
app.use(express.json());
app.use(cors());

// 1. YOUR CASHFREE KEYS (Safely pulled from environment)
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Security: Server-authoritative Pricing Registry fallbacks
const RZP_AMOUNTS = {
    basic: { INR: 100, USD: 2 },
    pro: { INR: 1500, USD: 18 },
    autocaptions: { INR: 800, USD: 10 }
};

const RZP_AMOUNTS_DEADLINE = {
    basic: { INR: 100, USD: 2 },
    pro: { INR: 2000, USD: 24 },
    autocaptions: { INR: 800, USD: 10 }
};

const PRICE_DEADLINE = new Date('2026-03-20T23:59:59+05:30');

function isPastDeadline() {
    return new Date() > PRICE_DEADLINE;
}

// Fetch dynamic pricing from Firestore REST API
async function getFirestorePricing() {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (!projectId) return null;
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/pricing`;
        const res = await axios.get(url, { timeout: 3000 });
        if (res.data && res.data.fields) {
            const pricing = {};
            for (const [key, val] of Object.entries(res.data.fields)) {
                if (val.integerValue !== undefined) pricing[key] = parseInt(val.integerValue);
                else if (val.doubleValue !== undefined) pricing[key] = parseFloat(val.doubleValue);
            }
            return pricing;
        }
        return null;
    } catch (err) {
        console.warn('[Firestore] Falling back to default pricing:', err.message);
        return null;
    }
}

const BASE_URL = IS_PRODUCTION
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

app.post('/create-order', async (req, res) => {
    try {
        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            return res.status(500).json({ error: "API Keys missing from environment" });
        }

        const { tier, currency, name, email, phone } = req.body;

        // NEW: Try to get dynamic pricing first
        let verifiedAmount;
        const firestorePricing = await getFirestorePricing();
        
        if (firestorePricing) {
            const currKey = currency === 'USD' ? 'usd' : 'inr';
            const priceKey = `${tier}_${currKey}`;
            verifiedAmount = firestorePricing[priceKey];
        }

        // Fallback to hardcoded registry
        if (!verifiedAmount) {
            const registry = isPastDeadline() ? RZP_AMOUNTS_DEADLINE : RZP_AMOUNTS;
            verifiedAmount = registry[tier]?.[currency || "INR"];
        }

        if (!verifiedAmount) {
            return res.status(400).json({ error: "Invalid tier or currency" });
        }

        const response = await axios.post(BASE_URL, {
            order_id: "order_" + Date.now(),
            order_amount: verifiedAmount,
            order_currency: currency || "INR",
            customer_details: {
                customer_id: "cust_" + Date.now(),
                customer_name: name,
                customer_email: email,
                customer_phone: phone
            }
        }, {
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            }
        });

        res.json({ payment_session_id: response.data.payment_session_id });

    } catch (error) {
        console.error("Payment Error:", error.response ? error.response.data : error.message);
        res.status(500).json({
            error: "Failed to create payment session",
            details: error.response ? error.response.data.message : error.message,
            code: error.response && error.response.data.code ? error.response.data.code : ""
        });
    }
});

app.post('/verify-payment', async (req, res) => {
    try {
        const { paymentId, method, tier, name, email, phone } = req.body;
        const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
        const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
        const IS_PRODUCTION = process.env.NODE_ENV === 'production';

        let isVerified = false;
        let amountPaid = "N/A";

        if (method === 'cashfree') {
            const baseUrl = IS_PRODUCTION
                ? `https://api.cashfree.com/pg/payments/${paymentId}`
                : `https://sandbox.cashfree.com/pg/payments/${paymentId}`;

            const cfRes = await axios.get(baseUrl, {
                headers: {
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY,
                    'x-api-version': '2023-08-01'
                }
            });
            if (cfRes.data && cfRes.data.payment_status === 'SUCCESS') {
                isVerified = true;
                amountPaid = `${cfRes.data.payment_currency} ${cfRes.data.payment_amount}`;
            }
        } else if (method === 'razorpay') {
            // Local Razorpay verification (dummy success if no secret, same as production)
            isVerified = true;
        }

        if (isVerified) {
            // Send FINAL Success Notification to Formspree from Server
            await axios.post('https://formspree.io/f/xykbqznk', {
                _subject: `✅ VERIFIED PURCHASE: ${tier}`,
                name: name,
                email: email,
                phone: phone,
                payment_id: paymentId,
                gateway: method,
                amount: amountPaid,
                verification: "SERVER_CONFIRMED",
                timestamp: new Date().toISOString()
            }, { headers: { 'Accept': 'application/json' } }).catch(e => console.error("Formspree Error:", e.message));

            return res.json({ verified: true });
        } else {
            return res.status(403).json({ verified: false, error: "Payment not verified" });
        }
    } catch (error) {
        console.error("Local Verify Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. SEND LICENSE EMAIL (For local testing)
app.post('/send-license', async (req, res) => {
    try {
        const { email, name, tier, licenseLink, message } = req.body;

        if (!email || !licenseLink) {
            return res.status(400).json({ success: false, error: "Missing email or link" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"Easy Workflow Support" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `🔥 Access Granted | Your ${tier ? tier.toUpperCase() : ''} Toolkit is Ready!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                        .wrapper { background-color: #050505; width: 100%; padding: 40px 0; }
                        .container { max-width: 600px; margin: 0 auto; background: #0c0c10; border: 1px solid #1a1a24; border-radius: 24px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
                        .top-accent { height: 6px; background: linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4); }
                        .hero { padding: 50px 40px; text-align: center; background: radial-gradient(circle at top, rgba(124, 58, 237, 0.15) 0%, transparent 70%); }
                        .badge { display: inline-block; padding: 6px 12px; border-radius: 100px; background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); color: #a855f7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
                        .h1 { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
                        .content { padding: 0 50px 40px; }
                        .personal-note { background: #13131a; border-radius: 16px; padding: 24px; color: #e2e8f0; line-height: 1.7; font-size: 15px; border: 1px solid #1e1e2d; position: relative; }
                        .roadmap { margin: 40px 0; border-left: 2px dashed #1e1e2d; margin-left: 20px; padding-left: 30px; }
                        .step { position: relative; margin-bottom: 30px; }
                        .step-dot { position: absolute; left: -41px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: #0c0c10; border: 2px solid #7c3aed; }
                        .step-title { color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
                        .step-desc { color: #94a3b8; font-size: 13px; line-height: 1.5; }
                        .cta-area { text-align: center; padding: 20px 0 40px; }
                        .main-btn { display: inline-block; background: #ffffff; color: #000000 !important; padding: 20px 45px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 18px; box-shadow: 0 15px 35px rgba(255,255,255,0.1); }
                        .support-footer { background: #09090b; padding: 30px 50px; text-align: center; border-top: 1px solid #1a1a24; }
                        .brand { color: #ffffff; font-weight: 800; font-size: 18px; margin-top: 15px; display: block; }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="top-accent"></div>
                            <div class="hero">
                                <span class="badge">Payment Verified ✅</span>
                                <h1 class="h1">Access Granted.</h1>
                            </div>
                            <div class="content">
                                <div class="personal-note">${message || "Hi " + (name || 'Creator') + "! I've verified your payment. Your toolkit is ready for download."}</div>
                                <div class="roadmap">
                                    <div class="step"><div class="step-dot"></div><div class="step-title">1. Open the Secure Link</div><div class="step-desc">Click the white button below. It will open your personal access page on Gumroad.</div></div>
                                    <div class="step"><div class="step-dot" style="border-color: #3b82f6;"></div><div class="step-title">2. Claim for $0</div><div class="step-desc">The 100% discount is pre-applied. If prompted for a price, simply enter 0 and click "Pay".</div></div>
                                    <div class="step" style="margin-bottom: 0;"><div class="step-dot" style="border-color: #06b6d4;"></div><div class="step-title">3. Download & Install</div><div class="step-desc">You'll get instant access to the project files and the installation guide.</div></div>
                                </div>
                                <div class="cta-area"><a href="${licenseLink}" class="main-btn">DOWNLOAD ACCESS →</a></div>
                            </div>
                            <div class="support-footer"><span class="brand">⚡ EASY WORKFLOW</span></div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });

    } catch (error) {
        console.error("Local Send License Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('✅ Local Payment Server ready at http://localhost:3000'));
