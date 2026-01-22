const express = require('express');
const userController=require('../controllers/user');
const authentication=require('../middlewares/authentication');
const { limit, blockBannedIPs } = require('../middlewares/login_rate_limit');  

const router = express.Router();
router.post('/user/signup', userController.postSignup);
router.get('/user/verify/:token',userController.getverify);
router.post('/user/login', blockBannedIPs, limit, userController.postLogin);
//router.get('/home',authentication,userController.gethome);
router.get('/user/offers/:id',authentication,userController.getOffersByService);
router.get('/user/products', authentication,userController.getAllProducts);
router.get('/user/profile', authentication, userController.getProfile);
router.get('/user/getuser/:id', authentication, userController.getUserById);
router.post('/user/changepassword', authentication, userController.postChangePassword);
router.get('/user/picture/:id', authentication, userController.getUserPicture);
router.get('/user/allservices',authentication,userController.getAllServices)
router.put('/user/changeemail', authentication, userController.putChangeEmail);
router.get('/user/services/:id/products',authentication,userController.getProductsByService)
module.exports = router;
