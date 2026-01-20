const { createClient } = require('@supabase/supabase-js');

// Credentials
// .env later
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0'
const supabase = createClient('https://igosojxxeyjlshtwyrtr.supabase.co',supabaseKey);


exports.uploadUserImage = async (req, res) => {
  try {
    const imageUrl = req.file.path;

    console.log('File object:', req.file);

    
    const userId = req.user_id

    
    const { data, error } = await supabase
      .from('users')
      .update({ profile_picture: imageUrl })
      .eq('id', userId)
      .select();

      


    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update user in DB' });
    }

   
    res.status(200).json({
      success: true,
      message: 'Image uploaded and user updated',
      url: imageUrl,
      user: data[0], 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};


exports.uploadGameImage = async (req, res) => {
  try {
    const imageUrl = req.file.path;

    console.log('File object:', req.file);

    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ image: imageUrl })
      .eq('id', product_id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update product in DB' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded and product updated',
      url: imageUrl,
      product: data[0], 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
} 