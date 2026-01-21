const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (use .env later)
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0'
const supabase = createClient('https://igosojxxeyjlshtwyrtr.supabase.co',supabaseKey);
const jwtkey = 'f3b7d6c9a42e1b8d907c4f6a2e1d3b4f7a9c0e5b2d1f6a8c3e7b4d9a6c2f1e0d3b5a7f8c9d4e1b2a3f6c8e9d0b1a2c3f4';


// ***************************************************signup function******************************************//
exports.postSignup = async (req, res) => {
    const { email, password, confirm, username } = req.body;
    if (!email || !password || !confirm || !username) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirm) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 5);

    const { error: insertUserError } = await supabase.from('users').insert([
        { 
            email,
            username,
            password: hashedPassword,
            is_seller: false,
            is_verified: false,
            verification_token: null,
            role: 'user',
            isblocked: false
        }
    ]).single();

    if (insertUserError && insertUserError.code === '23505') { 
        return res.status(400).json({ error: 'User already exists' });
    }

    if (insertUserError) {
        return res.status(400).json({ error: insertUserError.message });
    }

    res.status(201).json({ message: 'User registered successfully' });
};

// ***************************************************email verification function******************************************//
exports.getverify = async (req, res) => {
    const token = req.params.token;

    if (!token) {
        return res.status(400).json("Verification token is required");
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('verification_token', token)
        .single();

    if (error || !user) {
        return res.status(400).json("Invalid or expired verification token");
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true, verification_token: null })
        .eq('id', user.id);

    if (updateError) {
        return res.status(500).json("Failed to verify user");
    }

    res.status(200).json("User verified successfully");
};

// ***************************************************login function******************************************//
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
    }
    if (user.isblocked) {
        return res.status(403).json({ error: 'Your account is blocked' });
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email, isseller: user.is_seller, role: user.role },
        jwtkey,
        { expiresIn: '3h' }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 10 * 60 * 60 * 1000 
    });

    res.status(200).json({
        message: 'Login successful',
        user: {
            username: user.username,
            is_seller: user.is_seller
        }
    });
};

// ***************************************************get all products******************************************//
exports.getAllProducts = async (req, res) => {
    try {
        const { data: products, error } = await supabase.from("products").select("*"); 
        if (error) return res.status(500).json({ error: "Failed to fetch products" });
        if (!products || products.length === 0) return res.status(404).json({ error: "No products found" });
        res.status(200).json({ products });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// ***************************************************get offers by service******************************************//
exports.getOffersByService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { product_id, amount } = req.query;
        if (!serviceId) return res.status(400).json({ error: "Service ID is required" });

        let query = supabase
            .from("offers")
            .select(`
                *,
                users:user_id (id, email, username),
                products:product_id (id, name, description)
            `)
            .eq("service_id", serviceId);

        if (product_id) query = query.eq("product_id", product_id);
        if (amount) query = query.limit(parseInt(amount));

        const { data: offers, error } = await query;
        if (error) return res.status(500).json({ error: "Failed to fetch offers" });
        if (!offers || offers.length === 0) return res.status(404).json({ error: "No offers found" });

        res.status(200).json({ offers });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// ***************************************************get profile******************************************//
exports.getProfile = async (req, res) => {
    const userId = req.user_id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('email, username, is_seller, created_at,profile_picture')
            .eq('id', userId)
            .single();

        if (error || !user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ***************************************************get user by ID******************************************//
exports.getUserById = async (req, res) => {
    const userid = req.params.id;
    if (!userid) return res.status(400).json({ message: "User ID is required." });

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('email, username, is_seller, created_at')
            .eq('id', userid)
            .single();

        if (error || !user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ***************************************************change password******************************************//
exports.postChangePassword = async (req, res) => {  
    const userId = req.user_id;
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!oldPassword || !newPassword || !confirmNewPassword)
        return res.status(400).json({ error: 'All fields are required' });
    if (newPassword !== confirmNewPassword)
        return res.status(400).json({ error: 'New passwords do not match' });

    try {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password')
            .eq('id', userId)
            .single();

        if (fetchError || !user) return res.status(404).json({ error: 'User not found' });

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) return res.status(401).json({ error: 'Old password is incorrect' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 5);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id', userId);

        if (updateError) return res.status(500).json({ error: 'Failed to change password' });

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ***************************************************get user picture******************************************//
exports.getUserPicture = async (req, res) => {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('profile_picture')
            .eq('id', userId)
            .single();

        if (error || !user) return res.status(404).json({ error: 'User not found' });
        if (!user.profile_picture) return res.status(404).json({ error: 'Profile picture not found' });

        res.status(200).json({ profilePicture: user.profile_picture });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
