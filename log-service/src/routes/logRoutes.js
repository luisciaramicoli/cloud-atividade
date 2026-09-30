const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const requireInternalToken = require('../middlewares/internalAuth');

// Trilha de auditoria: só o gateway (token de serviço) pode gravar ou ler, impedindo forjar ou bisbilhotar eventos.
router.post('/logs', requireInternalToken, logController.createLog);
router.post('/logs/batch', requireInternalToken, logController.createLog);
router.get('/logs', requireInternalToken, logController.getLogs);
router.get('/health', logController.healthCheck);

module.exports = router;

