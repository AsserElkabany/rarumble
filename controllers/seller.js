const nodemailer = require("nodemailer");
const { createClient } = require('@supabase/supabase-js');

// Credentials
// .env later
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0'
const supabase = createClient('https://igosojxxeyjlshtwyrtr.supabase.co',supabaseKey);




//add visa card or any type of payment method to make admin send money to seller
exports.postSellersignup = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      nationality,
      street_address,
      city,
      country
    } = req.body;

    const user_id = req.user_id;
    console.log(user_id)

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (
      !first_name || !last_name || !date_of_birth || !nationality ||
      !street_address || !city || !country
    ) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const { data: existingSeller, error: fetchError } = await supabase
      .from('sellers')
      .select('userid')
      .eq('userid', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {  
      console.error('Supabase fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to check existing seller.' });
    }

    if (existingSeller) {
      return res.status(400).json({ error: 'User already signed up as a seller.' });
    }

    
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .insert([{
        f_name: first_name,
        l_name: last_name,
        DOB: date_of_birth,
        nationality,
        address: street_address,
        city,
        country,
        userid: user_id,
        balance: 0
      }]);

    if (sellerError) {
      console.error('Supabase insert error:', sellerError);
      return res.status(500).json({ error: 'Failed to create seller.' });
    }

    
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_seller: true })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Seller created, but failed to update user status.' });
    }

    res.status(201).json({ message: 'Seller created and user updated successfully.' });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};



exports.postAddoffer = async (req, res) => {
  
    const user_id = req.user_id;
    const isseller = req.isseller
  try {
   
    
    if (!isseller) {
      return res.status(403).json({ error: "Access denied. Only sellers can create offers." });
    }

    const { product_id, service_id, price, description, stock } = req.body;

    
    if (!product_id || !service_id || !price || !stock) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    
    const { data: ps, error: psError } = await supabase
      .from("product_services")
      .select("*")
      .eq("product_id", product_id)
      .eq("service_id", service_id)
      .single();

    if (psError || !ps) {
      return res.status(400).json({ error: "This service is not available for this game" });
    }

    
    const { error: insertError } = await supabase
      .from("offers")
      .insert([{
        product_id,
        service_id,
        user_id,
        price,
        description,
        stock,
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create offer" });
    }

    res.status(201).json({ message: "Offer created successfully" });

  } catch (err) {
    console.error("Error creating offer:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.gethome= async (req, res) => 
{
    const user_id = req.user_id; 
    const isseller = req.isseller; 
    // console.log("User ID:", user_id);
    // console.log("Is Seller:", isseller);
    if(!isseller)
    {
        return res.status(403).json({ message: "Access denied. Only sellers can view this page." });
    }

    const {data:products,error: productsError} = await supabase
    .from('products')
    .select('*')
    .eq("sellerid", user_id);
    if(productsError)
    {
        console.error("Error fetching products:", productsError);
        return res.status(500).json({ message: "Failed to fetch products." });
    }
    if(products.length === 0)
    {
        return res.status(404).json({ message: "No products found." });
    }
    return res.status(200).json({ message: "Products fetched successfully.", products });
}

//may delete later and use user profile instead
exports.getprofile= async (req, res) => {
    const user_id = req.user_id; 
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('f_name,l_name,DOB,nationality,address,city,country,created_at')
      .eq('userid', user_id)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    return res.status(200).json({ message: "Seller profile fetched successfully.", seller });
}



//edits here
exports.getSellerById = async (req, res) => {
     const sellerid=req.params.id
  if (!sellerid) {
      return res.status(400).json({ message: "seller ID is required." });
    }
  try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sellerid)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'seller not found' });
        }

        res.status(200).json({user});
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    } 

    
}