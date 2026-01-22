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