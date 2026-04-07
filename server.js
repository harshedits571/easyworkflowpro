const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. YOUR CASHFREE KEYS (For Local Testing)
const CASHFREE_APP_ID = "TEST10997518058773b9b17be5ef5edc81579901";
const CASHFREE_SECRET_KEY = "cfsk_ma_test_bea799f09bc30f9e653fd6e1d7584ab4_5e95f3ad";
const IS_PRODUCTION = false; 

// Security: Server-authoritative Pricing Registry
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

const BASE_URL = IS_PRODUCTION
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

app.post('/create-order', async (req, res) => {
    try {
        const { tier, currency, name, email, phone } = req.body;

        // Security: Calculate amount on server
        const registry = isPastDeadline() ? RZP_AMOUNTS_DEADLINE : RZP_AMOUNTS;
        const verifiedAmount = registry[tier]?.[currency || "INR"];

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

app.listen(3000, () => console.log('✅ Local Payment Server ready at http://localhost:3000'));
