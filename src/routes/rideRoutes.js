// routes/ride.routes.js

const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para buscar o histórico de caronas do usuário autenticado
router.get('/history', authMiddleware.authenticateToken, rideController.getUserRideHistory);

// Nova rota para buscar os detalhes de uma carona específica pelo ID
router.get('/details/:id', authMiddleware.authenticateToken, rideController.getRideDetails);

module.exports = router;

