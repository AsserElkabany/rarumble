const express = require('express');
const sellerController=require('../controllers/seller');
const authentication=require('../middlewares/authentication');
const loginRateLimit=require('../middlewares/login_rate_limit');

const router = express.Router();
router.post('/seller/signup',authentication,sellerController.postSellersignup);
router.get('/seller/home',authentication,sellerController.gethome);
router.post('/seller/addoffer', authentication, sellerController.postAddoffer);
router.get('/seller/profile', authentication, sellerController.getprofile);
router.get('/getseller/:id', authentication, sellerController.getSellerById);
module.exports = router;
