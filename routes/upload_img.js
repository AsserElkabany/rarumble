const express = require('express');
const router = express.Router();
const authentication=require('../middlewares/authentication');
const adminonly=require('../middlewares/adminonly');

const upload = require('../middlewares/cloudinary');

const uploadController = require('../controllers/upload_img');


router.post('/upload/userimage',authentication,upload.single('image'), uploadController.uploadUserImage);
router.post('/upload/gameimage',adminonly,upload.single('image'), uploadController.uploadGameImage);
module.exports = router;