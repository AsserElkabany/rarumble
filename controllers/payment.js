const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");


//creditials 
//.env later
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0'
const supabase = createClient('https://igosojxxeyjlshtwyrtr.supabase.co',supabaseKey);
const PAYMOB_API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBMU9Ea3lOeXdpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5JMEZXVkcxZUY4S0Nzc0dlTENoWUdCd1NZd2dUMWFZbzhLZm55MU9nVmtSalNSRndGRW96MFhFOF8wS0xBVllBWGRHSWRtOFRoOHNYZUpFaW1XRUttdw==";
const PAYMOB_INTEGRATION_ID = 5183013;
const PAYMOB_IFRAME_ID = 938134;


// ***************************************************create payment******************************************//
exports.createPayment = async (req, res) => 
  {
    const userid= req.user_id;
    const email = req.email; 
    if (!userid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
  const { productId, phone } = req.body;

  if (!productId || !phone) {
    return res.status(400).json({ error: "Product ID, email, and phone are required" });
  }
  

 
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("price, sellerid")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const price = product.price;
  const amountCents = price * 100;

 
  const authResponse = await axios.post("https://accept.paymob.com/api/auth/tokens", {
    api_key: PAYMOB_API_KEY
  });
  const token = authResponse.data.token;
  console.log("Auth Token:", token);

  if (!token) {
    return res.status(500).json({ error: "Failed to authenticate with Paymob" });
  }

  
  const orderResponse = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items: []
  });
  const paymobOrderId = orderResponse.data.id;
  console.log("Order ID:", paymobOrderId);

  
  const { error: insertError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userid,
        product_id: productId,
        total_price: price,
        paymob_order_id: paymobOrderId,
        paid: false,
        seller_paid: false,
        seller_id: product.sellerid 
      }
    ]);

  if (insertError) {
    console.error("Error inserting order:", insertError);
    return res.status(500).json({ error: "Failed to save order" });
  }


  //add to users table firstname, lastname, phone to send it in billing_data and in signing up
  // const { data: user, error: orderError } = await supabase
  //   .from("users")
  //   .select('')
  //   .eq('')
  

 
  const paymentKeyResponse = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
    auth_token: token,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: paymobOrderId,
    billing_data: {
      apartment: "NA",
      email: email,
      floor: "NA",
      first_name: "user",
      street: "NA",
      building: "NA",
      phone_number: phone,
      shipping_method: "NA",
      postal_code: "00000",
      city: "Cairo",
      country: "EG",
      last_name: "client",
      state: "Cairo"
    },
    currency: "EGP",
    integration_id: PAYMOB_INTEGRATION_ID
  });
  const paymentToken = paymentKeyResponse.data.token;
  console.log("Payment Token:", paymentToken);

  
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
  console.log("Iframe URL:", iframeUrl);

  res.json({ iframeUrl });
};




// ***************************************************handle payment callback******************************************//
exports.handleCallback = async (req, res) => {
  const { obj } = req.body;

  if (!obj || !obj.order || !obj.order.id || !obj.success) {
    return res.status(400).json({ error: "Invalid callback payload" });
  }

  const paymobOrderId = obj.order.id;
  const isPaid = obj.success;

  if (!isPaid) {
    return res.status(200).send("Payment not successful, ignored");
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ paid: true })
    .eq("paymob_order_id", paymobOrderId);

  if (updateError) {
    console.error("Failed to update order:", updateError);
    return res.status(500).send("Failed to update order status");
  }

  console.log("Order marked as paid successfully:", paymobOrderId);
  res.status(200).send("OK");
};