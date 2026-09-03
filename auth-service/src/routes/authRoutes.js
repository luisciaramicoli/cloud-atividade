const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// RBAC Authorization & Admin Management
router.post('/authorize', authController.authorize);
router.get('/users', authController.listUsers);

module.exports = router;

