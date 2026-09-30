const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireInternalToken = require('../middlewares/internalAuth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// RBAC Authorization & Admin Management
// Rotas que só o gateway pode chamar (token de serviço): expõem dados de usuários ou alteram perfis.
router.post('/authorize', requireInternalToken, authController.authorize);
router.get('/users', requireInternalToken, authController.listUsers);
router.put('/users/:id/profile', requireInternalToken, authController.updateProfile);

module.exports = router;

