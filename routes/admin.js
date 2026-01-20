const express = require('express');
const adminController=require('../controllers/admin');
const adminonly=require('../middlewares/adminonly');
const { limit, blockBannedIPs } = require('../middlewares/login_rate_limit');
const router = express.Router();

router.post('/admin/login',blockBannedIPs,limit, adminController.postAdminLogin);
router.get('/admin/getunpaidorders', adminonly, adminController.getUnpaidOrders);
router.get('/admin/getpaidorders', adminonly, adminController.getAllPaidOrders);
router.post('/admin/block/:id', adminonly, adminController.postblockUser);
router.post('/admin/unblock/:id', adminonly, adminController.postunblockUser);
router.post('/admin/addgame', adminonly, adminController.postAddGame);

module.exports = router;