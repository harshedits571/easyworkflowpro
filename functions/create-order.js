const axios = require('axios');

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
    const { amount, name, email, phone } = JSON.parse(event.body);

    // Get Keys from Netlify Environment Variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: "API Keys missing from Netlify settings" }) 
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
      order_amount: amount,
      order_currency: "INR",
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create payment session", 
        details: error.response ? error.response.data.message : error.message 
      }),
    };
  }
};
