const express = require('express');
const router = express.Router();

const authProxyController = require('../controllers/authProxyController');
const postController = require('../controllers/postController');
const brandController = require('../controllers/brandController');
const templateController = require('../controllers/templateController');
const profileController = require('../controllers/profileController');
const paymentController = require('../controllers/paymentController');

const {
  authenticateToken,
  requireAdminCentralized,
  requireCreatorOrAdminCentralized
} = require('../middlewares/authMiddleware');
const { avatarUpload } = require('../middlewares/uploadMiddleware');

// 1. Auth Proxy (Registro, Login, Sessão e Recuperação)
router.post('/register', authProxyController.register);
router.post('/login', authProxyController.login);
router.post('/logout', authProxyController.logout);
router.get('/me', authenticateToken, authProxyController.me);
router.post('/forgot-password', authProxyController.forgotPassword);
router.post('/reset-password', authProxyController.resetPassword);

// 2. Administração Exclusiva (RBAC Centralizado)
router.get('/users', authenticateToken, requireAdminCentralized, authProxyController.listUsers);
router.get('/logs', authenticateToken, requireAdminCentralized, authProxyController.listLogs);

// 3. Perfil de Usuário & Upload no MinIO
router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/users/:id/profile', authenticateToken, avatarUpload, profileController.updateProfile);

// 4. Assinatura Stripe (Creator Pro)
router.post('/checkout', authenticateToken, paymentController.createCheckoutSession);
router.post('/webhook', paymentController.handleWebhook);
router.get('/subscription/status', authenticateToken, paymentController.getSubscriptionStatus);

// 5. Posts do Instagram (Recurso Principal do Negócio)
// Leitura: Permitida para todos os papéis autenticados ('criador', 'revisor', 'admin') com isolamento por usuário
router.get('/posts', authenticateToken, postController.getPosts);
router.get('/posts/:id', authenticateToken, postController.getPostById);

// Criação, Edição e Exclusão: Restritas aos papéis 'criador' e 'admin' (papel 'revisor' recebe 403 Forbidden)
router.post('/posts', authenticateToken, requireCreatorOrAdminCentralized, postController.createPost);
router.post('/posts/generate', authenticateToken, requireCreatorOrAdminCentralized, postController.generatePostAI);
router.put('/posts/:id', authenticateToken, requireCreatorOrAdminCentralized, postController.updatePost);
router.delete('/posts/:id', authenticateToken, requireCreatorOrAdminCentralized, postController.deletePost);
router.post('/posts/:id/image', authenticateToken, requireCreatorOrAdminCentralized, avatarUpload, postController.uploadPostImage);

// 6. Marcas & Perfis de Negócio (MinIO Logo Upload)
router.get('/brands', authenticateToken, brandController.getBrands);
router.post('/brands', authenticateToken, requireCreatorOrAdminCentralized, brandController.createBrand);
router.post('/brands/:id/logo', authenticateToken, requireCreatorOrAdminCentralized, avatarUpload, brandController.uploadLogo);

// 7. Templates de Conteúdo Pré-validados
router.get('/templates', authenticateToken, templateController.getTemplates);

module.exports = router;
