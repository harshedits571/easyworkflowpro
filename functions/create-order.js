/* 🛡️ SIMPLE CASHFREE ORDER SERVER 🛡️ */
exports.handler = async (event, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  
  try {
    const data = JSON.parse(event.body || "{}");
    const { tier, name, email, phone } = data;

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) throw new Error("API Keys missing in Netlify Dashboard.");

    const isProd = !secretKey.includes('test');
    const baseUrl = isProd ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

    // 🟢 Server-side Prices to Prevent Tampering 🟢
    const PRICES = { basic: 100, pro: 1500, autocaptions: 800 };

    const cfRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-client-id': appId, 'x-client-secret': secretKey,
        'x-api-version': '2023-08-01', 'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: "order_" + Date.now(),
        order_amount: PRICES[tier] || 1500,
        order_currency: "INR",
        customer_details: { 
            customer_id: "user_" + Date.now(), 
            customer_name: name || "Customer",
            customer_email: email, 
            customer_phone: phone || "9999999999" 
        }
      })
    });

    const result = await cfRes.json();

    return {
      statusCode: cfRes.ok ? 200 : 400,
      headers,
      body: JSON.stringify({ 
        payment_session_id: result.payment_session_id,
        mode: isProd ? "production" : "sandbox" 
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
