const nodemailer = require("nodemailer");
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Credentials
// .env later
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0'
const supabase = createClient('https://igosojxxeyjlshtwyrtr.supabase.co',supabaseKey);
const jwtkey = '8ca44b776f8562a8068d72b68a66761e73e9432cd8e06659be94936056072615be78e8694da0d770e77ac50dacca5f8142180bfce242088032a370f227c13102';

// ***************************************************get unpaid orders function******************************************//
exports.getUnpaidOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        seller_id,
        total_price,
        paid,
        seller_paid,
        paymob_order_id,
        sellers (
          users (
            username,
            email,
            created_at
          )
        )
      `)
      .eq('paid', true)
      .eq('seller_paid', false);

    if (error) {
      console.error("Error fetching unpaid orders:", error);
      return res.status(500).json({ error: "Failed to fetch unpaid orders" });
    }

    
    const updatedOrders = orders.map(order => {
      const commissionRate = 0.05;
      const sellerAmount = order.total_price - (order.total_price * commissionRate);

      return {
        ...order,
        seller_amount: sellerAmount
      };
    });

    res.status(200).json(updatedOrders);

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};

// ***************************************************admin login******************************************//
exports.postAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find admin user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtkey,
      { expiresIn: '3h' }
    );

    // Set cookie (like user/seller login)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,        
      sameSite: 'Lax',      
      maxAge: 3 * 60 * 60 * 1000 
    });

    res.status(200).json({ message: 'Admin login successful' });

  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ***************************************************get all paid orders******************************************//
exports.getAllPaidOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        seller_id,
        total_price,
        paid,
        seller_paid,
        paymob_order_id,
        sellers (
          users (
            username,
            email,
            created_at
          )
        )
      `)
      .eq('paid', true)
      .eq('seller_paid', true);

    if (error) {
      console.error("Error fetching paid orders:", error);
      return res.status(500).json({ error: "Failed to fetch paid orders" });
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};

// ***************************************************block user******************************************//
exports.postblockUser = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isblocked) {
      return res.status(400).json({ error: 'User is already blocked.' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ isblocked: true })
      .eq('id', userId);

    if (updateError) {
      console.error("Error blocking user:", updateError);
      return res.status(500).json({ error: "Failed to block user" });
    }

    res.status(200).json({ message: 'User blocked successfully.' });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

// ***************************************************unblock user******************************************//
exports.postunblockUser = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.isblocked) {
      return res.status(400).json({ error: 'User is not blocked.' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ isblocked: false })
      .eq('id', userId);

    if (updateError) {
      console.error("Error unblocking user:", updateError);
      return res.status(500).json({ error: "Failed to unblock user" });
    }

    res.status(200).json({ message: 'User unblocked successfully.' });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}


// ***************************************************add game******************************************//
exports.postAddGame = async (req, res) => {
  let { name, image, description, services } = req.body;

 
  if (!Array.isArray(services)) {
    if (services) {
      services = [services]; 
    } else {
      return res.status(400).json({ error: 'Name, image, description, and at least one service are required.' });
    }
  }

  if (!name || !image || !description || services.length === 0) {
    return res.status(400).json({ error: 'Name, image, description, and at least one service are required.' });
  }

  try {
    
    const { data: game, error } = await supabase
      .from('products')
      .insert([{ name, image, description }])
      .select()
      .single();

    if (error) {
      console.error("Error adding game:", error);
      return res.status(500).json({ error: "Failed to add game" });
    }

    
    for (let serviceId of services) {
      const { error: serviceError } = await supabase
        .from('product_services')
        .insert([{ product_id: game.id, service_id: serviceId }]);

      if (serviceError) {
        console.error("Error adding service to game:", serviceError);
        return res.status(500).json({ error: "Failed to add service to game" });
      }
    }

    res.status(201).json({ message: 'Game added successfully', game });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
}

// ***************************************************delete game******************************************//
