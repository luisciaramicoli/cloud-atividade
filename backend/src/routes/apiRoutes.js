const express = require('express');
const router = express.Router();

const authProxyController = require('../controllers/authProxyController');
const catalogController = require('../controllers/catalogController');
const { authenticateToken, requireAdminCentralized } = require('../middlewares/authMiddleware');

// Auth Proxy
router.post('/register', authProxyController.register);
router.post('/login', authProxyController.login);
router.post('/logout', authProxyController.logout);
router.get('/me', authenticateToken, authProxyController.me);
router.post('/forgot-password', authProxyController.forgotPassword);
router.post('/reset-password', authProxyController.resetPassword);

// Admin Exclusive - List users (Centralized Enforcement via Auth Service)
router.get('/users', authenticateToken, requireAdminCentralized, authProxyController.listUsers);

// Catalog API (Protected)
router.get('/movies', authenticateToken, catalogController.getMovies);
router.get('/favorites', authenticateToken, catalogController.getFavorites);
router.post('/favorites', authenticateToken, catalogController.addFavorite);
router.delete('/favorites/:tmdb_movie_id', authenticateToken, catalogController.removeFavorite);
router.get('/comments/:tmdb_movie_id', authenticateToken, catalogController.getComments);
router.post('/comments', authenticateToken, catalogController.addComment);
router.delete('/comments/:id', authenticateToken, catalogController.deleteComment);

module.exports = router;
