const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.post('/logs', logController.createLog);
router.post('/logs/batch', logController.createLog);
router.get('/logs', logController.getLogs);
router.get('/health', logController.healthCheck);

module.exports = router;

