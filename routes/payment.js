const express = require('express');
const paymentController=require('../controllers/payment');
const authentication=require('../middlewares/authentication');

const router = express.Router();
router.post('/payment/create-payment', authentication, paymentController.createPayment);
router.post('/payment/paymob/callback', paymentController.handleCallback);

module.exports = router;