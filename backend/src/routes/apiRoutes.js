const express = require('express');
const router = express.Router();

const authProxyController = require('../controllers/authProxyController');
const catalogController = require('../controllers/catalogController');
const profileController = require('../controllers/profileController');
const { authenticateToken, requireAdminCentralized } = require('../middlewares/authMiddleware');
const { avatarUpload } = require('../middlewares/uploadMiddleware');

// Auth Proxy
router.post('/register', authProxyController.register);
router.post('/login', authProxyController.login);
router.post('/logout', authProxyController.logout);
router.get('/me', authenticateToken, authProxyController.me);
router.post('/forgot-password', authProxyController.forgotPassword);
router.post('/reset-password', authProxyController.resetPassword);

// Admin Exclusive - List users & Audit Logs (Centralized Enforcement via Auth Service)
router.get('/users', authenticateToken, requireAdminCentralized, authProxyController.listUsers);
router.get('/logs', authenticateToken, requireAdminCentralized, authProxyController.listLogs);


// Perfil de usuário (Atividade 6): cada um só edita o próprio (checado pelo req.userId do JWT, nunca pelo :id da URL)
router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/users/:id/profile', authenticateToken, avatarUpload, profileController.updateProfile);

// Catalog API (Protected)
router.get('/movies', authenticateToken, catalogController.getMovies);
router.get('/favorites', authenticateToken, catalogController.getFavorites);
router.post('/favorites', authenticateToken, catalogController.addFavorite);
router.delete('/favorites/:tmdb_movie_id', authenticateToken, catalogController.removeFavorite);
router.get('/comments/:tmdb_movie_id', authenticateToken, catalogController.getComments);
router.post('/comments', authenticateToken, catalogController.addComment);
router.delete('/comments/:id', authenticateToken, catalogController.deleteComment);

module.exports = router;
