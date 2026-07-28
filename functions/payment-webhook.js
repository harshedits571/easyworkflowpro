const verifyPayment = require('./verify-payment');

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
    const body = JSON.parse(event.body || '{}');
    console.log("🔔 Webhook Received:", JSON.stringify(body));

    // Identify Success for Cashfree & Razorpay (handles all event strings like PAYMENT_SUCCESS, success payment, payment.captured, etc.)
    const evt = (body.event_type || body.event || body.type || body.txStatus || '').toString().toLowerCase();
    const isSuccess = evt.includes('success') || evt.includes('captured') || body.txStatus === "SUCCESS";
    
    if (!isSuccess) {
      console.log("[Webhook] Ignored non-success event:", body.event_type || body.event || body.type);
      return { statusCode: 200, headers, body: "Ignored (not success)" };
    }

    // Determine Gateway Method
    let method = 'cashfree';
    if (evt.includes('razorpay') || body.event === 'payment.captured' || body.payload?.payment) {
      method = 'razorpay';
    }

    // Extract Payment/Order ID
    let paymentId = null;
    if (method === 'razorpay') {
      paymentId = body.payload?.payment?.entity?.id;
    } else {
      paymentId = body.data?.order?.order_id || body.data?.payment?.cf_payment_id || body.data?.order_id || body.orderId || body.order_id;
    }

    if (!paymentId) {
      console.error("[Webhook Error] No paymentId or order_id found in payload");
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing paymentId/order_id in webhook" }) };
    }

    // Get Customer Info
    const email = body.data?.customer_details?.customer_email || 
                  body.data?.customer_details?.email || 
                  body.payload?.payment?.entity?.email || 
                  body.customerEmail || null;
    
    const name = body.data?.customer_details?.customer_name || 
                 body.data?.customer_details?.name || 
                 body.payload?.payment?.entity?.notes?.name || null;

    const phone = body.data?.customer_details?.customer_phone || 
                  body.data?.customer_details?.phone || 
                  body.payload?.payment?.entity?.contact || null;

    const tier = body.payload?.payment?.entity?.notes?.product || 
                 body.payload?.payment?.entity?.notes?.tier || 
                 body.data?.order?.order_tags?.tier || 
                 "Easy Workflow Pro";

    const amount = body.data?.order?.order_amount || 
                   body.data?.payment?.payment_amount || 
                   (body.payload?.payment?.entity?.amount ? (body.payload?.payment?.entity?.amount / 100).toFixed(2) : null);

    console.log(`[Webhook Processing] ${method} paymentId=${paymentId}, email=${email}, tier=${tier}`);

    // Delegate to verify-payment logic
    const verifyEvent = {
      httpMethod: 'POST',
      headers: event.headers || {},
      body: JSON.stringify({
        paymentId,
        method,
        tier,
        name,
        email,
        phone,
        amount
      })
    };

    const verifyResult = await verifyPayment.handler(verifyEvent, context);
    console.log("[Webhook Verification Result]:", verifyResult.statusCode, verifyResult.body);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "processed", details: verifyResult.body })
    };

  } catch (error) {
    console.error("❌ Webhook Processing Error:", error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

