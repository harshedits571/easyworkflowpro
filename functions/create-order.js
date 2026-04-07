const axios = require('axios');

const PRICING_REGISTRY = {
  basic: 100,         
  pro: 1500,          
  autocaptions: 800   
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Only POST allowed" }) };

  try {
    if (!event.body) throw new Error("Request body is empty.");
    
    const data = JSON.parse(event.body);
    const { tier, name, email, phone } = data;

    // Get Keys
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      throw new Error("API Keys missing in Netlify Dashboard.");
    }

    // Determine Mode
    const isProduction = !secretKey.includes('test');
    const baseUrl = isProduction 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    // Verify Tier and Price
    const verifiedAmount = PRICING_REGISTRY[tier] || 1500; // Default to Pro if error

    // Create Order
    const cfResponse = await axios({
      method: 'post',
      url: baseUrl,
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      data: {
        order_id: "order_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        order_amount: verifiedAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: "client_" + Date.now(),
          customer_name: name || "Customer",
          customer_email: email,
          customer_phone: phone || "9999999999"
        }
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        payment_session_id: cfResponse.data.payment_session_id,
        mode: isProduction ? "production" : "sandbox" // 🟢 Tell the website which mode to use!
      }),
    };

  } catch (error) {
    console.error("❗ Secure Order Error:", error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "SERVER_ERROR", message: error.message }),
    };
  }
};
