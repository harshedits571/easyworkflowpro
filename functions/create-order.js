const axios = require('axios');

// --- SECURE SERVER-SIDE PRICE REGISTRY ---
// This registry is HIDDEN from the browser. No one can bypass this via Inspect.
const PRICING_REGISTRY = {
  basic: 100,         // ₹100
  pro: 1500,          // ₹1500
  autocaptions: 800   // ₹800
};

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
    const { tier, name, email, phone } = JSON.parse(event.body);

    // 1. SECURITY CHECK: Verify the tier exists on our server registry
    let verifiedAmount = PRICING_REGISTRY[tier];
    if (!verifiedAmount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid product tier selected." }) };
    }

    // 2. Get Keys from Netlify Environment Variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server Configuration Error (Keys missing)" }) };
    }

    // 3. Environment Check
    const isProduction = !secretKey.includes('test');
    const baseUrl = isProduction 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    // 4. Secure API Call to Cashfree
    const response = await axios.post(baseUrl, {
      order_id: "order_" + Math.random().toString(36).substring(2, 12).toUpperCase(),
      order_amount: verifiedAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: "client_" + Date.now(),
        customer_name: name,
        customer_email: email,
        customer_phone: phone
      }
    }, {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ payment_session_id: response.data.payment_session_id }),
    };

  } catch (error) {
    console.error("Payment Order Error:", error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to create payment session", details: "Unable to reach Cashfree API" }),
    };
  }
};
