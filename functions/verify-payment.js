const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const admin = require('firebase-admin');

let firebaseInitError = null;
// Initialize Firebase Admin securely using environment variable
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin Initialized successfully.");
        } else {
            firebaseInitError = "FIREBASE_SERVICE_ACCOUNT env var is missing.";
            console.warn(firebaseInitError);
        }
    } catch (e) {
        firebaseInitError = "JSON parse error: " + e.message;
        console.warn("Firebase Admin init failed. Check FIREBASE_SERVICE_ACCOUNT JSON format.", e.message);
    }
}

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,       // Set this in Netlify Env Vars
        pass: process.env.GMAIL_APP_PASSWORD // Set this in Netlify Env Vars
    }
});

function generate16DigitKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) key += '-';
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key; // Format: XXXX-XXXX-XXXX-XXXX
}

async function sendCustomerEmail(toEmail, customerName, tier, licenseKey = null, paymentId = null, isPending = false) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("Mail credentials missing. Skipping automated email to:", toEmail);
        return;
    }

    const isProjectManager = tier.toLowerCase().replace(/\s+/g, '').includes('projectmanager');
    const isBasic = tier.toLowerCase().replace(/\s+/g, '').includes('basic');
    let subject = isPending ? `⏳ Action Required: Your ${tier.toUpperCase()} Payment` : `🎉 Your ${tier.toUpperCase()} Access is Here!`;
    let bodyHtml = '';

    let downloadLink = isProjectManager ? "https://easyworkflow.store/download/project-manager-pro" : "https://easyworkflow.store/download/basic";
    
    // Fetch dynamic download link from Admin Panel config
    if ((isProjectManager || isBasic) && admin.apps.length) {
        try {
            const db = admin.firestore();
            const dlSnap = await db.collection('config').doc('downloads').get();
            if (dlSnap.exists) {
                const links = dlSnap.data();
                if (isProjectManager && links.projectmanager) {
                    downloadLink = links.projectmanager;
                } else if (isBasic && links.basic) {
                    downloadLink = links.basic;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic download link for email:", e.message);
        }
    }

    if (isPending) {
        // --- PAYMENT PENDING TEMPLATE ---
        subject = `⏳ Payment Processing: ${tier.toUpperCase()}`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden;">
                    <div style="background: #1e293b; padding: 40px 30px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 10px;">⏳</div>
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Payment Processing</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">We noticed that your payment for <strong>${tier.toUpperCase()}</strong> is currently being processed by your bank or the payment gateway.</p>
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin: 30px 0;">
                            <p style="margin: 0; font-size: 15px; color: #60a5fa; line-height: 1.6;">
                                <strong>Don't worry!</strong> This is common for some international or high-value transactions. As soon as we receive the "Success" confirmation from the gateway, your license key will be sent to you automatically.
                            </p>
                        </div>
                        <h3 style="font-size: 16px; color: #ffffff;">What happens next?</h3>
                        <ul style="color: #a1a1aa; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                            <li>Our system is monitoring your transaction every few minutes.</li>
                            <li>Once confirmed, you will receive a second email with your <strong>License Key</strong> and <strong>Download Link</strong>.</li>
                            <li>If the payment fails, you will receive a refund notification from your bank.</li>
                        </ul>
                        <p style="color: #71717a; font-size: 14px; margin-top: 30px; font-style: italic;">If you don't receive your key within 2 hours, please reply to this email with your transaction ID.</p>
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center; border-top: 1px solid #1f1f27;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">Transaction ID: ${paymentId || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (isProjectManager) {
        // --- PROJECT MANAGER SUCCESS TEMPLATE ---
        subject = `🔥 Access Granted: Your Project Manager Pro License Key`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">Access Granted</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Project Manager Pro is now yours.</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Thank you for your purchase! Your payment has been verified, and your premium lifetime license is ready for activation.</p>
                        <div style="background: #000000; border: 1px dashed #3f3f46; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #f59e0b; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Your Unique License Key</p>
                            <div style="font-family: 'Courier New', monospace; font-size: 26px; color: #ffffff; letter-spacing: 4px; font-weight: bold;">
                                ${licenseKey}
                            </div>
                        </div>
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${downloadLink}" style="background: #ffffff; color: #000000; padding: 18px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Download Extension (.zxp)</a>
                            <p style="font-size: 12px; color: #71717a; margin-top: 15px;">Version 1.0.2 • Windows & macOS Compatible</p>
                        </div>
                        <div style="border-top: 1px solid #1f1f27; padding-top: 30px;">
                            <h3 style="font-size: 16px; margin-bottom: 15px; color: #f59e0b;">How to install:</h3>
                            <ol style="color: #a1a1aa; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                                <li>Download the <strong>.zxp</strong> file using the button above.</li>
                                <li>Install using <strong>ZXP Installer</strong> or <strong>Anastasiy’s Storage</strong>.</li>
                                <li>Open After Effects and go to <strong>Window > Extensions > Project Manager Pro</strong>.</li>
                                <li>Enter your email and the license key provided above.</li>
                            </ol>
                        </div>
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center; border-top: 1px solid #1f1f27;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">Need help? Reply to this email or visit our <a href="https://easyworkflow.store/support" style="color: #f59e0b; text-decoration: none;">Support Center</a>.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (isBasic) {
        // --- BASIC SUCCESS TEMPLATE ---
        subject = `🔥 Access Granted: Your Easy Workflow Basic Download`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">Access Granted</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Easy Workflow Basic is now yours.</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Thank you for your purchase! Your payment has been verified, and your download is ready.</p>
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${downloadLink}" style="background: #ffffff; color: #000000; padding: 18px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Download Script (.jsx)</a>
                            <p style="font-size: 12px; color: #71717a; margin-top: 15px;">Windows & macOS Compatible</p>
                        </div>
                        <div style="border-top: 1px solid #1f1f27; padding-top: 30px;">
                            <h3 style="font-size: 16px; margin-bottom: 15px; color: #a855f7;">How to install:</h3>
                            <ol style="color: #a1a1aa; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                                <li>Download the <strong>.jsx</strong> file using the button above.</li>
                                <li>Place the file in the <strong>ScriptUI Panels</strong> folder inside your After Effects installation folder.</li>
                                <li>Open After Effects and go to <strong>Window > Easy Workflow.jsx</strong>.</li>
                            </ol>
                        </div>
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center; border-top: 1px solid #1f1f27;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">Need help? Reply to this email or visit our <a href="https://easyworkflow.store/support" style="color: #a855f7; text-decoration: none;">Support Center</a>.</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // --- DEFAULT SUCCESS TEMPLATE (EASY WORKFLOW / AUTO CAPTIONS) ---
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; text-transform: uppercase;">Payment Received</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">${tier.toUpperCase()}</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">We have successfully received your payment for <strong>${tier.toUpperCase()}</strong>.</p>
                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid #1f1f27; margin: 25px 0;">
                            <p style="font-size: 16px; color: #e5e5e5; margin: 0 0 14px; line-height: 1.6;">Please note: This is a <strong>manual fulfillment</strong> process.</p>
                            <p style="font-size: 16px; color: #e5e5e5; margin: 0; line-height: 1.6;">Once our team verifies the transaction, you will receive a <strong style="color:#22c55e;">100% discounted Gumroad Link</strong> in a separate email.</p>
                        </div>
                        <p style="font-size: 14px; color: #71717a; font-style: italic;">Verification usually takes 1-4 hours.</p>
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">The Software Hub Team</p>
                    </div>
                </div>
            </div>
        `;
    }

    const mailOptions = {
        from: `"Software Hub Support" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: bodyHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email (${isPending ? 'Pending' : 'Success'}) sent to:`, toEmail);
    } catch (err) {
        console.error("Failed to send email:", err.message);
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
        const { paymentId, method, tier, name, email, phone, customLinkCode, amount: clientAmount, leadDocId } = JSON.parse(event.body);

        if (!paymentId || !method) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `Missing payment information: paymentId='${paymentId}', method='${method}'` }) };
        }

        let isVerified = false;
        let isPending = false;
        let amountPaid = "N/A";

        // 1. VERIFY WITH GATEWAY
        if (method === 'cashfree') {
            const appId = process.env.CASHFREE_APP_ID;
            const secretKey = process.env.CASHFREE_SECRET_KEY;
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

            if (cfRes.data) {
                if (cfRes.data.payment_status === 'SUCCESS') {
                    isVerified = true;
                    amountPaid = `${cfRes.data.payment_currency} ${cfRes.data.payment_amount}`;
                } else if (cfRes.data.payment_status === 'PENDING') {
                    isPending = true;
                }
            }
        }
        else if (method === 'razorpay') {
            const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SeElRgESDAvD5D';
            const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

            if (!rzpKeySecret) {
                console.error("Razorpay Secret Missing - Server misconfigured. Denying payment verification to prevent bypass.");
                isVerified = false;
            } else {
                try {
                    const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
                    const rzpRes = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
                        headers: { 'Authorization': `Basic ${auth}` }
                    });

                    if (rzpRes.data) {
                        const rzpStatus = rzpRes.data.status;
                        if (rzpStatus === 'authorized') {
                            // Automatically capture the payment to confirm it
                            await axios.post(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
                                amount: rzpRes.data.amount,
                                currency: rzpRes.data.currency
                            }, {
                                headers: { 'Authorization': `Basic ${auth}` }
                            });
                            isVerified = true;
                            amountPaid = `${rzpRes.data.currency} ${(rzpRes.data.amount / 100).toFixed(2)}`;
                        } else if (rzpStatus === 'captured') {
                            isVerified = true;
                            amountPaid = `${rzpRes.data.currency} ${(rzpRes.data.amount / 100).toFixed(2)}`;
                        } else if (rzpStatus === 'created' || rzpStatus === 'failed') {
                            // If it's created but not yet authorized, it's effectively pending
                            isPending = true;
                        }
                    }
                } catch (err) {
                    throw err;
                }
            }
        }

        // 2. IF VERIFIED -> Process License and Email
        if (isVerified) {
            console.log(`[Verified] Payment ${paymentId} for ${tier} by ${name} (${email})`);
            let generatedLicense = null;

            // Secure License Generation & Database Storage for Project Manager
            if (tier.toLowerCase().replace(/\s+/g, '').includes('projectmanager')) {
                if (!admin.apps.length) {
                    console.error("CRITICAL: Firebase Admin not initialized. Cannot securely store license.");
                    return { statusCode: 500, headers, body: JSON.stringify({ error: `Backend database connection error. Contact support. (${firebaseInitError})` }) };
                } else {
                    const db = admin.firestore();
                    const cleanEmail = email.toLowerCase().trim();

                    // Check 1: Does this specific payment ID already have a license? (Replay Attack Prevention)
                    const paymentCheck = await db.collection('licenses').where('paymentId', '==', paymentId).limit(1).get();
                    if (!paymentCheck.empty) {
                        console.warn(`Payment ${paymentId} already processed. Returning existing key to prevent duplicates.`);
                        generatedLicense = paymentCheck.docs[0].data().licenseKey;
                    } else {
                        // Generate a new key for every new payment (allow multiple purchases per email)
                        generatedLicense = generate16DigitKey();
                        const normalizedTier = tier.toLowerCase().replace(/\s+/g, '');
                        console.log(`Generating new secure license key for ${cleanEmail}: ${generatedLicense}`);

                        // Store in the main secure /licenses/ collection
                        await db.collection('licenses').doc(generatedLicense).set({
                            email: cleanEmail,
                            licenseKey: generatedLicense,
                            paymentId: paymentId,
                            tier: normalizedTier,
                            name: name || 'Unknown',
                            status: 'active',
                            machineId: null, // Unbound initially
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        // Update email lookup map — append to licenseKeys array for multi-key support
                        await db.collection('license_by_email').doc(cleanEmail).set({
                            licenseKeys: admin.firestore.FieldValue.arrayUnion(generatedLicense),
                            tier: normalizedTier,
                            status: 'active',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                }
            }

            // Fire Automated Email to Customer
            if (email) {
                await sendCustomerEmail(email, name, tier, generatedLicense, paymentId, false);
            }

            // Securely update lead and create payment record in database
            if (admin.apps.length) {
                try {
                    const db = admin.firestore();

                    // 1. Create secure payment record
                    await db.collection('payments').add({
                        paymentId: paymentId,
                        gateway: method,
                        tier: tier,
                        name: name || 'Unknown',
                        email: email || 'Unknown',
                        phone: phone || '',
                        amount: clientAmount || '—',
                        verified: true,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // 2. Update lead status if leadDocId was provided
                    if (leadDocId) {
                        const isPMTier = tier.toLowerCase().replace(/\s+/g, '').includes('projectmanager');
                        const isBasicTier = tier.toLowerCase().replace(/\s+/g, '').includes('basic');
                        const newStatus = (isPMTier || isBasicTier) ? 'verified' : 'paid';
                        const updateObj = {
                            status: newStatus,
                            paymentId: paymentId,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        if (generatedLicense) {
                            updateObj.licenseKey = generatedLicense;
                        }
                        await db.collection('leads').doc(leadDocId).update(updateObj);
                        console.log(`[Lead Update] Securely updated lead ${leadDocId} to ${newStatus}`);
                    }
                } catch (fsErr) {
                    console.error("[Backend FS Update] Failed to update lead/payment:", fsErr.message);
                }
            }

            // Update Custom Link tracking (increment redemptions & revenue)
            if (customLinkCode && admin.apps.length) {
                try {
                    const db = admin.firestore();
                    const linkRef = db.collection('custom_links').doc(customLinkCode);
                    const linkDoc = await linkRef.get();
                    if (linkDoc.exists) {
                        // Parse amount to determine INR or USD
                        let isUSD = false;
                        let amountNum = 0;
                        if (amountPaid !== "N/A") {
                            isUSD = amountPaid.includes('USD');
                            amountNum = parseFloat(amountPaid.replace(/[^\d.]/g, '')) || 0;
                        } else if (clientAmount && clientAmount !== '—') {
                            const caStr = String(clientAmount).split(' (Ref:')[0];
                            isUSD = caStr.includes('$') || caStr.toUpperCase().includes('USD');
                            amountNum = parseFloat(caStr.replace(/[^\d.]/g, '')) || 0;
                        }
                        const updateData = {
                            currentRedemptions: admin.firestore.FieldValue.increment(1)
                        };
                        if (isUSD) {
                            updateData.totalSalesUSD = admin.firestore.FieldValue.increment(amountNum);
                        } else {
                            updateData.totalSalesINR = admin.firestore.FieldValue.increment(amountNum);
                        }
                        await linkRef.update(updateData);
                        console.log(`[Custom Link] Updated ${customLinkCode}: +1 redemption, +${amountNum} ${isUSD ? 'USD' : 'INR'}`);
                    }
                } catch (linkErr) {
                    console.warn(`[Custom Link] Failed to update tracking for ${customLinkCode}:`, linkErr.message);
                }
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    verified: true,
                    message: "Payment confirmed by server.",
                    licenseKey: generatedLicense, // Returns key to frontend if needed
                    downloadLink: downloadLink
                })
            };
        } else if (isPending) {
            // 3. IF PENDING -> Send Reassurance Email
            console.log(`[Pending] Payment ${paymentId} for ${tier} by ${name} (${email}). Sending reassurance email.`);
            if (email) {
                await sendCustomerEmail(email, name, tier, null, paymentId, true);
            }
            return {
                statusCode: 202, // Accepted but not finished
                headers,
                body: JSON.stringify({ verified: false, pending: true, message: "Payment is pending bank confirmation. Email sent." })
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
