const express = require('express');
const router = express.Router();
const dustbinController = require('../controllers/dustbinController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/nearby', authMiddleware(['citizen']), dustbinController.getNearbyDustbins);
router.get('/prioritized', authMiddleware(['worker', 'admin']), dustbinController.getPrioritizedDustbins);
router.get('/available', authMiddleware(['citizen']), dustbinController.getAvailableDustbins);
router.post('/add', authMiddleware(['admin']), dustbinController.addDustbin);
router.post('/update', authMiddleware(['worker']), dustbinController.updateDustbinStatus);

module.exports = router;