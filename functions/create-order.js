const axios = require('axios');

// Security: Server-authoritative Pricing Registry
// Prevents pricing manipulation by verifying the tier and amount on the server.
const RZP_AMOUNTS = {
  basic: { INR: 100, USD: 2 },
  pro: { INR: 1500, USD: 18 },
  autocaptions: { INR: 800, USD: 10 }
};

// After-deadline amounts
const RZP_AMOUNTS_DEADLINE = {
  basic: { INR: 100, USD: 2 },
  pro: { INR: 2000, USD: 24 },
  autocaptions: { INR: 800, USD: 10 }
};

const PRICE_DEADLINE = new Date('2026-03-20T23:59:59+05:30');

function isPastDeadline() {
  return new Date() > PRICE_DEADLINE;
}

exports.handler = async (event, context) => {
  // 1. CORS Headers (Security)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { tier, currency, name, email, phone } = JSON.parse(event.body);

    // Get Keys from Netlify Environment Variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: "API Keys missing from Netlify settings. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY." }) 
      };
    }

    // Security: Calculate amount on server to prevent tampering
    const registry = isPastDeadline() ? RZP_AMOUNTS_DEADLINE : RZP_AMOUNTS;
    const verifiedAmount = registry[tier]?.[currency || "INR"];

    if (!verifiedAmount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid tier or currency selected." })
      };
    }

    // Determine Environment (Test vs Prod)
    const isProduction = !secretKey.includes('test');
    const baseUrl = isProduction 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    // Call Cashfree API
    const response = await axios.post(baseUrl, {
      order_id: "order_" + Date.now(),
      order_amount: verifiedAmount,
      order_currency: currency || "INR",
      customer_details: {
        customer_id: "user_" + Date.now(),
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
    console.error("Netlify Function Error:", error.response ? error.response.data : error.message);
    
    // Check for specific Cashfree validation errors
    const errorDetails = error.response ? error.response.data.message : error.message;
    const errorCode = error.response && error.response.data.code ? error.response.data.code : "";

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create payment session", 
        details: errorDetails,
        code: errorCode
      }),
    };
  }
};
