const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/optimize', authMiddleware(['worker', 'admin']), routeController.getOptimizedRoute);

module.exports = router;