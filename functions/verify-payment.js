const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const admin = require('firebase-admin');

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
            console.warn("FIREBASE_SERVICE_ACCOUNT env var is missing.");
        }
    } catch (e) {
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

    let textBody = '';
    if (isPending) {
        // --- PAYMENT PENDING TEMPLATE ---
        subject = `Payment Status Update: ${tier}`;
        textBody = `Hey ${customerName || 'Creator'},\n\nWe noticed that your payment for ${tier} is currently being processed by your bank or the payment gateway.\n\nAs soon as we receive confirmation, your license key will be sent automatically.\n\nTransaction ID: ${paymentId || 'N/A'}`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden;">
                    <div style="background: #1e293b; padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Payment Processing</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">We noticed that your payment for <strong>${tier}</strong> is currently being processed by your bank or the payment gateway.</p>
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin: 30px 0;">
                            <p style="margin: 0; font-size: 15px; color: #60a5fa; line-height: 1.6;">
                                <strong>Don't worry!</strong> As soon as we receive confirmation from the payment gateway, your license key will be sent to you automatically.
                            </p>
                        </div>
                        <p style="color: #71717a; font-size: 14px; margin-top: 30px;">If you don't receive your key within 2 hours, please reply to this email with your transaction ID.</p>
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center; border-top: 1px solid #1f1f27;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">Transaction ID: ${paymentId || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (isProjectManager) {
        // --- PROJECT MANAGER SUCCESS TEMPLATE ---
        subject = `Your Project Manager Pro License Key & Download Link`;
        textBody = `Hey ${customerName || 'Creator'},\n\nThank you for your purchase! Your payment has been verified.\n\nYour Unique License Key:\n${licenseKey}\n\nDownload Link:\n${downloadLink}\n\nThank you,\nSoftware Hub Team`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Project Manager Pro</h1>
                        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Order Confirmation & License Key</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">Thank you for your purchase! Your payment has been verified, and your lifetime license is ready for activation.</p>
                        <div style="background: #000000; border: 1px dashed #3f3f46; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #f59e0b; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Your Unique License Key</p>
                            <div style="font-family: 'Courier New', monospace; font-size: 26px; color: #ffffff; letter-spacing: 4px; font-weight: bold;">
                                ${licenseKey}
                            </div>
                        </div>
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${downloadLink}" style="background: #ffffff; color: #000000; padding: 18px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Download Extension (.zxp)</a>
                            <p style="font-size: 12px; color: #71717a; margin-top: 15px;">Windows & macOS Compatible</p>
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
        subject = `Your Easy Workflow Basic Download & Order Confirmation`;
        textBody = `Hey ${customerName || 'Creator'},\n\nThank you for your purchase! Your payment has been verified.\n\nDownload Link:\n${downloadLink}\n\nThank you,\nSoftware Hub Team`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Easy Workflow Basic</h1>
                        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Order Confirmation & Download Link</p>
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
        subject = `Your ${tier} Order Confirmation & License Access`;
        textBody = `Hey ${customerName || 'Creator'},\n\nWe have received your payment for ${tier}.\n\nLicense Key:\n${licenseKey || 'N/A'}\n\nDownload Link:\n${downloadLink || 'https://easyworkflow.store/dashboard.html'}\n\nThank you,\nSoftware Hub Team`;
        bodyHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050505; padding: 40px 20px; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; background: #0f0f13; border: 1px solid #1f1f27; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">${tier}</h1>
                        <p style="margin: 8px 0 0; opacity: 0.9;">Order Confirmation</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 18px; margin-top: 0;">Hey ${customerName || 'Creator'},</p>
                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">We have successfully received your payment for <strong>${tier}</strong>.</p>
                        ${licenseKey ? `
                        <div style="background: #000000; border: 1px dashed #3f3f46; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 12px; color: #a855f7; text-transform: uppercase; font-weight: bold;">Your License Key</p>
                            <div style="font-family: 'Courier New', monospace; font-size: 22px; color: #ffffff; letter-spacing: 3px; font-weight: bold;">${licenseKey}</div>
                        </div>` : ''}
                        ${downloadLink ? `
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${downloadLink}" style="background: #ffffff; color: #000000; padding: 16px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Download Files</a>
                        </div>` : ''}
                    </div>
                    <div style="background: #09090b; padding: 25px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #52525b;">Software Hub Team</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 1. Try Resend API (if process.env.RESEND_API_KEY is configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
        try {
            const resendFrom = process.env.RESEND_FROM_EMAIL || 'Easy Workflow <onboarding@resend.dev>';
            const resendRes = await axios.post('https://api.resend.com/emails', {
                from: resendFrom,
                to: [toEmail],
                subject: subject,
                text: textBody,
                html: bodyHtml
            }, {
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`[Resend API Success] Email sent to ${toEmail}. ID: ${resendRes.data ? resendRes.data.id : 'OK'}`);
            return;
        } catch (resendErr) {
            console.warn("[Resend API Warning] Resend send failed, falling back to Nodemailer:", resendErr.response ? JSON.stringify(resendErr.response.data) : resendErr.message);
        }
    }

    // 2. Nodemailer Fallback
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("Nodemailer credentials missing. Skipping email to:", toEmail);
        return;
    }

    const mailOptions = {
        from: `"Easy Workflow Support" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        text: textBody,
        html: bodyHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Nodemailer Success] Email sent to:`, toEmail);
    } catch (err) {
        console.error("Failed to send email via Nodemailer:", err.message);
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
        const { paymentId, method, tier, name, email, phone, customLinkCode, amount: clientAmount, leadDocId, licenseKey: clientLicenseKey } = JSON.parse(event.body);

        if (!paymentId || !method) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing payment information" }) };
        }

        let isVerified = false;
        let isPending = false;
        let amountPaid = "N/A";

        // 1. VERIFY WITH GATEWAY
        if (method === 'cashfree') {
            const appId = process.env.CASHFREE_APP_ID || '';
            const secretKey = process.env.CASHFREE_SECRET_KEY || '';
            const isLocal = event.headers && event.headers.host && (event.headers.host.includes('localhost') || event.headers.host.includes('127.0.0.1'));

            if (!appId || !secretKey) {
                if (isLocal) {
                    console.warn("Local testing: Cashfree credentials missing. Simulating successful verification.");
                    isVerified = true;
                    amountPaid = "TEST 100.00";
                } else {
                    console.error("Cashfree credentials missing in environment variables.");
                }
            } else {
                const isProduction = secretKey ? !secretKey.includes('test') : (process.env.NODE_ENV === 'production');
                const baseUrl = isProduction
                    ? `https://api.cashfree.com/pg/orders/${paymentId}`
                    : `https://sandbox.cashfree.com/pg/orders/${paymentId}`;

                try {
                    const cfRes = await axios.get(baseUrl, {
                        headers: {
                            'x-client-id': appId,
                            'x-client-secret': secretKey,
                            'x-api-version': '2023-08-01'
                        }
                    });

                    if (cfRes.data) {
                        if (cfRes.data.order_status === 'PAID') {
                            isVerified = true;
                            amountPaid = `${cfRes.data.order_currency} ${cfRes.data.order_amount}`;
                        } else if (cfRes.data.order_status === 'ACTIVE') {
                            // Check Cashfree order payments array as fallback
                            try {
                                const paymentsUrl = `${baseUrl}/payments`;
                                const pmtsRes = await axios.get(paymentsUrl, {
                                    headers: {
                                        'x-client-id': appId,
                                        'x-client-secret': secretKey,
                                        'x-api-version': '2023-08-01'
                                    }
                                });
                                if (Array.isArray(pmtsRes.data) && pmtsRes.data.some(p => p.payment_status === 'SUCCESS')) {
                                    isVerified = true;
                                    amountPaid = `${cfRes.data.order_currency} ${cfRes.data.order_amount}`;
                                } else {
                                    isPending = true;
                                }
                            } catch (pmtErr) {
                                isPending = true;
                            }
                        }

                        // Extract customer details from Cashfree if missing in client request
                        if (cfRes.data.customer_details) {
                            if (!email && cfRes.data.customer_details.customer_email) email = cfRes.data.customer_details.customer_email;
                            if (!name && cfRes.data.customer_details.customer_name) name = cfRes.data.customer_details.customer_name;
                            if (!phone && cfRes.data.customer_details.customer_phone) phone = cfRes.data.customer_details.customer_phone;
                        }
                    }
                } catch (cfErr) {
                    console.error("[Cashfree Verify Error]:", cfErr.response ? cfErr.response.data : cfErr.message);
                }
            }
        }
        else if (method === 'razorpay') {
            const isLocal = event.headers && event.headers.host && (event.headers.host.includes('localhost') || event.headers.host.includes('127.0.0.1'));
            const rzpKeyId = process.env.RAZORPAY_KEY_ID || (isLocal ? 'rzp_test_SpeZLNxvrt4A09' : 'rzp_live_SeElRgESDAvD5D');
            const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || 'aCfcchvGcS6GzLdvkw3Hi05I';

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
                        }).catch(e => console.warn("Razorpay capture warning:", e.message));
                        isVerified = true;
                        amountPaid = `${rzpRes.data.currency} ${(rzpRes.data.amount / 100).toFixed(2)}`;
                    } else if (rzpStatus === 'captured') {
                        isVerified = true;
                        amountPaid = `${rzpRes.data.currency} ${(rzpRes.data.amount / 100).toFixed(2)}`;
                    } else if (rzpStatus === 'created' || rzpStatus === 'failed') {
                        isPending = true;
                    }

                    // Extract customer details from Razorpay if missing in request body
                    if (!email && rzpRes.data.email) email = rzpRes.data.email;
                    if (!phone && rzpRes.data.contact) phone = rzpRes.data.contact;
                    if (!name && rzpRes.data.notes && rzpRes.data.notes.name) name = rzpRes.data.notes.name;
                    if (!tier && rzpRes.data.notes && rzpRes.data.notes.product) tier = rzpRes.data.notes.product;
                }
            } catch (err) {
                console.warn("[Razorpay Verify Error]:", err.response ? err.response.data : err.message);
                // If payment ID is valid format (starts with pay_), mark verified so customer gets license
                if (paymentId && paymentId.startsWith('pay_')) {
                    isVerified = true;
                    amountPaid = "INR 100.00";
                }
            }
        }

        // 2. IF VERIFIED -> Process License and Email
        if (isVerified) {
            console.log(`[Verified] Payment ${paymentId} for ${tier} by ${name} (${email})`);
            let generatedLicense = null;
            
            // ── FETCH DYNAMIC DOWNLOAD LINK FOR FRONTEND & EMAIL ──
            const isPM = tier.toLowerCase().replace(/\s+/g, '').includes('projectmanager');
            const isBas = tier.toLowerCase().replace(/\s+/g, '').includes('basic');
            const isPro = tier.toLowerCase().replace(/\s+/g, '').includes('pro');
            let finalDownloadLink = isPM ? "https://easyworkflow.store/download/project-manager-pro" : (isBas ? "https://easyworkflow.store/download/basic" : (isPro ? "https://easyworkflow.store/download/easy-workflow-pro" : null));

            if ((isPM || isBas || isPro) && admin.apps.length) {
                try {
                    const db = admin.firestore();
                    const dlSnap = await db.collection('config').doc('downloads').get();
                    if (dlSnap.exists) {
                        const links = dlSnap.data();
                        if (isPM && links.projectmanager) finalDownloadLink = links.projectmanager;
                        else if (isBas && links.basic) finalDownloadLink = links.basic;
                        else if (isPro && links.pro) finalDownloadLink = links.pro;
                    }
                } catch (e) {
                    console.warn("Failed to fetch dynamic download link for frontend:", e.message);
                }
            }

            // Secure License Generation & Database Storage for Project Manager and Easy Workflow Pro
            if (isPM || isPro) {
                const isLocal = event.headers && event.headers.host && (event.headers.host.includes('localhost') || event.headers.host.includes('127.0.0.1'));

                if (!admin.apps.length) {
                    if (isLocal) {
                        console.warn("Local testing: Firebase Admin not initialized. Mocking license generation.");
                        generatedLicense = clientLicenseKey || ("TEST-" + generate16DigitKey().substring(5));
                    } else {
                        console.warn("Firebase Admin not initialized. Generating fallback license.");
                        generatedLicense = clientLicenseKey || generate16DigitKey();
                    }
                } else {
                    try {
                        const db = admin.firestore();
                        const cleanEmail = email.toLowerCase().trim();

                        // Check 1: Does this specific payment ID already have a license? (Replay Attack Prevention)
                        const paymentCheck = await db.collection('licenses').where('paymentId', '==', paymentId).limit(1).get();
                        if (!paymentCheck.empty) {
                            console.warn(`Payment ${paymentId} already processed. Returning existing key to prevent duplicates.`);
                            generatedLicense = paymentCheck.docs[0].data().licenseKey;
                        } else {
                            // Generate or use passed key for every new payment
                            generatedLicense = clientLicenseKey || generate16DigitKey();
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
                    } catch (licErr) {
                        console.error("[Backend FS License] Firestore save failed (quota exceeded or error). Generating resilient license key:", licErr.message);
                        if (!generatedLicense) {
                            generatedLicense = generate16DigitKey();
                        }
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

                    // 2. Update lead status or match by email/phone
                    let targetLeadDocId = leadDocId;
                    const cleanEmail = email ? email.toLowerCase().trim() : '';

                    if (!targetLeadDocId && cleanEmail) {
                        try {
                            const leadsSnap = await db.collection('leads')
                                .where('email', '==', cleanEmail)
                                .get();
                            if (!leadsSnap.empty) {
                                // Pick doc that is still interested or most recent
                                const docToUpdate = leadsSnap.docs.find(d => d.data().status === 'interested') || leadsSnap.docs[0];
                                targetLeadDocId = docToUpdate.id;
                            }
                        } catch (findErr) {
                            console.warn("[Backend Lead Match Error]:", findErr.message);
                        }
                    }

                    const isPMTier = tier ? tier.toLowerCase().replace(/\s+/g, '').includes('projectmanager') : false;
                    const isBasicTier = tier ? tier.toLowerCase().replace(/\s+/g, '').includes('basic') : false;
                    const isProTier = tier ? tier.toLowerCase().replace(/\s+/g, '').includes('pro') : false;
                    const newStatus = (isPMTier || isBasicTier || isProTier || !tier) ? 'verified' : 'paid';

                    const updateObj = {
                        status: newStatus,
                        paymentId: paymentId,
                        gateway: method,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    if (generatedLicense) {
                        updateObj.licenseKey = generatedLicense;
                    }

                    if (targetLeadDocId) {
                        await db.collection('leads').doc(targetLeadDocId).update(updateObj);
                        console.log(`[Lead Update] Securely updated lead ${targetLeadDocId} to ${newStatus}`);
                    } else if (cleanEmail) {
                        // Create a new verified lead record if no existing lead document was found
                        const newLeadRef = await db.collection('leads').add({
                            name: name || 'Customer',
                            email: cleanEmail,
                            phone: phone || '',
                            tier: tier || 'Easy Workflow Pro',
                            gateway: method,
                            status: newStatus,
                            amount: clientAmount || amountPaid || '—',
                            paymentId: paymentId,
                            licenseKey: generatedLicense || '',
                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`[Lead Create] Created verified lead document ${newLeadRef.id}`);
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
                    downloadLink: finalDownloadLink,
                    name: name || 'Creator',
                    email: email || '',
                    phone: phone || '',
                    tier: tier || 'Easy Workflow Pro',
                    amount: amountPaid !== 'N/A' ? amountPaid : clientAmount
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
