const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
  cloud_name: 'dg9tgfexl',     
  api_key: '722864231596945',           
  api_secret: 'hz7mnJVqlqqW4aTYY74ung16EvQ',     
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users_profiles',        
    allowed_formats: ['jpg', 'jpeg', 'png'],  
    
  },
});


const upload = multer({ storage: storage });

module.exports = upload;
