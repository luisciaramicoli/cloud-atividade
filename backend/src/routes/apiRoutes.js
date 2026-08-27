const express = require('express');
const router = express.Router();

const authProxyController = require('../controllers/authProxyController');
const catalogController = require('../controllers/catalogController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Auth Proxy
router.post('/register', authProxyController.register);
router.post('/login', authProxyController.login);
router.post('/forgot-password', authProxyController.forgotPassword);
router.post('/reset-password', authProxyController.resetPassword);

// Catalog API (Protected)
router.get('/movies', authenticateToken, catalogController.getMovies);
router.get('/favorites', authenticateToken, catalogController.getFavorites);
router.post('/favorites', authenticateToken, catalogController.addFavorite);
router.delete('/favorites/:tmdb_movie_id', authenticateToken, catalogController.removeFavorite);
router.get('/comments/:tmdb_movie_id', authenticateToken, catalogController.getComments);
router.post('/comments', authenticateToken, catalogController.addComment);

module.exports = router;
