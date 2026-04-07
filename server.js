/* 🚀 ZERO-DEPENDENCY LOCAL SERVER 🚀 */
// No 'npm install' needed. This works with standard Node.js!
const http = require('http');

const PRICING_REGISTRY = { basic: 100, pro: 1500, autocaptions: 800 };

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.end(); return; }

  if (req.method === 'POST' && req.url === '/create-order') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { tier, name, email, phone } = data;

        // Keys (Using Sandbox for local testing)
        const appId = "TEST10997518058773b9b17be5ef5edc81579901";
        const secretKey = "cfsk_ma_test_bea799f09bc30f9e653fd6e1d7584ab4_5e95f3ad";
        const baseUrl = "https://sandbox.cashfree.com/pg/orders";

        const cfRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'x-client-id': appId, 'x-client-secret': secretKey,
            'x-api-version': '2023-08-01', 'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: "local_" + Date.now(),
            order_amount: PRICING_REGISTRY[tier] || 1500,
            order_currency: "INR",
            customer_details: { 
                customer_id: "user_" + Date.now(), customer_name: name || "Customer",
                customer_email: email, customer_phone: phone || "9999999999" 
            }
          })
        });

        const result = await cfRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ payment_session_id: result.payment_session_id, mode: "sandbox" }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => console.log('✅ Local Server is LIVE at http://localhost:3000 (Zero-Dependency Mode)'));
