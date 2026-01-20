const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const PORT = 3000;
const user_router = require("./routes/user");
const seller_router = require("./routes/seller");
const payment_router = require("./routes/payment");
const admin_router = require("./routes/admin");
const upload_router = require("./routes/upload_img");
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');


app.use(cors({
  origin: true,        
  credentials: true    
}));

app.use(cookieParser());
app.use(express.json());

const supabaseUrl = 'https://igosojxxeyjlshtwyrtr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnb3Nvanh4ZXlqbHNodHd5cnRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTUzOCwiZXhwIjoyMDg0NDg1NTM4fQ.dYR_MaAItOobCgnaYextLaG3shNEO7h5DUx2lqj5wQ0';

app.use('/api', user_router);
app.use('/api', seller_router);
app.use('/api', payment_router);
app.use('/api', admin_router);
app.use('/api', upload_router);

try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully.");
}
catch (error) {
    console.error("Error creating Supabase client:", error);
}

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
