const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Put your production keys here for testing
const CASHFREE_APP_ID = "TEST10997518058773b9b17be5ef5edc81579901";
const CASHFREE_SECRET_KEY = "cfsk_ma_test_bea799f09bc30f9e653fd6e1d7584ab4_5e95f3ad";
const IS_PRODUCTION = false; 

const BASE_URL = IS_PRODUCTION
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

app.post('/create-order', async (req, res) => {
    try {
        const { amount, name, email, phone } = req.body;

        const response = await axios.post(BASE_URL, {
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
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            }
        });

        res.json({ payment_session_id: response.data.payment_session_id });

    } catch (error) {
        console.error("Local Server Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to create payment session" });
    }
});

// A dummy webhook endpoint so you can test if your automation logic is sound
app.post('/payment-webhook', async (req, res) => {
    console.log("🔔 Local Webhook received!", req.body);
    res.json({ success: true, message: "Webhook processed locally" });
});

app.listen(3000, () => console.log('🚀 Local Payment Server is LIVE at http://localhost:3000'));
